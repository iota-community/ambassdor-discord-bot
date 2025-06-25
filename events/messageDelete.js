const { Events } = require('discord.js');
const { Messages, Tweets } = require('../models/database.js');
const { logToDiscord } = require('../helpers/helpers.js');

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    try {
      // Ensure we can fetch the full message if it's partial
      if (message.partial) {
        try {
          await message.fetch();
        } catch (error) {
          console.error('Error fetching message:', error);
          return;
        }
      }

      if (
        !message.content.includes('x.com') &&
        !message.content.includes('twitter.com')
      ) {
        return;
      }

      // Delete the message from the database
      await Messages.destroy({ where: { id: message.id } });
      await Tweets.destroy({ where: { messageId: message.id } });

      await logToDiscord(
        `Message (${message.id}) and its Tweet deleted`,
        message.client,
      );
    } catch (err) {
      console.error('Error processing deleted message:', err);
    }
  },
};
