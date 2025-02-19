const { SlashCommandBuilder } = require('discord.js');
const { Ambassadors, EpochPoints } = require('../../models/database.js');
const { adminRoleId } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deduct')
    .setDescription('Deduct points from an ambassador.')
    .addNumberOption((option) =>
      option
        .setName('points')
        .setDescription('Number of points to deduct.')
        .setRequired(true),
    )
    .addUserOption((option) =>
      option
        .setName('username')
        .setDescription('User to deduct points from.')
        .setRequired(true),
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const adminRole = interaction.member.roles.cache.some(
        (r) => r.id === adminRoleId,
      );
      if (!adminRole) {
        return interaction.editReply(`Only an admin can execute this command.`);
      }

      const user = interaction.options.getUser('username');
      const points = interaction.options.getNumber('points');

      Ambassadors.findOne({ where: { id: user.id } }).then((ambassador) => {
        if (ambassador) {
          let curPoints = ambassador.points - points;
          // Avoid negative points.
          if (curPoints < 0) {
            curPoints = 0;
          }
          Ambassadors.update(
            { points: curPoints },
            { where: { id: ambassador.id } },
          ).then((affectedRows) => {
            try {
              EpochPoints.findOne({ where: { id: ambassador.id } }).then(
                (ambassadorPoint) => {
                  if (ambassadorPoint) {
                    let ambPoints = ambassadorPoint.points - points;
                    // Avoid negative points.
                    if (ambPoints < 0) {
                      ambPoints = 0;
                    }

                    EpochPoints.update(
                      { points: ambPoints },
                      { where: { id: ambassadorPoint.id } },
                    );
                  } else {
                    EpochPoints.create({
                      id: ambassador.id,
                      points: 0,
                      channelId: interaction.channelId,
                    });
                  }
                },
              );
            } catch (err) {
              console.log(`Error updating epoch point: ${err}`);
            }
            if (affectedRows > 0) {
              interaction.editReply(
                `${points} Points deducted from ${user.username}  successfully.`,
              );
            }
          });
        } else {
          return interaction.editReply(
            `Failed to deduct ${points} Points from ${user.username}`,
          );
        }
      });
    } catch (error) {
      console.error('❗ Error in deductpoints cmd:', error);
    }
  },
};
