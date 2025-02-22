const { Events } = require('discord.js');
const {
  Ambassadors,
  Messages,
  TopPoints,
  Tweets,
  EpochPoints,
  States,
} = require('../models/database.js');
const { epochStart, guildId } = require('../config.json');
const {
  scheduleRolesUpdateAndEpochWinnersFromDate,
  scheduleAssignBaselinePointsFromDate,
  checkPointsFromMessagesToAddToAmbassadors,
  EPOCH_IN_MILLIS,
  BASELINE_POINT_AWARD_MILLIS,
  ADD_POINTS_TO_AMBASSADORS_IN_MILLIS,
  logToDiscord,
} = require('../helpers/helpers.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    try {
      // Synchronize the database tables.
      await Ambassadors.sync({ alter: true });
      await Messages.sync();
      await TopPoints.sync();
      await Tweets.sync();
      await EpochPoints.sync();
      await States.sync({ alter: true });

      // For every 72 hours counted from the epoch start, assign roles to ambassadors
      // and also inform top 3 ambassadors of the epoch.
      const guild = await client.guilds.fetch(guildId);
      scheduleRolesUpdateAndEpochWinnersFromDate(
        epochStart,
        EPOCH_IN_MILLIS,
        guild,
      );

      // Run and then schedule baseline point assignment and epoch winner determination.
      scheduleAssignBaselinePointsFromDate(
        epochStart,
        BASELINE_POINT_AWARD_MILLIS,
        client,
      );

      // Every 30s, check to update points for the "ambassadors" table
      // based on the "messages" table for any messages older than 24 hours.
      // Mean that, the Ambassador points will actually be updated every 24 hours
      // and the corresponding message record will be deleted.
      setInterval(
        () => checkPointsFromMessagesToAddToAmbassadors(client),
        ADD_POINTS_TO_AMBASSADORS_IN_MILLIS,
      );

      console.log(`Bot ready. Logged in as ${client.user.tag}`);
    } catch (error) {
      console.error('❗ Error in ready event:', error.message);
      await logToDiscord(`❗ Error in ready event: ${error.message}`, client);
    }
  },
};
