const { SlashCommandBuilder } = require('discord.js');
const {Ambassadors} = require('../../models/database.js');
const {adminRoleId} = require('../../config.json');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('add')
		.setDescription('Add points to an ambassador.')
		.addNumberOption(option =>
			option
				.setName('points')
				.setDescription('Number of points to add.')
			    .setRequired(true))
        .addUserOption(option =>
            option
                .setName('username')
                .setDescription("User to add points to.")
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
                const prevPoints = ambassador.points
                Ambassadors.update({points: prevPoints + points}, {where: {id: ambassador.id}}).then(affectedRows =>{
                   if (affectedRows > 0) {
                       interaction.editReply(`${points} Points added to ${user.username}  successfully.`);
                   };
                });
			} else {
				return interaction.editReply(`Failed to add ${points} Points to ${user.username}`);
			}
		});
	},
};