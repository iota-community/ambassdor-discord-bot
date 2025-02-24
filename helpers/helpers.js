const { Scraper } = require('@the-convocation/twitter-scraper');
const {
  Ambassadors,
  Messages,
  EpochPoints,
  States,
  Tweets,
} = require('../models/database.js');
const { Sequelize, Op } = require('sequelize');
const { EmbedBuilder, time, TimestampStyles } = require('discord.js');
const {
  log_channel_id,
  epoch_winners_channel_id,
  epochStart,
} = require('../config.json');

// Constants
const NOVICE_MAX = 749; // 249;
const INTERMEDIATE_MIN = 750; // 250; // Renamed for clarity
const INTERMEDIATE_MAX = 2249; // 749;
const ADVANCED_MIN = 2250; // 750;
const ADVANCED_MAX = 14999; // 4999;
const EXPERT_MIN = 15000; // 5000;

// const NOVICE_DECAY = 0;
const INTERMEDIATE_DECAY = 100;
const ADVANCED_DECAY = 250;
const EXPERT_DECAY = 500;

const NOVICE_ROLE = 'Genesis';
const INTERMEDIATE_ROLE = 'Seeder';
const ADVANCED_ROLE = 'Innovator';
const EXPERT_ROLE = 'Visionary';

const EPOCH_IN_DAYS = 3; // 3 days
const EPOCH_IN_MILLIS = EPOCH_IN_DAYS * 24 * 60 * 60 * 1000;
const BASELINE_POINT_AWARD_MILLIS = 24 * 60 * 60 * 1000; // 24 hours
const TWENTY_FOUR_HOURS_IN_MILLIS = 24 * 60 * 60 * 1000;
const ADD_POINTS_TO_AMBASSADORS_IN_MILLIS = 30 * 1000; // 30s
const BASELINE_POINT = 20;
const SEVENTY_TWO_HOURS_IN_MILLIS = 72 * 60 * 60 * 1000;
const DEFAULT_STATE_INDEX = 1;
const NUM_OF_EPOCHS_TO_WIN = 10;

/**
 * Logs a message to a designated Discord channel.
 * Otherwise, it prints the message to the console.
 *
 * @param {string} message - The message to log.
 * @param {object} client - A Discord client instance.
 */
async function logToDiscord(message, client) {
  try {
    if (!client) {
      console.log(message);
      return;
    }
    const logChannelId = log_channel_id ?? '';
    if (!logChannelId) {
      console.error('log channel id not set in config.json.');
      return;
    }
    const logChannel = await client.channels.fetch(logChannelId);
    if (logChannel) {
      await logChannel.send(message);
    } else {
      console.error('Log channel not found.');
    }
  } catch (error) {
    console.error('Failed to log to Discord:', error.message);
  }
}

