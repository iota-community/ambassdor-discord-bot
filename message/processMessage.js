const {
  fetchTweet,
  extractTweetId,
  has72HoursPassed,
  logToDiscord,
  calculatePoints,
} = require('../helpers/helpers');
const { Ambassadors, Messages, Tweets } = require('../models/database');

async function processMessage(job) {
  try {
    if (!job || !job.message) {
      console.error('Error: message or message.content is undefined', job);
      return;
    }

    const message = job.message;

    let tweetId = extractTweetId(message.content);
    if (!tweetId) {
      await logToDiscord(
        `⚠️ Unable to extract tweet ID for message: ${message.content}`,
        message.client,
      );
      return message.reply(`Unable to extract tweet ID.`);
    }

    const tweet = await fetchTweet(tweetId);
    if (!tweet) {
      await logToDiscord(`❌ Unable to fetch tweet ${tweetId}`, message.client);
      return message.reply(`Unable to fetch tweet.`);
    }

    tweetId = tweet.id;

    if (!tweet.hashtags.includes('IOTAambassador')) {
      return message.reply(`Tweet does not contain #IOTAambassador hashtag`);
    }

    if (tweet.isRetweet) {
      return message.reply(`This is a retweeted tweet.`);
    }

    if (has72HoursPassed(tweet.timestamp)) {
      return message.reply(
        `72 hours have passed since the post was made on X.`,
      );
    }

    const dupTweet = await Tweets.findOne({ where: { id: tweetId } });
    if (dupTweet) {
      await logToDiscord(
        `⚠️ Duplicate tweet detected: ${tweetId} already exists.`,
        message.client,
      );
      return message.reply(`Duplicate tweet detected.`);
    }

    const ambassador = await Ambassadors.findOne({
      where: { id: message.author.id },
    });
    if (!ambassador) {
      return message.reply(
        `You have not linked your X ID. Use /linkx command to link your account.`,
      );
    }

    if (tweet.userId !== ambassador.x_user_id) {
      return message.reply(
        `X ID of the user who made the post doesn't match the linked X ID.`,
      );
    }

    // let points = 20; // why 20 (bullshit)

    // Get tweet metrics and check for possibe null values.
    // If value is null, set value to 0.
    const likes = tweet.likes || 0;
    const retweets = tweet.retweets || 0;
    const replies = tweet.replies || 0;
    const views = tweet.views || 0;

    // Calculate points
    const points = calculatePoints({
      likeCount: likes,
      retweetCount: retweets,
      replyCount: replies,
      impressionCount: views,
    });
    // points = parseFloat(points).toFixed(2);

    await Messages.create({
      id: message.id,
      channelId: message.channelId,
      authorId: message.author.id,
      createdTimestamp: message.createdTimestamp,
      tweetId: tweetId,
      points: points,
    });

    await Tweets.create({
      id: tweetId,
      author: message.author.id,
      messageId: message.id,
      channelId: message.channelId,
    });

    await logToDiscord(
      `✅ Tweet ${tweetId} successfully stored for ${message.author.username}.`,
      message.client,
    );

    return message.reply(
      `🤍 ${likes}   🔃 ${retweets}   💬 ${replies}   📊 ${views}\n${points} points initially calculated for ${message.author.displayName}. Final credit, based on engagement, after 24 hours.`,
    );
  } catch (error) {
    console.error('❗ Error processing message:', error?.message);
  }
}

module.exports = processMessage;
