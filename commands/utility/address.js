const { SlashCommandBuilder } = require('discord.js');
const { Ambassadors } = require('../../models/database.js');
const { isValidIotaAddressRegex } = require('../../helpers/helpers.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('address')
    .setDescription('Set your IOTA wallet address')
    .addStringOption((option) =>
      option
        .setName('youraddress')
        .setDescription('Your IOTA wallet address')
        .setRequired(true),
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const ambassador = await Ambassadors.findOne({
        where: { id: interaction.user.id },
      });
      if (ambassador) {
        let youraddress = interaction.options.getString('youraddress');
        youraddress = youraddress.trim();

        if (!isValidIotaAddressRegex(youraddress)) {
          return interaction.editReply({
            content: `Please provide a valid IOTA wallet address.`,
            ephemeral: true,
          });
        }

        const affectedRows = await Ambassadors.update(
          {
            address: youraddress,
          },
          {
            where: { id: ambassador.id },
          },
        );

        if (affectedRows > 0) {
          return interaction.editReply({
            content: `Your IOTA wallet address has been set successfully.`,
            ephemeral: true,
          });
        } else {
          return interaction.editReply(
            'An error occured setting your IOTA wallet address. Please contact admin',
          );
        }
      } else {
        return interaction.editReply({
          content: `Please use the command /link before this command.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error('❗ Error in address cmd:', error.message);
      return interaction.editReply(
        'An error occured setting your IOTA wallet address. Please contact admin',
      );
    }
  },
};
