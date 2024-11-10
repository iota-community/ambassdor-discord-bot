const { SlashCommandBuilder } = require('discord.js');
const {Ambassadors} = require('../../models/database.js');
const {adminRoleId} = require('../../config.json');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('deduct')
		.setDescription('Deduct points from an ambassador.')
		.addNumberOption(option =>
			option
				.setName('points')
				.setDescription('Number of points to deduct.')
			    .setRequired(true))
        .addUserOption(option =>
            option
                .setName('username')
                .setDescription("User to deduct points from.")
                .setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply({ephemeral: true });

        if(interaction.user.id != adminRoleId) {
            return interaction.editReply(`Only the admin can execute this command.`);
        }

        const user = interaction.options.getUser('username');
        const points = interaction.options.getNumber('points');

        Ambassadors.findOne({ where: { id: user.id } }).then(ambassador => {
			if(ambassador) {
                const curPoints = ambassador.points - points;
                // Avoid negative points.
                if (curPoints < 0) {
                    curPoints = 0;
                }
                Ambassadors.update({points: curPoints}, {where: {id: ambassador.id}}).then(affectedRows =>{
                   if (affectedRows > 0) {
                       interaction.editReply(`${points} Points deducted from ${user.username}  successfully.`);
                   };
                });
			} else {
				return interaction.editReply(`Failed to deduct ${points} Points from ${user.username}`);
			}
		});
	},
};