const { SlashCommandBuilder } = require("discord.js");
const { Ambassadors } = require("../../models/database.js");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View ambassadors leaderboard"),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const ambassadors = await Ambassadors.findAll({
      attributes: ["points", "displayName"],
    });

    let fields = [];

    ambassadors.forEach((ambassador) => {
      field = {
        name: ambassador.displayName,
        value: String(ambassador.points),
        inline: false,
      };

      fields.push(field);
    });

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("The Ambassadors Leaderboard")
      .setAuthor({
        name: "Posted by: " + interaction.client.user.username,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setDescription("Ambassadors displayname and points.")
      .addFields(
        fields
      )
      .setTimestamp()
      .setFooter({
        text: "The leaderboard ",
        iconURL: interaction.client.user.displayAvatarURL(), 
      });

    interaction.editReply({ embeds: [embed] });
  },
};
