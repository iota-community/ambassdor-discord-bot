const { SlashCommandBuilder } = require('discord.js');
const {Ambassadors} = require('../../models/database.js');
const {TwitterApi} = require('twitter-api-v2');
const {twitter_api_key, twitter_api_key_secret} = require('../../config.json');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('authpin')
		.setDescription('X authorization PIN')
		.addStringOption(option =>
			option
				.setName('pin')
				.setDescription('Your X authorization PIN')
			    .setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply({ephemeral: true });
		
		Ambassadors.findOne({ where: { id: interaction.user.id } }).then(ambassador => {
			if(ambassador) {
				// return if X id is already linked.
				if (ambassador.tweeter_id) {
					return interaction.editReply(`Your X Id is already linked, contact admin.`);
				}

				const client = new TwitterApi({ appKey: twitter_api_key, appSecret: twitter_api_key_secret, accessToken: ambassador.oauth_token, accessSecret: ambassador.oauth_token_secret});
				const pin = interaction.options.getString('pin');
				client.login(pin).then(loginResult => {
					Ambassadors.update({
						x_user_id: loginResult.userId, 
						x_access_token: loginResult.accessToken, 
						x_screen_name: loginResult.screenName, 
						x_access_secret: loginResult.accessSecret}, {where: {id: ambassador.id}}).then(affectedRows =>{
						if (affectedRows > 0) {
							return interaction.editReply({content: `Your X account:  ${loginResult.screenName} has been linked successfully.`, ephemeral: true});
						} else {
							return interaction.editReply(`An error occured linking your X Id, please contact admin`);
						}
					})
				});
				return;
			} else {
				return interaction.editReply({content: `Use command /linkx to link your X account.`, ephemeral: true});
			}
		});
	},
};