// Helper function to extract the Tweet ID from a URL.
function extractTweetId(url) {
  const regex = /status\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Calculate points based on tweet metrics.
function calculatePoints({
  likeCount,
  retweetCount,
  replyCount,
  impressionCount,
}) {
  return (
    likeCount * 0.5 + retweetCount * 2 + replyCount * 1 + impressionCount * 0.05
  );
}

// Apply epoch decay based on current points.
function epochDecay(points) {
  if (points <= NOVICE_MAX) {
    return points;
  } else if (points >= INTERMEDIATE_MIN && points <= INTERMEDIATE_MAX) {
    return points - INTERMEDIATE_DECAY;
  } else if (points >= ADVANCED_MIN && points <= ADVANCED_MAX) {
    return points - ADVANCED_DECAY;
  } else if (points >= EXPERT_MIN) {
    return points - EXPERT_DECAY;
  }
  return points;
}

// Return true if the role is one of the known ambassador roles.
function knownRole(role) {
  return [EXPERT_ROLE, NOVICE_ROLE, INTERMEDIATE_ROLE, ADVANCED_ROLE].includes(
    role.name,
  );
}

// Assign a role to an ambassador.
async function assignAmbassadorRole(guild, ambassador, roleName) {
  try {
    const member = await guild.members.fetch(ambassador.id);
    const role = guild.roles.cache.find((r) => r.name === roleName);
    if (!role) {
      console.error(`Role ${roleName} not found in guild ${guild.id}`);
      return;
    }
    await member.roles.add(role);
  } catch (error) {
    console.error('Error assigning role:', error.message);
    await logToDiscord(
      `Error assigning role to ${ambassador.displayName}: ${error.message}`,
      guild.client,
    );
  }
}

// Remove all known ambassador roles from a user.
async function unassignRole(guild, ambassador) {
  try {
    const member = await guild.members.fetch(ambassador.id);
    for (const role of member.roles.cache.values()) {
      if (knownRole(role)) {
        await member.roles.remove(role, 'Unassign role');
      }
    }
  } catch (error) {
    console.error('Error unassigning role:', error.message);
    await logToDiscord(
      `Error unassigning role for ${ambassador.displayName}: ${error.message}`,
      guild.client,
    );
  }
}

async function congratsEpochWinners(guild) {
  try {
    const topEpochPointsList = await EpochPoints.findAll({
      order: [['points', 'DESC']],
      limit: 3, // Only fetch the top 3
    });

    if (topEpochPointsList.length === 0) {
      await logToDiscord(
        `congratsEpochWinners - table EpochPoints empty!`,
        guild.client,
      );
      return;
    }

    let congratulatoryHeader = `🎉 Congratulations `;
    let congratulatoryMsg = '';
    const congratulatoryEmoji = ['🏆', '🏅', '🎖️'];
    const congratulatoryFooter = 'Keep up the great work!';

    for (let idx = 0; idx < topEpochPointsList.length; idx++) {
      const topEpochPoints = topEpochPointsList[idx];
      congratulatoryHeader += `<@${topEpochPoints.id}> `;
      congratulatoryMsg += `${congratulatoryEmoji[idx]} <@${topEpochPoints.id}> with **${displayPointsWith2Decimals(topEpochPoints.points)} points!**\n`;
    }

    const epochX = getCurrentEpochXFromDate(epochStart, EPOCH_IN_DAYS);
    congratulatoryHeader += epochX
      ? `\nYou scored highest in Epoch ${epochX}`
      : '';

    const chan = await guild.client.channels.fetch(
      epoch_winners_channel_id || '1339587440444313622',
    );
    await chan.send(
      congratulatoryHeader +
        `\n\n` +
        congratulatoryMsg +
        `\n` +
        congratulatoryFooter,
    );

    await chan.send('Roles updated. Check it out!');
  } catch (error) {
    console.error('Error in congratsEpochWinners:', error.message);
    await logToDiscord(
      `Error in congratsEpochWinners: ${error.message}`,
      guild.client,
    );
  }

  await EpochPoints.truncate();
}

// For leaderboard
async function getNextEpochTime() {
  const state = await States.findOne({ where: { id: DEFAULT_STATE_INDEX } });
  return Number(state.nextEpochTime);
}

function getRoleFromPoints(currentPoints) {
  let role = NOVICE_ROLE;
  if (currentPoints <= NOVICE_MAX) {
    role = NOVICE_ROLE;
  } else if (
    currentPoints >= INTERMEDIATE_MIN &&
    currentPoints <= INTERMEDIATE_MAX
  ) {
    role = INTERMEDIATE_ROLE;
  } else if (currentPoints >= ADVANCED_MIN && currentPoints <= ADVANCED_MAX) {
    role = ADVANCED_ROLE;
  } else if (currentPoints >= EXPERT_MIN) {
    role = EXPERT_ROLE;
  }
  return role;
}

async function updateAmbassadorRoles(guild) {
  try {
    const ambassadors = await Ambassadors.findAll();
    for (const ambassador of ambassadors) {
      // For every 72 hours counted from the epoch start, Ambassador points will be decayed accordingly
      const currentPoints = epochDecay(Number(ambassador.points || 0));

      await Ambassadors.update(
        { points: currentPoints },
        { where: { id: ambassador.id } },
      );

      // Assign appropriate role based on points
      const role = getRoleFromPoints(currentPoints);

      await unassignRole(guild, ambassador);
      await assignAmbassadorRole(guild, ambassador, role);
    }
  } catch (error) {
    console.error('Error in updateAmbassadorRoles:', error.message);
    await logToDiscord(
      `Error in updateAmbassadorRoles: ${error.message}`,
      guild.client,
    );
  }
}

async function updateNextEpochTime(nextEpochTime = null) {
  try {
    // Update nextEpochTime for the leaderboard
    await States.upsert({
      id: DEFAULT_STATE_INDEX,
      nextEpochTime: nextEpochTime || Date.now() + EPOCH_IN_MILLIS,
    });
  } catch (error) {
    console.error('Error in updateNextEpochTime:', error.message);
  }
}

async function updateRolesAndEpochWinners(guild) {
  await updateAmbassadorRoles(guild);
  await congratsEpochWinners(guild);
  await updateNextEpochTime();
}

// Fetch a tweet using the Twitter scraper.
async function fetchTweet(tweetId) {
  const scraper = new Scraper();
  try {
    const tweet = await scraper.getTweet(tweetId);
    return tweet;
  } catch (error) {
    console.error(`Fetching tweet (${tweetId}) Error: ${error.message}`);
    return null;
  }
}

// Return true if 72 hours have passed since the given timestamp.
function has72HoursPassed(timestamp) {
  const currentTime = Date.now();
  const givenTimeInMs = timestamp * 1000;
  return currentTime - givenTimeInMs >= SEVENTY_TWO_HOURS_IN_MILLIS;
}

// Return true if more than the given number of minutes have passed since the timestamp.
function isMoreThanGivenMinutes(timestamp, minutes) {
  const currentTime = Date.now();
  return currentTime - timestamp > minutes * 60 * 1000;
}

function timeUntilNextRunFromDate(startDate, intervalInMs) {
  const now = new Date();
  const start = new Date(startDate);

  const timeSinceStart = now - start;
  let timeUntilNextRun;
  if (timeSinceStart >= 0) {
    timeUntilNextRun =
      (intervalInMs - (timeSinceStart % intervalInMs)) % intervalInMs;
  } else {
    timeUntilNextRun = -timeSinceStart;
  }

  return timeUntilNextRun;
}

function getCurrentEpochXFromDate(startDate, intervalInDays) {
  try {
    const now = new Date();
    const start = new Date(startDate);

    const timeSinceStart = now - start;
    const daysElapsed = Math.ceil(timeSinceStart / (24 * 60 * 60 * 1000));
    const epochX = Math.floor(daysElapsed / intervalInDays);

    return epochX;
  } catch (error) {
    console.error('Error in getCurrentEpochXFromDate:', error.message);
    return null;
  }
}

function scheduleRolesUpdateAndEpochWinnersFromDate(
  startDate,
  intervalInMs,
  guild,
) {
  const timeUntilNextRun = timeUntilNextRunFromDate(startDate, intervalInMs);
  const nextEpochTime = Date.now() + timeUntilNextRun;

  updateNextEpochTime(nextEpochTime);

  console.log(
    `Next Epoch for roles updating: ${new Date(nextEpochTime).toUTCString()}`,
  );

  setTimeout(async () => {
    await updateRolesAndEpochWinners(guild);
    setInterval(() => updateRolesAndEpochWinners(guild), intervalInMs);
  }, timeUntilNextRun);
}

function scheduleAssignBaselinePointsFromDate(startDate, intervalInMs, client) {
  const timeUntilNextRun = timeUntilNextRunFromDate(startDate, intervalInMs);

  console.log(
    `Next date for assigning baseline points: ${new Date(Date.now() + timeUntilNextRun).toUTCString()}`,
  );

  setTimeout(async () => {
    await assignBaseLinePoints(client);
    setInterval(() => assignBaseLinePoints(client), intervalInMs);
  }, timeUntilNextRun);
}

// Add points to an ambassador based on a message.
async function addPointsToAmbassadorFromMessage(client, msg, curMsgToReply) {
  try {
    const ambassador = await Ambassadors.findOne({
      where: { id: msg.authorId },
    });

    if (ambassador) {
      // Re-calc Tweet points according its latest status
      const tweetId = msg.tweetId;
      const tweet = await fetchTweet(tweetId);
      if (!tweet) {
        await Messages.destroy({ where: { id: msg.id } });
        await logToDiscord(
          `❌ Unable to fetch tweet ${tweetId} for message ${msg.id}`,
          client,
        );
        return;
      }

      const likes = tweet.likes || 0;
      const retweets = tweet.retweets || 0;
      const replies = tweet.replies || 0;
      const views = tweet.views || 0;

      const msgLatestPoints = calculatePoints({
        likeCount: likes,
        retweetCount: retweets,
        replyCount: replies,
        impressionCount: views,
      });

      ///////////////////

      const prevTweets = ambassador.tweets || 0;
      await Ambassadors.update(
        { tweets: prevTweets + 1 },
        { where: { id: ambassador.id } },
      );
      await updateAmbassadorsAndEpochPoints(
        ambassador.id,
        msgLatestPoints,
        msg.channelId,
        true,
      );

      await Messages.destroy({ where: { id: msg.id } });

      // Send reply about the status of msg.
      await curMsgToReply.reply(
        `${displayPointsWith2Decimals(msgLatestPoints)} points added to ${ambassador.displayName} for this post.`,
      );
    }
  } catch (error) {
    console.error('Error in addPointsToAmbassadorFromMessage:', error);
    await logToDiscord(
      `Error in addPointsToAmbassadorFromMessage: ${error.message}`,
      client,
    );
  }
}

// Fetch messages that are eligible for point updates.
async function checkPointsFromMessagesToAddToAmbassadors(client) {
  try {
    // Find messages that are older than 24 hours
    const messages = await Messages.findAll({
      where: {
        createdTimestamp: {
          [Op.lt]: Date.now() - TWENTY_FOUR_HOURS_IN_MILLIS,
        },
      },
    });

    if (!messages || messages.length < 1) return;

    for (const msg of messages) {
      try {
        const chan = await client.channels.fetch(msg.channelId);
        if (chan) {
          const curMsgToReply = await chan.messages.fetch(msg.id);
          if (curMsgToReply) {
            await addPointsToAmbassadorFromMessage(client, msg, curMsgToReply);
          } else {
            // If msg no longer exists in channel (user has deleted it)
            await Messages.destroy({ where: { id: msg.id } });
          }
        }
        // eslint-disable-next-line
      } catch (err) {}
    }
  } catch (error) {
    console.error('Error in checkPointsFromMessagesToAddToAmbassadors:', error);
    await logToDiscord(
      `Error in checkPointsFromMessagesToAddToAmbassadors: ${error.message}`,
      client,
    );
  }
}

async function assignBaseLinePoints(client) {
  try {
    const botState = await States.findOne({
      where: { id: DEFAULT_STATE_INDEX },
    });
    const baselineLastRun = botState ? botState.baselinePointsTime : 0;
    const currDate = new Date();

    await States.upsert({
      id: DEFAULT_STATE_INDEX,
      baselinePointsTime: currDate,
    });

    const tweetList = await Tweets.findAll({
      where: {
        createdAt: { [Op.between]: [new Date(baselineLastRun), currDate] },
      },
    });

    if (!tweetList || tweetList.length === 0) {
      return;
    }

    // Filter out the list to produce unique "author" values
    const uniqueTweetList = tweetList.filter(
      (value, index, self) =>
        index === self.findIndex((t) => t.author === value.author),
    );

    let ambassadorList = '';
    let channel = null;
    for (const tweet of uniqueTweetList) {
      try {
        if (!channel) {
          channel = await client.channels.fetch(tweet.channelId);
        }
        const curMsg = await channel.messages.fetch(tweet.messageId);
        if (!curMsg) continue; // Skip if message is not found

        const ambassadorId = await addBaselinePoints(client, tweet);
        if (ambassadorId) {
          ambassadorList += `<@${ambassadorId}>  `;
        }
      } catch (err) {
        console.error(
          `Error fetching message ${tweet.messageId} in assignBaseLinePoints:`,
          err,
        );
        await logToDiscord(
          `Error fetching message ${tweet.messageId}: ${err.message}`,
          client,
        );
      }
    }

    if (ambassadorList !== '') {
      await channel.send(
        `🎉 Great job! The following ones have earned ${BASELINE_POINT} points for posting in the last 24 hours.` +
          '\n\n' +
          ambassadorList,
      );
    }
  } catch (error) {
    console.error('Error in assignBaseLinePoints:', error);
    await logToDiscord(
      `Error in assignBaseLinePoints: ${error.message}`,
      client,
    );
  }
}

// Add baseline points to an ambassador.
async function addBaselinePoints(client, tweet) {
  try {
    const ambassador = await Ambassadors.findOne({
      where: { id: tweet.author },
    });
    if (ambassador) {
      const lastAwardTime = ambassador.lastBaseLinePointTime
        ? new Date(ambassador.lastBaseLinePointTime)
        : 0;
      if (new Date() - lastAwardTime < BASELINE_POINT_AWARD_MILLIS) {
        return;
      }
      const prevPoints = ambassador.points || 0;
      await Ambassadors.update(
        {
          points: prevPoints + BASELINE_POINT,
          lastBaseLinePointTime: new Date(),
        },
        { where: { id: ambassador.id } },
      );
      return ambassador.id;
    }
  } catch (error) {
    console.error('Error in addBaselinePoints:', error);
    await logToDiscord(`Error in addBaselinePoints: ${error.message}`, client);
    return '';
  }
}

// Determine the epoch winner and announce it.
async function determineEpochWinner(client) {
  try {
    const state = await States.findOne({ where: { id: DEFAULT_STATE_INDEX } });
    if (!state) return;
    const nextEpoch = Date.now() + EPOCH_IN_MILLIS * NUM_OF_EPOCHS_TO_WIN;
    if (!state.nextEpochRoundTime) {
      await States.upsert({
        id: DEFAULT_STATE_INDEX,
        nextEpochRoundTime: nextEpoch,
      });
    }
    if (new Date() > state.nextEpochRoundTime) return;
    const epochPoints = await EpochPoints.findAll({
      order: Sequelize.literal('points DESC'),
    });
    if (epochPoints.length > 0) {
      const epochWinner = epochPoints[0];
      const channel = await client.channels.fetch(epochWinner.channelId);
      if (!channel) return;
      const winner = await channel.guild.members.fetch(epochWinner.id);
      const fields = [
        {
          name: '🏆 Winner of this round: ',
          value: winner.displayName,
          inline: false,
        },
        {
          name: '⏳ Next Epoch winner announcement:',
          value: `${time(new Date(nextEpoch), TimestampStyles.RelativeTime)}`,
          inline: false,
        },
      ];
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Epoch Competition Winner Announcement')
        .addFields(fields)
        .setTimestamp()
        .setFooter({ text: 'Epoch winner announcement' });
      await channel.send({ embeds: [embed] });
      await States.upsert({
        id: DEFAULT_STATE_INDEX,
        epochWinner: epochWinner.id,
        nextEpochRoundTime: nextEpoch,
      });
    } else {
      await States.upsert({
        id: DEFAULT_STATE_INDEX,
        nextEpochRoundTime: nextEpoch,
      });
    }
    // Clear epoch points for the next round.
    await EpochPoints.truncate();
  } catch (error) {
    console.error('Error in determineEpochWinner:', error);
    await logToDiscord(
      `Error in determineEpochWinner: ${error.message}`,
      client,
    );
  }
}

function displayPointsWith2Decimals(points) {
  try {
    return parseFloat(String(points)).toFixed(2);
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return points || 0;
  }
}

// Both "ambassadors" and "epochpoints" tables will be updated (either added or deducted)
async function updateAmbassadorsAndEpochPoints(
  ambassadorId,
  points,
  channelId,
  isAdd,
) {
  const ambassador = await Ambassadors.findOne({ where: { id: ambassadorId } });
  if (ambassador) {
    const prevPoints = ambassador.points;
    const newPoints = isAdd
      ? prevPoints + points
      : prevPoints - points < 0
        ? 0
        : prevPoints - points;

    await Ambassadors.update(
      { points: newPoints },
      { where: { id: ambassadorId } },
    );

    const ambassadorEpochPtr = await EpochPoints.findOne({
      where: { id: ambassadorId },
    });

    if (ambassadorEpochPtr) {
      const prevPoints = ambassadorEpochPtr.points;
      const newPoints = isAdd
        ? prevPoints + points
        : prevPoints - points < 0
          ? 0
          : prevPoints - points;

      await EpochPoints.update(
        { points: newPoints },
        { where: { id: ambassadorId } },
      );
    } else {
      await EpochPoints.create({
        id: ambassadorId,
        points: isAdd ? points : 0,
        channelId,
      });
    }
    return true;
  } else {
    // Not found Ambassador
    return false;
  }
}

module.exports = {
  has72HoursPassed,
  updateRolesAndEpochWinners,
  fetchTweet,
  extractTweetId,
  calculatePoints,
  scheduleRolesUpdateAndEpochWinnersFromDate,
  scheduleAssignBaselinePointsFromDate,
  checkPointsFromMessagesToAddToAmbassadors,
  isMoreThanGivenMinutes,
  determineEpochWinner,
  assignBaseLinePoints,
  logToDiscord,
  BASELINE_POINT_AWARD_MILLIS,
  EPOCH_IN_MILLIS,
  ADD_POINTS_TO_AMBASSADORS_IN_MILLIS,
  DEFAULT_STATE_INDEX,
  displayPointsWith2Decimals,
  getNextEpochTime,
  updateAmbassadorsAndEpochPoints,
};
