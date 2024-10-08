require("dotenv").config();

const {TwitterApi} = require('twitter-api-v2');
const token = process.env.TOKEN;
const userPoints = {};

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
],
});

// Initialize Twitter Client
const twitterClient = new TwitterApi({
    appKey: process.env.API_KEY,
    appSecret: process.env.API_KEY_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

console.log('Twitter client initialized with environment variables');

client.once('ready', () => {
console.log('Bot is online!');
});

client.on('messageCreate', message => {
if (message.content === '!ping') {
    message.channel.send('Pong!');
}
});

client.login(token);

async function getTweetMetrics(tweetId) {
    try {
        const tweet = await twitterClient.v2.singleTweet(tweetId, {
        'tweet.fields': 'public_metrics',
    });

// Extracting metrics
    const { like_count, retweet_count, reply_count, impression_count } = tweet.data.public_metrics;
    console.log(`Likes: ${like_count}, Retweets: ${retweet_count}, Replies: ${reply_count}, Impressions: ${impression_count}`);

    return {
        likeCount: like_count,
        retweetCount: retweet_count,
        replyCount: reply_count,
        impressionCount: impression_count
    };
    } catch (error) {
        console.error('Error fetching tweet data:', error);
    }
}

client.on('messageCreate', async (message) => {
    // Check if the message is in the specific channel and contains a Twitter link
    if (message.channel.name === 'ambassador-tweets' && message.content.includes('x.com')) {
        const tweetId = extractTweetId(message.content);

        const metrics = await getTweetMetrics(tweetId);

      // Calculate points
        const points = calculatePoints(metrics);
        console.log(`Total points for this tweet: ${points}`);

      // You can then store these points for the user in a database or a simple map.
    }
});

  // Helper function to extract the Tweet ID from the URL
function extractTweetId(url) {
    const regex = /status\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

  // Function to calculate points based on tweet metrics
function calculatePoints({ likeCount, retweetCount, replyCount, impressionCount }) {
    return (likeCount * 0.5) + (retweetCount * 2) + (replyCount * 1) + (impressionCount * 0.05);
}

function addPointsToUser(discordUserId, points) {
    if (!userPoints[discordUserId]) {
    userPoints[discordUserId] = 0;
}
userPoints[discordUserId] += points;
}

// Example: Adding points when a new tweet link is posted
client.on('messageCreate', async (message) => {
    if (message.channel.name === 'ambassador-tweets' && message.content.includes('twitter.com')) {
    const tweetId = extractTweetId(message.content);
    const metrics = await getTweetMetrics(tweetId);
    const points = calculatePoints(metrics);

    addPointsToUser(message.author.id, points);
    console.log(`User ${message.author.username} has ${userPoints[message.author.id]} points.`);
}
});

