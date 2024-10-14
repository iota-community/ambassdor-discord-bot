// Helper function to extract the Tweet ID from the URL
export function extractTweetId(url) {
    const regex = /status\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Function to calculate points based on tweet metrics
export function calculatePoints({ likeCount, retweetCount, replyCount, impressionCount }) {
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

module.exports.assignRole = assignRoles;
module.exports.getTweetMetrics = getTweetMetrics