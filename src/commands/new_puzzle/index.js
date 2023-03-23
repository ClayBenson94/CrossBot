const { SlashCommandBuilder, ChannelType, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { generateSlug } = require('random-word-slugs');
const { ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID, PUZZ_WATCHERS_ROLE_ID } = require('../../config')

module.exports = {
	data: new SlashCommandBuilder()
	.setName('newpuzzle')
	.setDescription('Starts a new puzzle')
	.addStringOption(option =>
		option.setName('url')
			.setDescription('The full URL of the downforacross session')
			.setRequired(true)),
	async execute(interaction) {
		try {
			const DFAC_REGEX = /https:\/\/downforacross.com\/beta\/game\/(.*)/im //create this each function so that .test() doesn't mess up lastindex
			await interaction.deferReply({ephemeral: true});
			const url = interaction.options.getString('url');
	
			const match = url.match(DFAC_REGEX)
			if (!match) {
				await interaction.editReply({
					content: "⚠️ Your URL didn't seem to be quite what I expected.\nMake sure it's got \"/beta/game\" in it to ensure it's a puzzle session!",
					ephemeral: true
				})
				return
			}
			const [_, gameID] = match;

			// Check to see if we have too many puzzles already
			const allChannels = await interaction.member.guild.channels.fetch()
			const numActivePuzzles = allChannels.filter(ch => {
				return ch.parentId === ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID
			}).size
			
			if (numActivePuzzles >= 5) {
				await interaction.editReply({content: `⚠️ There are too many puzzles currently active! Try completing some of the existing ones first! 🧠`, ephemeral: true});
				return;
			}
	
			// make the channel
			const categoryChannel = await interaction.member.guild.channels.fetch(ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID)
			const createdChannel = await interaction.member.guild.channels.create({
				name: gameID,
				type: ChannelType.GuildText,
				parent: categoryChannel,
			});
	
			// build and send an announcement message
			const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setLabel('Play this crossword!')
					.setStyle(ButtonStyle.Link)
					.setURL(url),
			)

			const msg = await createdChannel.send({
				content: `🧩🚨 <@&${PUZZ_WATCHERS_ROLE_ID}> New Puzzle added!\nThanks to <@${interaction.member.id}> for submitting this one! 🤜 🤛`,
				components: [row]
			});
			await msg.pin();

			// Reply to the user to point them to the new channel
			await interaction.editReply({content: `<#${createdChannel.id}> has been created! 🎉`, ephemeral: true});
		} catch (e) {
			console.error("Error in command", e)
		}
	},
};