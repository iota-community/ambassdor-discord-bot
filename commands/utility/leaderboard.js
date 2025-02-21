const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Ambassadors } = require('../../models/database.js');
const {
  displayPointsWith2Decimals,
  getNextEpochTime,
} = require('../../helpers/helpers.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View ambassadors leaderboard'),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const ambassadors = await Ambassadors.findAll({
        attributes: ['points', 'displayName', 'id'],
        order: [['points', 'DESC']],
        limit: 25,
      });

      // Map to embed fields.
      const fields = ambassadors.map((ambassador) => ({
        name: ambassador.displayName,
        value: displayPointsWith2Decimals(ambassador.points),
        inline: false,
      }));

      // Find the current user
      const currUser = await Ambassadors.findOne({
        attributes: ['points', 'displayName', 'id'],
        where: { id: interaction.user.id },
      });

      // If adding more fields here to the embed, it will get crashed due to max of 25 fields
      // TODO: what is this for?
      /*
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
*/

      let description = `Your current points: ${displayPointsWith2Decimals(currUser.points)}\n`;
      description += `Next epoch date: ${new Date(getNextEpochTime()).toUTCString()}\n`;
      description += `\n`;
      description += `Here are the top ambassadors by points`;

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('The Ambassadors Leaderboard')
        .setDescription(description)
        .addFields(fields)
        .setTimestamp()
        .setFooter({
          text: 'Leaderboard',
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('❗ Error in leaderboard command:', error.message);

      await interaction.editReply(
        'There was an error while executing this command.',
      );
    }
  },
};
