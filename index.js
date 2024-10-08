// Load environment variables from .env file
require("dotenv").config();

// Import necessary libraries and modules
const { TwitterApi } = require('twitter-api-v2');
const token = process.env.TOKEN;  // Discord bot token from .env file
const userPoints = {};  // Object to keep track of users' points

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    // Defining the intents (permissions) that the bot needs
    intents: [
        GatewayIntentBits.Guilds,  // Access to guild (server) data
        GatewayIntentBits.GuildMessages,  // Access to messages
        GatewayIntentBits.MessageContent,  // Access to the content of the messages
        GatewayIntentBits.GuildMembers,  // Access to guild member information
    ],
});

// Initialize Twitter Client with API credentials from the .env file
const twitterClient = new TwitterApi({
    appKey: process.env.API_KEY,
    appSecret: process.env.API_KEY_SECRET,
    accessToken: process.env.ACCESS_TOKEN,
    accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

console.log('Twitter client initialized with environment variables');

// Event listener for when the Discord bot is ready and online
client.once('ready', () => {
    console.log('Bot is online!');
});

// Simple message handler: Responds to "!ping" command with "Pong!"
client.on('messageCreate', message => {
    if (message.content === '!ping') {
        message.channel.send('Pong!');
    }
});

// Log in to Discord using the bot token
client.login(token);

// Function to get the metrics (likes, retweets, etc.) from a tweet using Twitter API
async function getTweetMetrics(tweetId) {
    try {
        // Fetch tweet data with specific fields (like public metrics)
        const tweet = await twitterClient.v2.singleTweet(tweetId, {
            'tweet.fields': 'public_metrics',
        });

        // Extracting metrics from the tweet
        const { like_count, retweet_count, reply_count, impression_count } = tweet.data.public_metrics;
        console.log(`Likes: ${like_count}, Retweets: ${retweet_count}, Replies: ${reply_count}, Impressions: ${impression_count}`);

        // Return the extracted metrics as an object
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

// Event listener for message creation: checks for Twitter links in "ambassador-tweets" channel
client.on('messageCreate', async (message) => {
    // Check if the message is in the specific channel and contains a Twitter link
    if (message.channel.name === 'ambassador-tweets' && message.content.includes('x.com')) {
        const tweetId = extractTweetId(message.content);  // Extract tweet ID from URL

        const metrics = await getTweetMetrics(tweetId);  // Fetch tweet metrics

        // Calculate points based on the tweet's metrics
        const points = calculatePoints(metrics);
        console.log(`Total points for this tweet: ${points}`);

        // You can store the points for the user in a database or a map (userPoints object here)
    }
});

// Helper function to extract the Tweet ID from the Twitter URL
function extractTweetId(url) {
    const regex = /status\/(\d+)/;  // Regex to extract tweet ID
    const match = url.match(regex);  // Match the URL against the regex
    return match ? match[1] : null;  // Return the tweet ID if found, otherwise return null
}

// Function to calculate points based on tweet metrics
function calculatePoints({ likeCount, retweetCount, replyCount, impressionCount }) {
    // Formula to calculate points: Likes (0.5 points), Retweets (2 points), Replies (1 point), Impressions (0.05 points)
    return (likeCount * 0.5) + (retweetCount * 2) + (replyCount * 1) + (impressionCount * 0.05);
}

// Function to add points to a user's score
function addPointsToUser(discordUserId, points) {
    // If the user doesn't have points yet, initialize to 0
    if (!userPoints[discordUserId]) {
        userPoints[discordUserId] = 0;
    }
    // Add the calculated points to the user's total
    userPoints[discordUserId] += points;
}

// Example of adding points when a new tweet link is posted in the ambassador-tweets channel
client.on('messageCreate', async (message) => {
    if (message.channel.name === 'ambassador-tweets' && message.content.includes('x.com')) {
        const tweetId = extractTweetId(message.content);  // Extract tweet ID from the message
        const metrics = await getTweetMetrics(tweetId);  // Get tweet metrics
        const points = calculatePoints(metrics);  // Calculate points

        addPointsToUser(message.author.id, points);  // Add points to the user
        console.log(`User ${message.author.username} has ${userPoints[message.author.id]} points.`);
    }
});

// Function to assign roles based on users' points
async function assignRoles(message) {
    const guild = message.guild;  // Get the guild (server)

    for (const [userId, points] of Object.entries(userPoints)) {
        const member = await guild.members.fetch(userId);  // Fetch the member by user ID
        let newRole;

        // Assign roles based on points thresholds
        if (points >= 5000) {
            newRole = 'Expert';
        } else if (points >= 750) {
            newRole = 'Advanced';
        } else if (points >= 250) {
            newRole = 'Intermediate';
        } else {
            newRole = 'Novice';
        }

        // Find and assign the appropriate role to the member
        const role = guild.roles.cache.find(r => r.name === newRole);
        if (role) {
            await member.roles.add(role);
            console.log(`Assigned ${newRole} role to ${member.user.username}`);
        }
    }
}

// Command to assign roles based on points when "!assignRoles" is called
client.on('messageCreate', async (message) => {
    if (message.content === '!assignRoles') {
        await assignRoles(message);  // Call the role assignment function
    }
});

// Object to store referrals (who referred who)
const referrals = {};

// Command to handle user referrals (!refer command)
client.on('messageCreate', (message) => {
    if (message.content.startsWith('!refer')) {
        const mentionedUser = message.mentions.users.first();  // Get the first mentioned user

        if (mentionedUser) {
            const referrerId = message.author.id;  // Get the referrer (message author) ID
            const referredId = mentionedUser.id;  // Get the referred user ID

            // Store the referral
            if (!referrals[referrerId]) {
                referrals[referrerId] = [];
            }
            referrals[referrerId].push(referredId);  // Add the referred user to the referrer's list

            message.channel.send(`${message.author.username} has referred ${mentionedUser.username}`);
        }
    }
});
