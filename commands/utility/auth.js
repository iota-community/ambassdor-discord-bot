const { SlashCommandBuilder } = require('discord.js');
const {Ambassadors} = require('../../models/database.js')
const {TwitterApi} = require('twitter-api-v2');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('linkx')
		.setDescription('Link your X account'),
	async execute(interaction) {
		await interaction.deferReply({ephemeral: true });
		const client = new TwitterApi({ appKey: process.env.API_KEY, appSecret: process.env.API_KEY_SECRET });
		const authLink = await client.generateAuthLink();
		const url = authLink.url;
		const token = authLink.oauth_token;
		const secret = authLink.oauth_token_secret;
		Ambassadors.findOne({ where: { id: interaction.user.id } }).then(ambassador => {
			if(ambassador) {
				// return if X id is already linked.
				if (ambassador.tweeter_id) {
					return interaction.editReply(`Your X Id is already linked, contact admin.`);
				}
				Ambassadors.update({oauth_token: token, oauth_token_secret: secret}, {where: {id: ambassador.id}}).then(affectedRows =>{
					if (affectedRows > 0) {
						return interaction.editReply({content: `Visit the provided URL to link your X account\n  ${url}.`, ephemeral: true});
					} else {
						return interaction.editReply(`An error occured linking your X Id, please contact admin`);
					}
				})
			} else {
				Ambassadors.create({
					id: interaction.user.id,
					displayName: interaction.user.displayName,
					oauth_token: token, 
					oauth_token_secret: secret
				}).then(amb => {
					console.log(`Ambassador ${amb.displayName} added.`);
					return interaction.editReply({content: `Visit the provided URL to link your X account\n  ${url}.`, ephemeral: true});
				})
			}
		});
	},
};