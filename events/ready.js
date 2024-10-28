const { Events } = require('discord.js');
const { Ambassadors } = require('../models/database.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		Ambassadors.sync()
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
