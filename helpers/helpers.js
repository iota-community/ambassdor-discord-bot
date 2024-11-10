const { Scraper } = require('@the-convocation/twitter-scraper');
const { Ambassadors, Messages } = require('../models/database.js');
const {adminRoleId} = require('../config.json');
const { json } = require('sequelize');
const {ReactionManager} = require('discord.js');

const NOVICE_MAX = 249;
const INTERMIDIATE_MIN = 250;
const INTERMIDIATE_MAX = 749;
const ADVANCED_MIN = 750;
const ADVANCED_MAX = 4999;
const EXPERT_MIN = 5000;

const NOVICE_DECAY = 0;
const INTERMIDIATE_DECAY = 100;
const ADVANCED_DECAY = 250;
const EXPERT_DECAY = 500;

const NOVICE_ROLE = "Novice";
const INTERMIDIATE_ROLE = "Intermidiate";
const ADVANCED_ROLE = "Advanced";
const EXPERT_ROLE = "Expert";

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

function epochDecay(points) {
    switch (true) {
        case points <= NOVICE_MAX:
            return points;
        case (points >= INTERMIDIATE_MIN) && (points <= INTERMIDIATE_MAX):
            points = points - INTERMIDIATE_DECAY;
            return points;
        case (points >= ADVANCED_MIN) && (points <= ADVANCED_MAX):
            points = points - ADVANCED_DECAY;
            return points;
        case (points >= EXPERT_MIN):
            points = points - EXPERT_DECAY
            return points;
        default:
            return points;
    }
}

function knownRole(role) {
    if(role.name === EXPERT_ROLE || role.name === NOVICE_ROLE 
        ||role.name === INTERMIDIATE_ROLE || role.name == ADVANCED_ROLE) {
            return true
        }
}

function assignAmbassadorRole(guild, ambassador, curRole){
    // Fetch a single member
    guild.members.fetch(ambassador.id)
        .then(member => {
            const role = guild.roles.cache.find(role => role.name === curRole);
            if (!role) return;
            member.roles.add(role);
        })
        .catch(console.error);
}

async function unassignRole(guild, ambassador) {
    // Fetch a single member
    guild.members.fetch(ambassador.id)
        .then(member => {
            member.roles.cache.forEach(role => {
                if (knownRole(role)){
                    member.roles.remove(role, 'Unassign role')
                    .then(() => console.log('Deleted the role')).catch(console.error);
                }
            });
        })
        .catch(console.error);
}

