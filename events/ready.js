const { Events } = require('discord.js');
const { Ambassadors, Messages, TopPoints, Tweets, EpochPoints, States } = require('../models/database.js');
const { epochStart, guildId } = require("../config.json");
const { 
  assignRoles, 
  scheduleTaskFromDate, 
  updatePoints, 
  assignBaseLinePoints, 
  determineEpochWinner,
  EPOCH_IN_SECONDS, 
  BASELINE_POINT_AWARD_MILLIS, 
  DEFAULT_STATE_INDEX,
  logToDiscord
} = require("../helpers/helpers.js");

const MSG_SYNC_TIME_IN_SECS = 10;

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    try {
      // Synchronize Ambassadors and schedule role assignment for the guild.
      await Ambassadors.sync();
      const guild = await client.guilds.fetch(guildId);
      scheduleTaskFromDate(epochStart, EPOCH_IN_SECONDS, assignRoles, guild);

      // Synchronize Messages and schedule point updates.
      await Messages.sync();
      updatePoints(MSG_SYNC_TIME_IN_SECS, client);

      // Synchronize the remaining tables.
      await TopPoints.sync();
      await Tweets.sync();
      await EpochPoints.sync();
      await States.sync({alter: true});
      await States.upsert({ id: DEFAULT_STATE_INDEX, startupTime: new Date(), nextEpochTime: Date.now() + EPOCH_IN_SECONDS * 1000 }, { id: DEFAULT_STATE_INDEX });

      // Schedule baseline point assignment and epoch winner determination.
      setInterval(() => {
        assignBaseLinePoints(client);
      }, BASELINE_POINT_AWARD_MILLIS);

      setInterval(() => {
        determineEpochWinner(client);
      }, EPOCH_IN_SECONDS * 1000);

      console.log(`Ready! Logged in as ${client.user.tag}`);
      await logToDiscord(`✅ Bot is ready! Logged in as ${client.user.tag}`, client);
    } catch (error) {
      console.error('❗ Error in ready event:', error);
      await logToDiscord(`❗ Error in ClientReady event: ${error.message}`, client);
    }
  },
};
