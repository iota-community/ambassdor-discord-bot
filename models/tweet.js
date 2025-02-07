const Sequelize = require('sequelize');

// List of known tweet IDs vs authors id.

const Tweet = {
    id: {
		type: Sequelize.STRING,
		unique: true,
        primaryKey: true,
	},
    author: {
        type: Sequelize.STRING,
    },
    channelId: {
        type: Sequelize.STRING,
    },
    messageId: {
        type: Sequelize.STRING,
        unique: true
    },
    
}

module.exports.Tweet = Tweet;