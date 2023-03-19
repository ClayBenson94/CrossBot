const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
	.setName('newpuzzle')
	.setDescription('Starts a new puzzle')
	.addStringOption(option =>
		option.setName('url')
			.setDescription('The full URL of the downforacross session')
			.setRequired(true)),
	async execute(interaction) {
		const url = interaction.options.getString('url');
		await interaction.reply({content: `You sent ${url} as the URL!`, ephemeral: true});
	},
};