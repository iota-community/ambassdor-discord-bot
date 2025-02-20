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
  assignRoles,
  scheduleTaskFromDate,
  updatePoints,
  assignBaseLinePoints,
  // determineEpochWinner,
  EPOCH_IN_SECONDS,
  BASELINE_POINT_AWARD_MILLIS,
  DEFAULT_STATE_INDEX,
  logToDiscord,
} = require('../helpers/helpers.js');
const { Op } = require('sequelize');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    try {
      // Synchronize the database tables.
      await Ambassadors.sync();
      await Messages.sync();
      await TopPoints.sync();
      await Tweets.sync();
      await EpochPoints.sync();
      await States.sync({ alter: true });

      /////// Run only once and will be removed ////////
      try {
        await Ambassadors.update(
          {
            x_access_token: '',
            x_access_secret: '',
          },
          { where: { points: { [Op.gte]: 0 } } },
        );
      } catch (error) {
        console.error(
          '❗ Error when deleting X sensitive data:',
          error.message,
        );
      }
      /////////////////////////////////////////////////

      // For every 72 hours counted from the epoch start, assign roles to ambassadors
      // and also inform top 3 ambassadors of the epoch.
      const guild = await client.guilds.fetch(guildId);
      scheduleTaskFromDate(epochStart, EPOCH_IN_SECONDS, assignRoles, guild);

      // Every 30s, check to update points for the "ambassadors" table
      // based on the "messages" table for any messages older than 24 hours.
      // Mean that, the Ambassador points will actually be updated every 24 hours
      // and the corresponding message record will be deleted.
      updatePoints(30, client);

      // Synchronize the remaining tables.
      await States.upsert({ id: DEFAULT_STATE_INDEX, startupTime: new Date() });

      // Run and then schedule baseline point assignment and epoch winner determination.
      await assignBaseLinePoints(client);
      setInterval(() => {
        assignBaseLinePoints(client);
      }, BASELINE_POINT_AWARD_MILLIS);

      // TODO
      // setInterval(() => {
      //   determineEpochWinner(client);
      // }, EPOCH_IN_SECONDS * 1000);

      console.log(`Ready! Logged in as ${client.user.tag}`);
      await logToDiscord(
        `✅ Bot is ready! Logged in as ${client.user.tag}`,
        client,
      );
    } catch (error) {
      console.error('❗ Error in ready event:', error.message);
      await logToDiscord(
        `❗ Error in ClientReady event: ${error.message}`,
        client,
      );
    }
  },
};
