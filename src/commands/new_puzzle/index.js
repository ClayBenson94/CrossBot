const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { generateSlug } = require('random-word-slugs')

const ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID="1084525753695215787"
const PUZZ_WATCHERS_ROLE_ID="1086705029316087908"

const DRY_RUN=process.env.CROSSBOT_DRY_RUN == "1"
const DRY_RUN_CHANNEL_CATEGORY_ID="1084539498278424707"

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
	
			let categoryID = ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID;
			if (DRY_RUN) {
				categoryID = DRY_RUN_CHANNEL_CATEGORY_ID;
			}

			// Check to see if we have too many puzzles already
			const allChannels = await interaction.member.guild.channels.fetch()
			const numActivePuzzles = allChannels.filter(ch => {
				return ch.parentId === categoryID
			}).size
			
			if (numActivePuzzles >= 5) {
				await interaction.editReply({content: `⚠️ There are too many puzzles currently active! Try completing some of the existing ones first! 🧠`, ephemeral: true});
				return;
			}
	
			// make the channel
			const categoryChannel = await interaction.member.guild.channels.fetch(categoryID)
			const createdChannel = await interaction.member.guild.channels.create({
				name: channelName,
				type: ChannelType.GuildText,
				topic: `Head on over to ${url} to play along! 📝`,
				parent: categoryChannel,
			});
	
			// send an announcement message
			await createdChannel.send(`🧩🚨 <@&${PUZZ_WATCHERS_ROLE_ID}>\nNew Puzzle alert!\n\nHead on over to ${url} to play along! 📝\n\nThanks to <@${interaction.member.id}>, for submitting this one! 🤜 🤛`)

			// Reply to the user to point them to the new channel
			await interaction.editReply({content: `<#${createdChannel.id}> has been created! 🎉`, ephemeral: true});
		} catch (e) {
			console.error("Error in command", e)
		}
	},
};