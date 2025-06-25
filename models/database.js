// Require Sequelize
const Sequelize = require('sequelize');
const { Ambassador } = require(`./ambassador.js`);
const { Message } = require(`./message.js`);
const { TopPoint } = require(`./toppoint.js`);
const { Tweet } = require(`./tweet.js`);
const { LastTweet } = require(`./lasttweet.js`);
const { EpochPoint } = require(`./epochpoint.js`);
const { State } = require(`./state`);
const { EpochAmbassador } = require(`./epochambassador.js`);

const sequelize = new Sequelize('botdb', 'user', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  // SQLite only
  storage: './data/database.sqlite',
});

const Ambassadors = sequelize.define('ambassadors', Ambassador);
const Messages = sequelize.define('messages', Message);
const TopPoints = sequelize.define('toppoints', TopPoint);
const Tweets = sequelize.define('tweets', Tweet);
const LastTweets = sequelize.define('lasttweets', LastTweet);
const EpochPoints = sequelize.define('epochpoints', EpochPoint);
const States = sequelize.define('state', State);
const EpochAmbassadors = sequelize.define('epochambassadors', EpochAmbassador);

module.exports.Ambassadors = Ambassadors;
module.exports.Messages = Messages;
module.exports.TopPoints = TopPoints;
module.exports.Tweets = Tweets;
module.exports.LastTweets = LastTweets;
module.exports.EpochPoints = EpochPoints;
module.exports.States = States;
module.exports.EpochAmbassadors = EpochAmbassadors;
