const { Events } = require('discord.js');
const { adminRoleId, guildId } = require('../config.json');
const { Messages } = require('../models/database.js');
const { isMoreThanGivenMinutes } = require('../helpers/helpers.js');
const { logToDiscord } = require('../helpers/helpers.js'); // Ensure this function is implemented.

module.exports = {
  name: Events.MessageReactionAdd,
  async execute(reaction, user) {
    try {
      // Ensure the reaction is fully loaded
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          console.error('Error fetching reaction:', error);
          return;
        }
      }

      // Verify the message is from the correct guild
      if (!reaction.message.guild || reaction.message.guild.id !== guildId) {
        console.error(
          `❗ Ignored reaction from unauthorized guild: ${reaction.message.guild?.id}`,
        );
        return;
      }

      // Check if the reaction is the void emoji (🥒)
      if (reaction.emoji.name !== '🥒') {
        return;
      }

      // Fetch the reacting user as a guild member
      const guildMember = await reaction.message.guild.members.fetch(user.id);
      if (!guildMember) {
        return;
      }

      // Verify if the user is an admin
      const isAdmin = guildMember.roles?.cache?.has(adminRoleId);
      if (!isAdmin) {
        return reaction.message.reply('🚫 Only admins can void a message.');
      }

      // Check if the message is older than the allowed voiding period (24 hours)
      if (isMoreThanGivenMinutes(reaction.message.createdTimestamp, 24 * 60)) {
        return reaction.message.reply(
          '⏳ Sorry, the message void time has expired.',
        );
      }

      // Attempt to find the message in the database
      const msg = await Messages.findOne({
        where: { id: reaction.message.id },
      });

      if (!msg) {
        return reaction.message.reply('⚠️ Message not found.');
      }

      // Delete the message from the database
      await Messages.destroy({ where: { id: msg.id } });

      // Notify the channel
      await reaction.message.reply('✅ This message has been voided.');
    } catch (error) {
      console.error('❗ Error in MessageReaction event:', error.message);

      // Log error to Discord
      await logToDiscord(
        `❗ **Error in MessageReaction event:**\n\`\`\`${error.message}\`\`\``,
      );
    }
  },
};