async function assignRoles(guild) {
    const ambassadors = await Ambassadors.findAll({
        attributes: ['id', 'points'],
    });
    
    ambassadors.forEach( 
        (ambassador) => {
            // delete previous ambassador's role.
            unassignRole(guild, ambassador).then(()=> {
            // Get current point.
            let currentPoints = Number(ambassador.points);
            // Account for epoch decay.
            currentPoints = epochDecay(currentPoints);

            Ambassadors.update({
                points: currentPoints}, {where: {id: ambassador.id}}).then(affectedRows =>{
                if (affectedRows > 0) {
                    console.log(`User ${ambassador.id} points updated`);
                } else {
                    console.log(`User ${ambassador.id} failed to updated points`);
                }
            })

            switch (true) {
                case currentPoints <= NOVICE_MAX:
                    assignAmbassadorRole(guild, ambassador, NOVICE_ROLE);
                    return;
                case (currentPoints >= INTERMIDIATE_MIN) && (currentPoints <= INTERMIDIATE_MAX):
                    assignAmbassadorRole(guild, ambassador, INTERMIDIATE_ROLE);
                    return; 
                case (currentPoints >= ADVANCED_MIN) && (currentPoints <= ADVANCED_MAX):
                    assignAmbassadorRole(guild, ambassador, ADVANCED_ROLE);
                    return;
                case (currentPoints >= EXPERT_MIN):
                    assignAmbassadorRole(guild, ambassador, EXPERT_ROLE);
                    return;
                default:
                    console.log(`No matching role`);
            }

            })
        }
    );
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

function isMoreThanGivenMinutes(timestamp, minutes) {
    const currentTime = Date.now();
    const timeInMs = minutes * 60 * 1000; // Convert minutes to milliseconds
    return currentTime - timestamp > timeInMs;
}


/**
 * Schedule a task to run at a specified interval in seconds, starting from a given date.
 * @param {Date} startDate - The starting date for the interval.
 * @param {number} intervalInSeconds - Number of seconds between task executions.
 * @param {function} task - The task to execute.
 */
function scheduleTaskFromDate(startDate, intervalInSeconds, task, guild) {
    const MS_PER_SECOND = 1000;
    const intervalInMs = intervalInSeconds * MS_PER_SECOND;
  
    const now = new Date();
    const start = new Date(startDate);
  
    if (isNaN(start)) {
      throw new Error("Invalid start date provided.");
    }
  
    if (intervalInSeconds < 1) {
      throw new Error("Interval must be at least one second.");
    }
  
    // Calculate the time until the next interval from the start date
    const timeSinceStart = now - start;
    const timeUntilNextRun = (intervalInMs - (timeSinceStart % intervalInMs)) % intervalInMs;
  
    // Calculate the next run date
    const nextRunDate = new Date(now.getTime() + timeUntilNextRun);
    console.log(`Next epoch date: ${nextRunDate.toLocaleString()}`);
  
    // Set a timeout to start the interval at the next run date
    setTimeout(() => {
      // Execute the task once immediately at the calculated next run date
      task(guild);
  
      // Schedule the task to run every `intervalInSeconds`
      setInterval(() => task(guild), intervalInMs);
    }, timeUntilNextRun);
}

function updatePoints(intervalInSeconds, client) {
    setInterval(() => fetchPoints(client), intervalInSeconds)
}

async function addPoints(client, msg) {
    Ambassadors.findOne({ where: { id: msg.authorId } }).then(ambassador => {
        if(ambassador) {
            const prevPoints = ambassador.points
            const PrevTweets = ambassador.tweets
            Ambassadors.update({points: prevPoints + msg.points, tweets: PrevTweets + 1}, {where: {id: ambassador.id}}).then(affectedRows =>{
            if (affectedRows > 0) {
                Messages.destroy(
                    { where: {id: msg.id}}
                ).then(() => {
                    client.channels.fetch(msg.channelId).then(chan => {
                        chan.messages.fetch(msg.id).then(curMsg => {
                            return curMsg.reply(`${msg.points} Points added to ${ambassador.displayName} for this post.`)
                        });
                    });
                    return;
                })
            }
        })
        }
    });
}

async function fetchPoints(client) {
    const messages = await Messages.findAll({
        attributes: ['id', 'channelId', 'createdTimestamp', 'authorId', 'points'],
    });

    if (messages.length < 1 ) {
        return;
    }

    messages.forEach(msg => {
        const currentTime = Date.now();
        const twentyFourHoursInMilliseconds = 30000 * 60 * 60 * 1000; // 24 hours in milliseconds

        if(currentTime > (msg.createdTimestamp + twentyFourHoursInMilliseconds)){
            client.channels.fetch(msg.channelId).then(chan => {
                chan.messages.fetch(msg.id).then(async curMsg => {
                    if (curMsg == null) {
                        return;
                    };

                    addPoints(client, msg);
                });
            });
        }
    })
}

module.exports.has72HoursPassed = has72HoursPassed;
module.exports.assignRoles = assignRoles;
module.exports.fetchTweet = fetchTweet;
module.exports.extractTweetId = extractTweetId;
module.exports.calculatePoints  = calculatePoints;
module.exports.scheduleTaskFromDate = scheduleTaskFromDate;
module.exports.updatePoints = updatePoints;
module.exports.isMoreThanGivenMinutes = isMoreThanGivenMinutes;