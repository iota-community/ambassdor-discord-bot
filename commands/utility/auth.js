const { SlashCommandBuilder } = require('discord.js');
const { Ambassadors } = require('../../models/database.js');
const { TwitterApi } = require('twitter-api-v2');
const {
  twitter_api_key,
  twitter_api_key_secret,
} = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your X account'),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const client = new TwitterApi({
        appKey: twitter_api_key,
        appSecret: twitter_api_key_secret,
      });
      const authLink = await client.generateAuthLink();
      const url = authLink.url;
      const token = authLink.oauth_token;
      const secret = authLink.oauth_token_secret;
      const ambassador = await Ambassadors.findOne({
        where: { id: interaction.user.id },
      });
      if (ambassador && ambassador.x_user_id) {
        return interaction.editReply(
          `Your Discord and X accounts already linked. To unlink account, use the command /unlink.`,
        );
      } else {
        try {
          await Ambassadors.upsert({
            id: interaction.user.id,
            displayName: interaction.user.displayName,
            oauth_token: token,
            oauth_token_secret: secret,
          });

          return interaction.editReply({
            content: `Visit the provided URL to link your X account\n  ${url}.`,
            ephemeral: true,
          });
        } catch (error) {
          console.log(
            `Error ${error.message} occured creating ambassador account`,
          );

          return interaction.editReply({
            content: `Failed to create ambassador account. Try again later!`,
            ephemeral: true,
          });
        }
      }
    } catch (error) {
      console.error('❗ Error in auth cmd:', error.message);
    }
  },
};
