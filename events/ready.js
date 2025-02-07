const { Events } = require('discord.js');
const { Ambassadors, Messages, TopPoints, Tweets, EpochPoints, States } = require('../models/database.js');
const { epochStart, guildId } = require("../config.json")
const { assignRoles, scheduleTaskFromDate, updatePoints, assignBaseLinePoints, determineEpochWinner,
	EPOCH_IN_SECONDS, BASELINE_POINT_AWARD_MILLIS, DEFAUL_STATE_INDEX } = require("../helpers/helpers.js");

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		await Ambassadors.sync().then(async () => {
			// get guild and assign roles.
			await client.guilds.fetch(guildId).then(guild => {
				// Reassign role every epoch
				scheduleTaskFromDate(epochStart, EPOCH_IN_SECONDS, assignRoles, guild);
			})
		});

		await Messages.sync().then(async () => {
			// Run update points every 30000 seconds.
			await updatePoints(30000, client);
		});
		await TopPoints.sync();
		await Tweets.sync();
		await EpochPoints.sync();
		await States.sync().then(()=>{
			States.upsert({ id: DEFAUL_STATE_INDEX, startupTime: new Date()}, { id: DEFAUL_STATE_INDEX });
		});

		await setInterval(() => {
			assignBaseLinePoints(client);
		}, BASELINE_POINT_AWARD_MILLIS);

		await setInterval(() => {
			determineEpochWinner(client);
		}, EPOCH_IN_SECONDS * 1000);

		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
