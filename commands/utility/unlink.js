const { SlashCommandBuilder } = require('discord.js');
const { Ambassadors } = require('../../models/database.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Unlink your X account'),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const ambassador = await Ambassadors.findOne({
        where: { id: interaction.user.id },
      });
      if (ambassador) {
        if (!ambassador.x_user_id) {
          return interaction.editReply(`Your X account not yet linked!`);
        }
        const affectedRows = await Ambassadors.update(
          {
            x_user_id: '',
            oauth_token: '',
            oauth_token_secret: '',
            x_screen_name: '',
          },
          { where: { id: ambassador.id } },
        );
        if (affectedRows > 0) {
          return interaction.editReply({
            content: `Your X id has been unlinked.`,
            ephemeral: true,
          });
        } else {
          return interaction.editReply(
            `An error occured unlinking your X Id, please contact admin`,
          );
        }
      } else {
        return interaction.editReply({
          content: `Your Discord account not yet linked!`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error('❗ Error in unlink cmd:', error.message);
    }
  },
};
