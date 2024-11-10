const { Events } = require('discord.js');
const { Ambassadors, Messages } = require('../models/database.js');
const {epochStart, guildId} = require("../config.json")
const {assignRoles, scheduleTaskFromDate, updatePoints} = require("../helpers/helpers.js")

const epochInSeconds = 120; // Seconds in two weeks.

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		Ambassadors.sync().then(()=>{
			// get guild and assign roles.
			client.guilds.fetch(guildId).then(guild => {
				// Reassign role every epoch
				const epochStartDate = epochStart || new Date().toLocaleDateString();
				scheduleTaskFromDate(epochStartDate, epochInSeconds, assignRoles, guild); 		
			 })
		});

		Messages.sync().then(()=>{
			// Run update points every 120000 seconds.
			updatePoints(120, client)
		});
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
