const TelegramBot = require('node-telegram-bot-api');
const { telegram_bot_token, telegram_channel_id } = require('../config.json');

const telegramBot = new TelegramBot(telegram_bot_token, { polling: false });

async function sendTelegramMessage(message, mediaGroup) {
  try {
    if (!mediaGroup) {
      await telegramBot.sendMessage(telegram_channel_id, message);
    } else {
      // Add "message" to "caption field" of the first media
      let mediaGroupWithMessage = mediaGroup;
      mediaGroupWithMessage[0].caption = message;

      await telegramBot.sendMediaGroup(
        telegram_channel_id,
        mediaGroupWithMessage,
      );
    }
    console.log('sendTelegramMessage - success - message:', message);
  } catch (error) {
    console.error('sendTelegramMessage - Error:', error?.message);
  }
}

module.exports = {
  sendTelegramMessage,
};
