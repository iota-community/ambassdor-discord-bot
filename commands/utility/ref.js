const { SlashCommandBuilder } = require('discord.js');
const {Ambassadors} = require('../../models/database.js')
const {TwitterApi} = require('twitter-api-v2');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('refcode')
		.setDescription('View your refferal code'),
	async execute(interaction) {
		await interaction.deferReply({ephemeral: true });
		Ambassadors.findOne({ where: { id: interaction.user.id } }).then(ambassador => {
			if(ambassador) {
				return interaction.editReply({content: `Hi ${interaction.user.username}, your refferal code is:  ${ambassador.referral_code}.`, ephemeral: true});
			} else {
				return interaction.editReply({content: `Cannot find your refferal code, please contact admin.`, ephemeral: true});
			}
		});
	},
};