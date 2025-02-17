const {
  SlashCommandBuilder,
  EmbedBuilder,
  time,
  TimestampStyles,
} = require("discord.js");
const { Ambassadors, States } = require("../../models/database.js");
const {
  logToDiscord,
  DEFAULT_STATE_INDEX,
  EPOCH_IN_SECONDS,
} = require("../../helpers/helpers.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View ambassadors leaderboard"),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const ambassadors = await Ambassadors.findAll({
        attributes: ["points", "displayName"],
        order: [["points", "DESC"]],
      });

      // Filter ambassadors with points > 0, limit to 25, and map to embed fields.
      const fields = ambassadors
        .filter((ambassador) => Number(ambassador.points) > 0)
        .slice(0, 25)
        .map((ambassador) => ({
          name: ambassador.displayName,
          value: String(ambassador.points),
          inline: false,
        }));

      // Add additional state info if available.
      const state = await States.findOne({
        where: { id: DEFAULT_STATE_INDEX },
      });
      if (state) {
        const epochNum = state.epoch ?? 0;
        fields.push({
          name: "Current Epoch:",
          value: `${epochNum}`,
          inline: true,
        });

        let nextEpochTime =
          state.nextEpochTime ??
          new Date(state.startupTime + EPOCH_IN_SECONDS * 1000);
        fields.push({
          name: "⏳ Epoch ends:",
          value: `${time(new Date(nextEpochTime), TimestampStyles.RelativeTime)} (${time(new Date(nextEpochTime), TimestampStyles.ShortDateTime)})`,
          inline: false,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("The Ambassadors Leaderboard")
        .setDescription("Here are the top ambassadors by points:")
        .addFields(fields)
        .setTimestamp()
        .setFooter({ text: "Leaderboard" });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("❗ Error in leaderboard command:", error);

      // Log error to Discord
      await logToDiscord(
        `❗ **Error in leaderboard command:**\n\`\`\`${error.message}\`\`\``
      );

      await interaction.editReply(
        "There was an error while executing this command."
      );
    }
  },
};
