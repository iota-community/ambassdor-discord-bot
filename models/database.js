// Require Sequelize
const Sequelize = require('sequelize');
const {Ambassador} = require(`./ambassador.js`);
const {Message} = require(`./message.js`);
const {TopPoint} = require(`./toppoint.js`);

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

module.exports.Ambassadors = Ambassadors;
module.exports.Messages = Messages;
module.exports.TopPoints = TopPoints;