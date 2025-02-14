const { SlashCommandBuilder } = require("discord.js");
const { Ambassadors } = require("../../models/database.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unlink")
        .setDescription("Unlink your X account"),
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            Ambassadors.findOne({ where: { id: interaction.user.id } }).then(
                async (ambassador) => {
                    if (ambassador) {
                        // return if X id is not linked.
                        if (!ambassador.x_user_id) {
                            return interaction.editReply(
                                `Your X account is not linked, link your X account using /link command.`
                            );
                        }
                        Ambassadors.update(
                            {
                                x_user_id: "",
                                oauth_token: "",
                                oauth_token_secret: "",
                                x_access_token: "",
                                x_screen_name: "",
                                x_access_secret: ""
                            },
                            { where: { id: ambassador.id } }
                        ).then((affectedRows) => {
                            if (affectedRows > 0) {
                                return interaction.editReply({
                                    content: `Your X id has been unlinked. Link your X ID using \\link`,
                                    ephemeral: true,
                                });
                            } else {
                                return interaction.editReply(
                                    `An error occured unlinking your X Id, please contact admin`
                                );
                            }
                        });
                    } else {
                        return interaction.editReply({
                            content: `Your X account is not linked, link account using /link command.`,
                            ephemeral: true,
                        });
                    }
                }
            );
        } catch (error) {
			console.error('❗ Error in unlink cmd:', error);
		}
    },
};