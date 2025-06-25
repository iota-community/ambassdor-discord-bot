const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { adminRoleId } = require('../../config.json');
const { getEpochAmbassadorPoints } = require('../../helpers/helpers.js');
const fs = require('fs-extra');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('epochpoints')
    .setDescription('Query epoch points.')
    .addNumberOption((option) =>
      option
        .setName('fromepoch')
        .setDescription('Start epoch number.')
        .setRequired(false),
    )
    .addNumberOption((option) =>
      option
        .setName('toepoch')
        .setDescription('End epoch number.')
        .setRequired(false),
    )
    .addUserOption((option) =>
      option
        .setName('username')
        .setDescription('Ambassador user.')
        .setRequired(false),
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('username') || null;
    const fromEpoch = interaction.options.getNumber('fromepoch') || null;
    const toEpoch = interaction.options.getNumber('toepoch') || null;

    try {
      await interaction.deferReply({ ephemeral: true });

      const adminRole = interaction.member.roles.cache.some(
        (r) => r.id === adminRoleId,
      );
      if (!adminRole) {
        return interaction.editReply({
          content: `Only an admin can execute this command.`,
          ephemeral: true,
        });
      }

      const result = await getEpochAmbassadorPoints(
        user ? user.id : null,
        fromEpoch,
        toEpoch,
      );

      if (!Array.isArray(result) || result.length === 0) {
        return interaction.editReply({
          content: 'No per-epoch points collected.',
          ephemeral: true,
        });
      }

      let data = 'id,displayName,points,epoch\n';
      result.forEach((res) => {
        data += `${res.ambassadorId},${res.ambassadorDisplayName},${res.points},${res.epochNumber}\n`;
      });
      await fs.writeFile('ambassadorEpochPoints.csv', data);

      const file = new AttachmentBuilder('ambassadorEpochPoints.csv');
      await interaction.editReply({
        content: 'Pls see the result in this CSV file:',
        files: [file],
      });
    } catch (error) {
      console.error('❗ Error in epochpoints cmd:', error.message);
      return interaction.editReply({
        content: `Failed to query epoch points due to error: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
