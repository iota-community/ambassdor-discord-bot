const { SlashCommandBuilder } = require('discord.js');
const { adminRoleId } = require('../../config.json');
const { updateAmbassadorsAndEpochPoints } = require('../../helpers/helpers.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add points to an ambassador.')
    .addNumberOption((option) =>
      option
        .setName('points')
        .setDescription('Number of points to add.')
        .setRequired(true),
    )
    .addUserOption((option) =>
      option
        .setName('username')
        .setDescription('User to add points to.')
        .setRequired(true),
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('username');
    const points = interaction.options.getNumber('points');

    try {
      await interaction.deferReply();

      const adminRole = interaction.member.roles.cache.some(
        (r) => r.id === adminRoleId,
      );
      if (!adminRole) {
        return interaction.editReply(`Only an admin can execute this command.`);
      }

      const success = await updateAmbassadorsAndEpochPoints(
        user.id,
        points,
        interaction.channelId,
        true,
      );
      if (success) {
        return interaction.editReply(
          `${points} points added to ${user.username} successfully.`,
        );
      } else {
        return interaction.editReply(`Not found user ${user.username}`);
      }
    } catch (error) {
      console.error('❗ Error in addpoints cmd:', error.message);
      return interaction.editReply(
        `Failed to add points to the user ${user.username}.`,
      );
    }
  },
};
