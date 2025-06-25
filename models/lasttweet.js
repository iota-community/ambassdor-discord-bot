const Sequelize = require('sequelize');

// Store since_id of the last Tweet forwarded to Telegram
const LastTweet = {
  twitterUserName: {
    type: Sequelize.STRING,
    unique: true,
    primaryKey: true,
  },
  sinceId: {
    type: Sequelize.STRING,
  },
};

module.exports.LastTweet = LastTweet;
