const { Events } = require('discord.js');
const { Ambassadors, Messages, TopPoints, Tweets, EpochPoints } = require('../models/database.js');
const { epochStart, guildId } = require("../config.json")
const { assignRoles, scheduleTaskFromDate, updatePoints } = require("../helpers/helpers.js")

// const epochInSeconds = 259200; // 72 hours.

const epochInSeconds = 259200; // 72 hours.

// time in millis that bonus points should be awarded for posts.
const baseLinePointsAwardMillis = 86400000; 


module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		Ambassadors.sync().then(() => {
			// get guild and assign roles.
			client.guilds.fetch(guildId).then(guild => {
				// Reassign role every epoch
				const epochStartDate = epochStart;
				scheduleTaskFromDate(epochStartDate, epochInSeconds, assignRoles, guild);
			})
		});

		Messages.sync().then(() => {
			// Run update points every 120000 seconds.
			updatePoints(120, client);
		});
		TopPoints.sync();
		Tweets.sync();
		EpochPoints.sync();

		setInterval(() => {
			assignBaseLinePoints(client);
		}, baseLinePointsAwardMillis);

		setInterval(() => {
			determineEpochWinner(client);
		}, epochInSeconds * 1000 * 7);

		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
