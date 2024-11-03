const { Events } = require('discord.js');
const { Ambassadors } = require('../models/database.js');
const {epochStart, guildId} = require("../config.json")
const {assignRoles, scheduleTaskFromDate} = require("../helpers/helpers.js")

const epochInSeconds = 1209600; // Seconds in two weeks.

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
		})
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
