const { twitter_space_inform_channel_id } = require('../config.json');

const { getSpaceData } = require('./twitterUtils.js');

let channel = null;

async function informSpaceData(client) {
  try {
    if (!channel) {
      channel = await client.channels.fetch(twitter_space_inform_channel_id);
    }

    const spaceDataMsg = await getSpaceData();

    if (spaceDataMsg) {
      await channel.send(spaceDataMsg);
    }
  } catch (error) {
    console.error('informSpaceData - Error:', error.message);
  }
}

module.exports = {
  informSpaceData,
};
