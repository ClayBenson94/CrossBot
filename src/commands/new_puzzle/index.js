const { SlashCommandBuilder, ChannelType } = require('discord.js');
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
			const DFAC_REGEX = /https:\/\/downforacross.com\/beta\/game\/(.*)/igm //create this each function so that .test() doesn't mess up lastindex
			await interaction.deferReply({ephemeral: true});
			const url = interaction.options.getString('url');
	
			if (!DFAC_REGEX.test(url)) {
				await interaction.editReply({
					content: "⚠️ Your URL didn't seem to be quite what I expected.\nMake sure it's got \"/beta/game\" in it to ensure it's a puzzle session!",
					ephemeral: true
				})
				return
			}
	
			const channelName = generateSlug(3, {
				format: 'kebab',
				partsOfSpeech: ['adjective', 'adjective', 'noun']
			}).replaceAll('-', '_');

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
				name: channelName,
				type: ChannelType.GuildText,
				topic: `Head on over to ${url} to play along! 📝`,
				parent: categoryChannel,
			});
	
			// send an announcement message
			await createdChannel.send(`🧩🚨 <@&${PUZZ_WATCHERS_ROLE_ID}>\nNew Puzzle alert!\n\nHead on over to ${url} to play along! 📝\n\nThanks to <@${interaction.member.id}> for submitting this one! 🤜 🤛`)

			// Reply to the user to point them to the new channel
			await interaction.editReply({content: `<#${createdChannel.id}> has been created! 🎉`, ephemeral: true});
		} catch (e) {
			console.error("Error in command", e)
		}
	},
};