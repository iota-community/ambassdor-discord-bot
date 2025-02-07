const { Events } = require('discord.js');
const { adminRoleId } = require('../config.json');
const { Messages } = require('../models/database.js')
const { isMoreThanGivenMinutes } = require('../helpers/helpers.js')

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
                // Return as `reaction.emoji` may be undefined/null
                return;
            }
        };

        const adminRole = reaction.message.member.roles.cache.some(r => r.id === adminRoleId);
        if (!adminRole) {
            return reaction.message.reply(`Only admin can void a message`);
        }
        
        if (reaction.emoji.name == "🥒" && adminRole) {
            if (isMoreThanGivenMinutes(reaction.message.createdTimestamp, 24 * 60)) {
                return reaction.message.reply(`Sorry, the action cannot be performed because the message void time has expired`);
            };

            Messages.findOne({ where: { id: reaction.message.id } }).then(msg => {
                if (msg) {
                    Messages.destroy(
                        { where: { id: msg.id } }
                    ).then(() => {
                        reaction.message.reply(`This message has been voided.`);
                    });

                };
            });
        }else{
            console.log(`Failed to void message, admin or invalid emoji`)
        };
        
    },
};
