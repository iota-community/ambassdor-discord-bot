const { SlashCommandBuilder } = require("discord.js");
const { Ambassadors } = require("../../models/database.js");
const { TwitterApi } = require("twitter-api-v2");
const {twitter_api_key, twitter_api_key_secret} = require('../../config.json');


module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your X account"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const client = new TwitterApi({
      appKey: twitter_api_key,
      appSecret: twitter_api_key_secret,
    });
    const authLink = await client.generateAuthLink();
    const url = authLink.url;
    const token = authLink.oauth_token;
    const secret = authLink.oauth_token_secret;
    Ambassadors.findOne({ where: { id: interaction.user.id } }).then(
      async (ambassador) => {
        if (ambassador) {
          // return if X id is already linked.
          if (ambassador.x_user_id) {
            return interaction.editReply(
              `Your X Id is already linked, contact admin.`
            );
          }
          Ambassadors.update(
            { oauth_token: token, oauth_token_secret: secret },
            { where: { id: ambassador.id } }
          ).then((affectedRows) => {
            if (affectedRows > 0) {
              return interaction.editReply({
                content: `Visit the provided URL to link your X account\n  ${url}.`,
                ephemeral: true,
              });
            } else {
              return interaction.editReply(
                `An error occured linking your X Id, please contact admin`
              );
            }
          });
        } else {
          try {
            Ambassadors.create({
              id: interaction.user.id,
              displayName: interaction.user.displayName,
              oauth_token: token,
              oauth_token_secret: secret,
            }).then((amb) => {
              return interaction.editReply({
                content: `Visit the provided URL to link your X account\n  ${url}.`,
                ephemeral: true,
              });
            });
          } catch (error) {
            console.log(`Error ${error} occured creating ambassador account`);
            return interaction.editReply({
              content: `Failed to create ambassador account try again later.`,
              ephemeral: true,
            });
          }
        }
      }
    );
  },
};