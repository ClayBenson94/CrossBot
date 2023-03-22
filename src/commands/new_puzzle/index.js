const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { generateSlug } = require('random-word-slugs')

const ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID="1084525753695215787"
const PUZZ_WATCHERS_ROLE_ID="1086705029316087908"


module.exports = {
	data: new SlashCommandBuilder()
	.setName('newpuzzle')
	.setDescription('Starts a new puzzle')
	.addStringOption(option =>
		option.setName('url')
			.setDescription('The full URL of the downforacross session')
			.setRequired(true)),
	async execute(interaction) {
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
		const createdChannel = await interaction.member.guild.channels.create({
			name: channelName,
			type: ChannelType.GuildText,
			topic: url
		});
		await createdChannel.setParent(ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID);
		await createdChannel.send(`🧩🚨 <@&${PUZZ_WATCHERS_ROLE_ID}>\nNew Puzzle alert!\n\nHead on over to ${url} to play along!`)
		await createdChannel.setTopic(`Head on over to ${url} to play along!`)
		await interaction.editReply({content: `#${createdChannel.id} has been created! 🎉`, ephemeral: true});
	},
};