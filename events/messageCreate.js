const { Events } = require('discord.js');
const { fetchTweet, extractTweetId, calculatePoints } = require('../helpers/helpers.js');
const {Ambassadors} = require('../models/database.js')

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		// Check for posts with link to x.com or twitter.com.
		if (message.content.includes("x.com") || message.content.includes("twitter.com")) {
			// Extract tweet Id.
			tweetId = extractTweetId(message.content)
			// Return if it fail to extract Tweet Id.
			if (tweetId === null) {
				console.log(`unable to extract Id for tweet ${message.content}`)
				return
			}
			// Fetch tweet. 
			fetchTweet(tweetId).then(tweet =>{
				if (tweet === null) {
					console.log(`unable to fetch tweet ${tweetId}`)
					return
				}
	
				// return if post is not an original tweet.
				if (tweet.isRetweet){
					return
				} 
	
				// Todo: Check the tweet user Id against known Id.
	
				// Calculate points
				points = calculatePoints({likeCount: tweet.likes, retweetCount: tweet.retweets, replyCount: tweet.replies, impressionCount: tweet.views})

				Ambassadors.findOne({ where: { id: message.author.id } }).then(ambassador => {
					if(ambassador) {
						const prevPoints = ambassador.points
						const PrevTweets = ambassador.tweets
						Ambassadors.update({points: prevPoints + points, tweets: PrevTweets + 1}, {where: {id: ambassador.id}}).then(affectedRows =>{
							if (affectedRows > 0) {
								return interaction.reply(`Ambassador ${ambassador} was edited.`);
							}
						})

						return;
					}

					Ambassadors.create({
						id: message.author.id,
						tweeter_id: tweet.userId,
						points: points,
						tweets: 1,

					}).then(amb => {
						console.log(`Ambassador ${amb.id} added.`);
					})
				});
			})
		}
	},
};