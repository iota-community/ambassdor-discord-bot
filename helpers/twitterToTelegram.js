const { twitter_user_accounts_to_monitor } = require('../config.json');
const { LastTweets } = require('../models/database.js');
const { sleep } = require('../helpers/helpers.js');
const { getLatestTweet } = require('./twitterUtils');
const { sendTelegramMessage } = require('./telegramUtils');

async function forwardTweetToTelegram() {
  for (const twitterUserName of twitter_user_accounts_to_monitor) {
    const lastTweetFoundFromDb = await LastTweets.findOne({
      where: { twitterUserName: twitterUserName },
    });

    const lastSinceId = lastTweetFoundFromDb
      ? lastTweetFoundFromDb.sinceId
      : undefined;

    const latestTweet = await getLatestTweet(twitterUserName, lastSinceId);

    if (!latestTweet) {
      console.log('No latest tweet for twitterUserName:', twitterUserName);
    } else {
      await LastTweets.upsert({
        twitterUserName: twitterUserName,
        sinceId: latestTweet.id,
      });

      await sendTelegramMessage(latestTweet.text, latestTweet.mediaGroup);
    }

    // To relax rate-limit
    await sleep(60_000);
  }
}

module.exports = {
  forwardTweetToTelegram,
};
