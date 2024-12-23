const { Events } = require('discord.js');
const { Ambassadors, Messages, TopPoints } = require('../models/database.js');
const {epochStart, guildId} = require("../config.json")
const {assignRoles, scheduleTaskFromDate, updatePoints} = require("../helpers/helpers.js")

// const epochInSeconds = 1209600; // Seconds in two weeks.

const epochInSeconds = 120; // Seconds in two weeks.

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		Ambassadors.sync().then(()=>{
			// get guild and assign roles.
			client.guilds.fetch(guildId).then(guild => {
				// Reassign role every epoch
				const epochStartDate = epochStart;
				scheduleTaskFromDate(epochStartDate, epochInSeconds, assignRoles, guild); 		
			 })
		});

		Messages.sync().then(()=>{
			// Run update points every 120000 seconds.
			updatePoints(120, client)
		});

		TopPoints.sync();
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
