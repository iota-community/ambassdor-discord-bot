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