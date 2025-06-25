const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { adminRoleId } = require('../../config.json');
const { Ambassadors } = require('../../models/database.js');
const { Op } = require('sequelize');
const fs = require('fs-extra');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queryaddress')
    .setDescription('Query Ambassador Addresses.'),
  async execute(interaction) {
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

      const ambassadors = await Ambassadors.findAll({
        attributes: ['id', 'displayName', 'address'],
        where: {
          address: {
            [Op.not]: null,
          },
        },
      });

      if (ambassadors.length === 0) {
        return interaction.editReply({
          content: 'No ambassadors with addresses found.',
          ephemeral: true,
        });
      }

      let data = 'id,displayName,address\n';
      ambassadors.forEach((ambassador) => {
        data += `${ambassador.id},${ambassador.displayName},${ambassador.address}\n`;
      });
      await fs.writeFile('ambassadorAddress.csv', data);

      const file = new AttachmentBuilder('ambassadorAddress.csv');
      await interaction.editReply({
        content: 'Pls see the result in this CSV file:',
        files: [file],
      });
    } catch (error) {
      console.error('❗ Error in queryaddress cmd:', error.message);
      return interaction.editReply({
        content: `queryaddress error: ${error.message}.`,
        ephemeral: true,
      });
    }
  },
};
