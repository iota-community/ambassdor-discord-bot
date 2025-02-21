const { Scraper } = require('@the-convocation/twitter-scraper');
const {
  Ambassadors,
  Messages,
  TopPoints,
  EpochPoints,
  States,
  Tweets,
} = require('../models/database.js');
const { Sequelize, Op } = require('sequelize');
const { EmbedBuilder, time, TimestampStyles } = require('discord.js');
const { log_channel_id } = require('../config.json');

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

const EPOCH_IN_SECONDS = 72 * 60 * 60;
const BASELINE_POINT_AWARD_MILLIS = 24 * 60 * 60 * 1000; // Every 24 hours
const TWENTY_FOUR_HOURS_IN_MILLIS = 24 * 60 * 60 * 1000;
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

async function congratsTop3(guild) {
  try {
    let chan = null;

    // Fetch top 3 ambassadors by points
    const topPointsList = await TopPoints.findAll({
      order: [['points', 'DESC']],
      limit: 3, // Only fetch the top 3 ambassadors
    });

    let congratulatoryHeader = `🎉 Top 3 Congratulations`;
    let congratulatoryMsg = '';
    let congratulatoryEmoji = ['🏆', '🏅', '🎖️'];

    for (let idx = 0; idx < topPointsList.length; idx++) {
      const toppoint = topPointsList[idx];
      const ambassador = await Ambassadors.findOne({
        where: { id: toppoint.authorId },
        attributes: ['id', 'displayName', 'x_screen_name'],
      });

      if (ambassador) {
        try {
          chan = await guild.client.channels.fetch(toppoint.channelId);
        } catch (err) {
          console.error('Error fetching channel:', err.message);
          await logToDiscord(
            `Error fetching channel: ${err.message}`,
            guild.client,
          );
          continue;
        }

        congratulatoryHeader += ` <@${ambassador.displayName}>`;
        congratulatoryMsg += `${congratulatoryEmoji[idx]} <@${ambassador.x_screen_name}> with **${toppoint.points} points!**\n`;
      }
    }

    await chan.send(congratulatoryHeader + `\n` + congratulatoryMsg);
  } catch (error) {
    console.error('Error in congratsTop3:', error.message);
    await logToDiscord(`Error in congratsTop3: ${error.message}`, guild.client);
  }
}

async function getNextEpochTime() {
  const state = await States.findOne({ where: { id: DEFAULT_STATE_INDEX } });
  return state.nextEpochTime;
}

async function assignRoles(guild) {
  try {
    const state = await States.findOne({ where: { id: DEFAULT_STATE_INDEX } });
    let currentEpoch = state.epoch ?? 0;

    // TODO
    // await congratsTop3(guild);

    // Process Ambassadors in Batches
    const BATCH_SIZE = 50;
    let offset = 0;

    while (true) {
      const ambassadors = await Ambassadors.findAll({
        // attributes: ['id', 'points', 'displayName'],
        limit: BATCH_SIZE,
        offset,
      });

      if (ambassadors.length === 0) {
        break;
      }

      for (const ambassador of ambassadors) {
        // For every 72 hours counted from the epoch start, Ambassador points will be decayed accordingly
        let currentPoints = epochDecay(Number(ambassador.points || 0));

        await Ambassadors.update(
          { points: currentPoints },
          { where: { id: ambassador.id } },
        );

        // Assign appropriate role based on points
        let role = NOVICE_ROLE;
        if (currentPoints <= NOVICE_MAX) {
          role = NOVICE_ROLE;
        } else if (
          currentPoints >= INTERMEDIATE_MIN &&
          currentPoints <= INTERMEDIATE_MAX
        ) {
          role = INTERMEDIATE_ROLE;
        } else if (
          currentPoints >= ADVANCED_MIN &&
          currentPoints <= ADVANCED_MAX
        ) {
          role = ADVANCED_ROLE;
        } else if (currentPoints >= EXPERT_MIN) {
          role = EXPERT_ROLE;
        }

        await unassignRole(guild, ambassador);
        await assignAmbassadorRole(guild, ambassador, role);
      }

      offset += BATCH_SIZE;
    }

    // Update epoch state
    let epochTime = state.nextEpochTime ?? Date.now();
    epochTime = epochTime + EPOCH_IN_SECONDS * 1000;
    await States.upsert({
      id: DEFAULT_STATE_INDEX,
      epoch: currentEpoch + 1,
      nextEpochTime: epochTime,
    });
    // Clear the TopPoints table for the next epoch
    await TopPoints.truncate();
  } catch (error) {
    console.error('Error in assignRoles:', error);
    await logToDiscord(`Error in assignRoles: ${error.message}`, guild.client);
  }
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

function scheduleRolesUpdatePerEpochFromDate(startDate, intervalInMs, guild) {
  const timeUntilNextRun = timeUntilNextRunFromDate(startDate, intervalInMs);
  const nextEpochTime = Date.now() + timeUntilNextRun;
  try {
    States.upsert({
      id: DEFAULT_STATE_INDEX,
      nextEpochTime,
    });
  } catch (err) {
    console.log(`Error udating next epoch time ${err}`);
  }

  console.log(
    `Next Epoch for roles updating: ${new Date(nextEpochTime).toLocaleString()}`,
  );

  setTimeout(async () => {
    await assignRoles(guild);
    setInterval(() => assignRoles(guild), intervalInMs);
  }, timeUntilNextRun);
}

function scheduleAssignBaselinePointsFromDate(startDate, intervalInMs, client) {
  const timeUntilNextRun = timeUntilNextRunFromDate(startDate, intervalInMs);

  console.log(
    `Next date for assigning baseline points: ${new Date(Date.now() + timeUntilNextRun).toLocaleString()}`,
  );

  setTimeout(async () => {
    await assignBaseLinePoints(client);
    setInterval(() => assignBaseLinePoints(client), intervalInMs);
  }, timeUntilNextRun);
}

// Update points by periodically fetching messages.
function updatePoints(intervalInSeconds, client) {
  setInterval(() => fetchPoints(client), intervalInSeconds * 1000);
}

// Add points to an ambassador based on a message.
async function addPoints(client, msg, curMsgToReply) {
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

      const prevPoints = ambassador.points || 0;
      const prevTweets = ambassador.tweets || 0;
      await Ambassadors.update(
        { points: prevPoints + msgLatestPoints, tweets: prevTweets + 1 },
        { where: { id: ambassador.id } },
      );

      await Messages.destroy({ where: { id: msg.id } });

      // TODO
      try {
        let ambassadorPoint = await EpochPoints.findOne({
          where: { id: ambassador.id },
        });
        if (ambassadorPoint) {
          await EpochPoints.update(
            { points: ambassadorPoint.points + msgLatestPoints },
            { where: { id: ambassadorPoint.id } },
          );
        } else {
          await EpochPoints.create({
            id: ambassador.id,
            points: msgLatestPoints,
            channelId: msg.channelId,
          });
        }
      } catch (err) {
        console.error(`Error updating epoch point: ${err}`);
        await logToDiscord(
          `Error updating epoch point for ${ambassador.displayName}: ${err.message}`,
          client,
        );
      }

      const topPts = await TopPoints.findAll({
        order: Sequelize.literal('points DESC'),
      });
      // Keep only top 2 and thus delete the rest
      if (topPts.length > 2) {
        const idsToDelete = topPts.slice(2).map((msg) => msg.id);

        // Mass deletion
        await TopPoints.destroy({
          where: {
            id: {
              [Op.in]: idsToDelete,
            },
          },
        });
      }
      // Then, insert one new to have 3 top
      try {
        await TopPoints.create({
          id: msg.id,
          authorId: msg.authorId,
          points: msgLatestPoints,
          channelId: msg.channelId,
        });
      } catch (err) {
        console.error(`Error creating TopPoints: ${err}`);
        await logToDiscord(
          `Error creating TopPoints for message ${msg.id}: ${err.message}`,
          client,
        );
      }
      // Send reply about the status of msg.
      await curMsgToReply.reply(
        `${displayPointsWith2Decimals(msgLatestPoints)} points added to ${ambassador.displayName} for this post.`,
      );
    }
  } catch (error) {
    console.error('Error in addPoints:', error);
    await logToDiscord(`Error in addPoints: ${error.message}`, client);
  }
}

