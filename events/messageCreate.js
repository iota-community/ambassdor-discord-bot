const { Events } = require("discord.js");
const {
	fetchTweet,
	extractTweetId,
	calculatePoints,
	has72HoursPassed,
} = require("../helpers/helpers.js");
const { Ambassadors, Messages, Tweets } = require("../models/database.js");

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		try {
			// Check for posts with link to x.com or twitter.com.
			if (
				message.content.includes("x.com") ||
				message.content.includes("twitter.com")
			) {
				// Extract tweet Id.
				const tweetId = extractTweetId(message.content);
				// Return if it fail to extract Tweet Id.
				if (tweetId === null) {
					console.log(`unable to extract Id for tweet ${message.content}`);
					return message.reply(`Unable to extract tweet ${tweetId}.`);
				}
				// Fetch tweet.
				fetchTweet(tweetId).then((tweet) => {
					if (tweet === null) {
						console.log(`unable to fetch tweet ${tweetId}`);
						return;
					}

					// return if post is not an original tweet.
					if (tweet.isRetweet) {
						return message.reply(`This is retweeted tweet`);
					}

					// return if tweet is above cutoff point.
					if (has72HoursPassed(tweet.timestamp)) {
						return message.reply(
							`72h hours has passed since post was made on X.`
						);
					}

					Tweets.findOne({ where: { id: tweetId } }).then((dupTweet) => {
						if (dupTweet) {
							return message.reply(
								`Duplicate tweet detected: This message has already been posted in the channel`
							);
						} else {
							// get tweet metrics and check for possibe null values.
							// If value is null, set value to 0.
							const likes = tweet.likes || 0;
							const retweets = tweet.retweets || 0;
							const replies = tweet.replies || 0;
							const views = tweet.views || 0;

							// Calculate points
							let points = calculatePoints({
								likeCount: likes,
								retweetCount: retweets,
								replyCount: replies,
								impressionCount: views,
							});
							points = parseFloat(points).toFixed(2);

							Ambassadors.findOne({ where: { id: message.author.id } }).then(
								(ambassador) => {
									if (ambassador) {
										if (tweet.userId != ambassador.x_user_id) {
											// Check the tweet user Id against known Id.
											return message.reply(
												`X id of user that made post doesn't match linked x id`
											);
										}
										Messages.create({
											id: message.id,
											channelId: message.channelId,
											authorId: message.author.id,
											createdTimestamp: message.createdTimestamp,
											tweetId: tweetId,
											points: points,
										}).then((msg) => {

											try {
												Tweets.create({
													id: msg.tweetId,
													author: msg.authorId,
													messageId: msg.id,
													channelId: msg.channelId,
												}).then(() => {
													console.log(`tweet created successfully`);
												});
											} catch (err) {
												console.log(`Error creating tweet: ${err}`);
											}

											return message.reply(
												`🤍 ${likes}  	🔃 ${retweets}  		💬 ${replies}		📊 ${views} \n${points} Points calculated for ${message.author.displayName} for this post.`
											);
										});
									} else {
										return message.reply(
											`You have not linked your X id, use /linkx command to link account.`
										);
									}
								}
							).catch((error) => {
								console.log(`unable to fetch ambassador ${message.author.id} - Error: ${error?.message}`);
								return message.reply(`Unable to fetch ambassador ${message.author.id}.`);
							});
						}
					});
				}).catch((error) => {
					console.log(`unable to fetch tweet ${tweetId} - Error: ${error?.message}`);
					return message.reply(`Unable to fetch tweet ${tweetId}.`);
				});
			}
		} catch (error) {
			console.error('❗ Error in messageCreate event:', error);
		}
	},
};
