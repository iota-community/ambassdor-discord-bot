const { Events } = require("discord.js");
const { Messages, Tweets } = require("../models/database.js");
const {logToDiscord} = require("../helpers/helpers.js")

module.exports = {
  name: Events.MessageDelete,
  async execute(message) {
    try {
      // Ensure we can fetch the full message if it's partial
      if (message.partial) {
        try {
          await message.fetch();
        } catch (error) {
          console.error("Error fetching message:", error);
          return;
        }
      }

      
      const msg = await Messages.findOne({ where: { id: message.id } });
      if (msg) {
        await Messages.destroy({ where: { id: message.id } });
        await logToDiscord(`Invalidated message ${msg.id}`, message.client);
      }

      const tweet = await Tweets.findOne({where: {messageId: message.id}})
      if (tweet) {
        await Tweets.destroy({ where: { id: tweet.id} });
      }
      // You could also send this info to a logging channel if needed
    } catch (err) {
      console.error("Error processing deleted message:", err);
    }
  },
};
