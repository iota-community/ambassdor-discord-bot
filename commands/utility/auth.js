const { SlashCommandBuilder } = require('discord.js');
const { redirectURL } = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('authenticate')
		.setDescription('Authenticate the user.'),
	async execute(interaction) {
		await interaction.reply({content: `Hi ${interaction.user.username}, please visit ${redirectURL} to be authenticated. Your Twitter account should be linked to your discord before you authenticate. .`, ephemeral: true});
	},
};