// Fetch messages that are eligible for point updates.
async function fetchPoints(client) {
  try {
    // Find messages that are older than 24 hours
    const messages = await Messages.findAll({
      // attributes: ['id', 'channelId', 'createdTimestamp', 'authorId', 'points'],
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
            await addPoints(client, msg, curMsgToReply);
          } else {
            // If msg no longer exists in channel (user has deleted it)
            await Messages.destroy({ where: { id: msg.id } });
          }
        }
        // eslint-disable-next-line
      } catch (err) {}
    }
  } catch (error) {
    console.error('Error in fetchPoints:', error);
    await logToDiscord(`Error in fetchPoints: ${error.message}`, client);
  }
}

async function assignBaseLinePoints(client) {
  try {
    const botState = await States.findOne({
      where: { id: DEFAULT_STATE_INDEX },
    });
    let baselineLastRun = botState ? botState.baselinePointsTime : 0;
    const batchSize = 50;
    let offset = 0;

    const currDate = new Date();

    while (true) {
      const tweetList = await Tweets.findAll({
        where: {
          createdAt: { [Op.between]: [new Date(baselineLastRun), currDate] },
        },
        limit: batchSize,
        offset: offset,
      });

      if (!tweetList || tweetList.length === 0) {
        break;
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

          const ambassadorName = await addBaselinePoints(client, tweet);
          if (ambassadorName) {
            ambassadorList += `<@${ambassadorName}> `;
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
            '\n' +
            ambassadorList,
        );
      }

      offset += batchSize; // Move to the next batch
    }

    await States.upsert({
      id: DEFAULT_STATE_INDEX,
      baselinePointsTime: currDate,
    });
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
      return ambassador.displayName;
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
    const nextEpoch =
      Date.now() + 1000 * EPOCH_IN_SECONDS * NUM_OF_EPOCHS_TO_WIN;
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

module.exports = {
  has72HoursPassed,
  assignRoles,
  fetchTweet,
  extractTweetId,
  calculatePoints,
  scheduleRolesUpdatePerEpochFromDate,
  scheduleAssignBaselinePointsFromDate,
  updatePoints,
  isMoreThanGivenMinutes,
  determineEpochWinner,
  assignBaseLinePoints,
  logToDiscord,
  BASELINE_POINT_AWARD_MILLIS,
  EPOCH_IN_SECONDS,
  DEFAULT_STATE_INDEX,
  displayPointsWith2Decimals,
  getNextEpochTime,
};
