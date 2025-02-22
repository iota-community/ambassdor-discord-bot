const { SlashCommandBuilder } = require('discord.js');
const { Ambassadors } = require('../../models/database.js');
const { TwitterApi } = require('twitter-api-v2');
const {
  twitter_api_key,
  twitter_api_key_secret,
} = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('authpin')
    .setDescription('X authorization PIN')
    .addStringOption((option) =>
      option
        .setName('pin')
        .setDescription('Your X authorization PIN')
        .setRequired(true),
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const ambassador = await Ambassadors.findOne({
        where: { id: interaction.user.id },
      });
      if (ambassador) {
        // return if X id is already linked.
        if (ambassador.x_user_id) {
          return interaction.editReply(
            `Your Discord and X accounts already linked. To unlink account, use the command /unlink.`,
          );
        }

        const client = new TwitterApi({
          appKey: twitter_api_key,
          appSecret: twitter_api_key_secret,
          accessToken: ambassador.oauth_token,
          accessSecret: ambassador.oauth_token_secret,
        });

        const pin = interaction.options.getString('pin');
        const loginResult = await client.login(pin);

        const affectedRows = await Ambassadors.update(
          {
            x_user_id: loginResult.userId,
            x_screen_name: loginResult.screenName,
          },
          {
            where: { id: ambassador.id },
          },
        );

        if (affectedRows > 0) {
          return interaction.editReply({
            content: `Your X account ${loginResult.screenName} linked successfully.`,
            ephemeral: true,
          });
        } else {
          return interaction.editReply(
            `An error occured linking your X Id. Please contact admin`,
          );
        }
      } else {
        return interaction.editReply({
          content: `Please use the command /link before this command.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error('❗ Error in authpin cmd:', error.message);
      return interaction.editReply(
        `An error occured linking your X Id (most probably due to wrong PIN).`,
      );
    }
  },
};
