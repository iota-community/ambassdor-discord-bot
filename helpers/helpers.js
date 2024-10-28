const { Scraper } = require('@the-convocation/twitter-scraper');


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

async function assignRoles(message) {
    const guild = message.guild;

        for (const [userId, points] of Object.entries(userPoints)) {
        const member = await guild.members.fetch(userId);
        let newRole;

        if (points >= 5000) {
        newRole = 'Expert';
        } else if (points >= 750) {
        newRole = 'Advanced';
    } else if (points >= 250) {
        newRole = 'Intermediate';
    } else {
        newRole = 'Novice';
    }

      // Assign the new role to the member
    const role = guild.roles.cache.find(r => r.name === newRole);
        if (role) {
        await member.roles.add(role);
        console.log(`Assigned ${newRole} role to ${member.user.username}`);
    }
    }
}

async function fetchTweet(tweetId) {
    const scraper = new Scraper();
    const tweet = await scraper.getTweet(tweetId);
    return tweet;
}

module.exports.assignRole = assignRoles;
module.exports.fetchTweet = fetchTweet
module.exports.extractTweetId = extractTweetId
module.exports.calculatePoints  = calculatePoints