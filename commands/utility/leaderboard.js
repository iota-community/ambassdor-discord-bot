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

      const nextEpochTime = await getNextEpochTime();
      let description = `Your current points: ${displayPointsWith2Decimals(currUser.points)}\n`;
      description += `Next epoch date: ${new Date(nextEpochTime).toUTCString()}\n`;
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
