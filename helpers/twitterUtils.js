const { TwitterApi } = require('twitter-api-v2');
const he = require('he');
const {
  // twitter_api_key,
  // twitter_api_key_secret,
  // twitter_api_access_token,
  // twitter_api_access_secret,
  twitter_space_ids,
  twitter_bearer_token,
} = require('../config.json');

const twitterClient = new TwitterApi(twitter_bearer_token);
// const twitterClient = new TwitterApi({
//   appKey: twitter_api_key,
//   appSecret: twitter_api_key_secret,
//   accessToken: twitter_api_access_token,
//   accessSecret: twitter_api_access_secret,
// });

async function getSpaceData() {
  const spaceFields = {
    'space.fields': 'state,title,participant_count,creator_id',
  };

  let spaceDataMsg = `${new Date().toUTCString()}`;

  for (const spaceId of twitter_space_ids) {
    try {
      const spaceDetails = await twitterClient.v2.space(spaceId, spaceFields);
      const msg = `\nSpace: ${JSON.stringify(spaceDetails.data, null, 2)}\n`;
      spaceDataMsg += msg;
    } catch (error) {
      console.error('Error fetching Space data:', error.message);
    }
  }

  console.log(spaceDataMsg);
  return spaceDataMsg;
}

async function getTweetData(tweetId) {
  const resp = await twitterClient.v2.singleTweet(tweetId, {
    'tweet.fields':
      'id,author_id,created_at,text,public_metrics,entities,referenced_tweets',
  });

  return resp.data;
}

// "iota" => 3992601857
// "iota_labs" => 2204532163
async function getTweetUserId(tweetUserName) {
  const user = await twitterClient.v2.userByUsername(tweetUserName);
  console.log(`User ID for ${tweetUserName}: ${user.data.id}`);
  return user.data.id;
}

async function getTweetPhotoMediaGroup(tweetId) {
  const photoMediaGroup = [];

  try {
    const extractedTweetData = await twitterClient.v2.singleTweet(tweetId, {
      // VIP combo to extract image URLs
      expansions: ['attachments.media_keys'],
      'media.fields': ['url', 'preview_image_url', 'type'],
      'tweet.fields': ['text'],
    });

    if (extractedTweetData?.includes?.media?.length > 0) {
      for (const media of extractedTweetData.includes.media) {
        if (media.url && isUrlAccessible(media.url)) {
          photoMediaGroup.push({
            type: 'photo', // for video, also use 'photo' type!
            media: media.url,
          });
        } else {
          console.log(`Not accessible media URL: ${media.url}`);
        }
      }
    }

    console.log(
      `getTweetPhotoMediaGroup for tweetId: ${tweetId}: ${JSON.stringify(photoMediaGroup, null, 2)}`,
    );

    return photoMediaGroup.length === 0 ? null : photoMediaGroup;
  } catch (err) {
    console.error('getTweetPhotoMediaGroup - Error:', err?.message);
    return null;
  }
}

function getDirectTweetLink(twitterUserName, tweetId) {
  return `https://x.com/${twitterUserName}/status/${tweetId}`;
}

function removeWeirdChars(text) {
  try {
    return he.decode(text);
  } catch (error) {
    error;
    return text;
  }
}

function removeTwitterShortLinks(text) {
  try {
    return text.replace(/https:\/\/t\.co\/\S+/g, '');
  } catch (error) {
    error;
    return text;
  }
}

// Get the latest tweet to be forwarded to Telegram
async function getLatestTweet(
  twitterUserName, // = 'iota',
  lastSinceId, // = '1932784885258764796',
) {
  console.log(
    'getLatestTweet - twitterUserName:',
    twitterUserName,
    ', lastSinceId:',
    lastSinceId,
  );

  try {
    let tweetData = {};

    const twitterUserId = await getTweetUserId(twitterUserName);

    // https://docs.x.com/x-api/posts/user-posts-timeline-by-user-id
    const stream = await twitterClient.v2.userTimeline(twitterUserId, {
      max_results: 5,
      since_id: lastSinceId,
      'tweet.fields': ['created_at', 'text', 'id'],

      // VIP combo to extract image URLs
      expansions: ['attachments.media_keys'],
      'media.fields': ['url', 'preview_image_url', 'type'],

      exclude: ['replies', 'retweets'],
      'user.fields': ['created_at', 'username'],
    });

    // console.log('stream:', stream);

    for await (const tweet of stream) {
      tweetData.id = tweet.id;
      tweetData.text =
        removeWeirdChars(removeTwitterShortLinks(tweet.text)) +
        '\n' +
        '\n' +
        '🔗' +
        getDirectTweetLink(twitterUserName, tweet.id);
      tweetData.mediaGroup = await getTweetPhotoMediaGroup(tweet.id);

      console.log(
        'getLatestTweet - twitterUserName:',
        twitterUserName,
        ', data:',
        tweetData,
      );

      return tweetData;
    }

    return null;
  } catch (error) {
    console.error(
      'getLatestTweet - Error:',
      error?.data?.title,
      ' - rateLimit:',
      error?.rateLimit,
    );
    return null;
  }
}

async function isUrlAccessible(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (err) {
    err;
    return false;
  }
}

module.exports = {
  getSpaceData,
  getTweetData,
  getTweetUserId,
  getTweetPhotoMediaGroup,
  getLatestTweet,
  getDirectTweetLink,
  isUrlAccessible,
};
