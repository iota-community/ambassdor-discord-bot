const { Events } = require('discord.js');
const queuePromise = require('../message/queue'); // Import the promise

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
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
    const { addJob } = await queuePromise; // Wait for queue setup
    await addJob({ message });
  },
};
