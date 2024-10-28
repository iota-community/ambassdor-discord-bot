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

function has72HoursPassed(timestamp) {
    // Get the current time in milliseconds
    const currentTime = Date.now();
    // Convert 72 hours to milliseconds (72 * 60 * 60 * 1000)
    const seventyTwoHoursInMs = 72 * 60 * 60 * 1000;
    // Convert the given timestamp from seconds to milliseconds
    const givenTimeInMs = timestamp * 1000;

    // Check if the difference between current time and given time is greater than 72 hours
    return (currentTime - givenTimeInMs) >= seventyTwoHoursInMs;
}


module.exports.has72HoursPassed = has72HoursPassed;
module.exports.assignRole = assignRoles;
module.exports.fetchTweet = fetchTweet
module.exports.extractTweetId = extractTweetId
module.exports.calculatePoints = calculatePoints