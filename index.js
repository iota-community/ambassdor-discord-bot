require("dotenv").config();

const { extractTweetId, calculatePoints, assignRoles, getTweetMetrics } = require('./helpers/helpers');

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

function addPointsToUser(discordUserId, points) {
    if (!userPoints[discordUserId]) {
    userPoints[discordUserId] = 0;
}
userPoints[discordUserId] += points;
}

// Example: Adding points when a new tweet link is posted
client.on('messageCreate', async (message) => {
    if (message.channel.name === 'ambassador-tweets' && message.content.includes('x.com')) {
    const tweetId = extractTweetId(message.content);
    const metrics = await getTweetMetrics(tweetId);
    const points = calculatePoints(metrics);

    addPointsToUser(message.author.id, points);
    console.log(`User ${message.author.username} has ${userPoints[message.author.id]} points.`);
}
});

client.on('messageCreate', async (message) => {
    if (message.content === '!assignRoles') {
        await assignRoles(message);
    }
});

const referrals = {};

client.on('messageCreate', (message) => {
    if (message.content.startsWith('!refer')) {
    const mentionedUser = message.mentions.users.first();
    
        if (mentionedUser) {
        const referrerId = message.author.id;
        const referredId = mentionedUser.id;

      // Store the referral
        if (!referrals[referrerId]) {
        referrals[referrerId] = [];
    }
        referrals[referrerId].push(referredId);

        message.channel.send(`${message.author.username} has referred ${mentionedUser.username}`);
    }
}
});