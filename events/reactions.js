const { Events } = require('discord.js');
const {adminRoleId} = require('../config.json');
const { Messages } = require('../models/database.js')
const {isMoreThanGivenMinutes} = require('../helpers/helpers.js')

module.exports = {
	name: Events.MessageReactionAdd,
	async execute(reaction, user) {
        // When a reaction is received, check if the structure is partial
	    if (reaction.partial) {
		    // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
		    try {
			    await reaction.fetch();
		    } catch (error) {
			    console.error('Something went wrong when fetching the message:', error);
			    // Return as `reaction.message.author` may be undefined/null
			    return;
		    }
	    };

        if(reaction.emoji.name == "🥒" && user.id == adminRoleId){
            if (isMoreThanGivenMinutes(reaction.message.createdTimestamp, 24 * 60)) {
                return;
            };

            Messages.findOne({ where: { id: reaction.message.id } }).then(msg => {
                if(msg) {
                    Messages.destroy(
                        { where: {id: msg.id}}
                    );

                };
            });
        };
	},
};
