const {
  getLatestTweet,
  getTweetData,
  isUrlAccessible,
} = require('./twitterUtils');

const twitterUserName = 'iota';
const lastSinceId = '1932784885258764796';
getLatestTweet(twitterUserName, lastSinceId);

const tweetId = '1934517583849328995';
getTweetData(tweetId).then(console.log);

const url = 'https://pbs.twimg.com/media/GtZVVG2WMAAqUs9.jpg';
isUrlAccessible(url).then(console.log);
