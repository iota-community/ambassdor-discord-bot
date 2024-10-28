const { Events } = require('discord.js');
const { fetchTweet, extractTweetId, calculatePoints, has72HoursPassed } = require('../helpers/helpers.js');
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
				
				// return if tweet is above cutoff point. 
				if (has72HoursPassed(tweet.timestamp)){
					return message.reply(`72h hours has passed since post was made on X.`)
				}
	
				// Calculate points
				points = calculatePoints({likeCount: tweet.likes, retweetCount: tweet.retweets, replyCount: tweet.replies, impressionCount: tweet.views})

				Ambassadors.findOne({ where: { id: message.author.id } }).then(ambassador => {
					if(ambassador) {
						if(tweet.userId != ambassador.x_user_id) {
							// Check the tweet user Id against known Id.
							return message.reply(`X id of user that made post doesn't match linked x id`)
						}
						const prevPoints = ambassador.points
						const PrevTweets = ambassador.tweets
						Ambassadors.update({points: prevPoints + points, tweets: PrevTweets + 1}, {where: {id: ambassador.id}}).then(affectedRows =>{
							if (affectedRows > 0) {
								message.reply(`${points} added to ${ambassador.x_screen_name} for the post ${tweet.id}`)
							}
						})

						return;
					}
				});
			})
		}
	},
};