const { SlashCommandBuilder, ChannelType, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID, PUZZ_WATCHERS_ROLE_ID, OLD_PUZZLES_CHANNEL_CATEGORY_ID } = require('../../config');
const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
dayjs.extend(relativeTime);

const NEW_PUZZLE_SUBCMD = "new";
const CLOSE_PUZZLE_SUBCMD = "close";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('puzzle')
		.setDescription("Manage puzzles")
		.addSubcommand(subcommand =>
			subcommand
				.setName(NEW_PUZZLE_SUBCMD)
				.setDescription('Starts a new puzzle')
				.addStringOption(option => 
					option
						.setName('url')
						.setDescription('The full URL of the downforacross session')
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName(CLOSE_PUZZLE_SUBCMD)
				.setDescription('Finishes and archives a puzzle')
		),
	async execute(interaction) {
		switch (interaction.options.getSubcommand()) {
			case NEW_PUZZLE_SUBCMD:
				// do new puzzle stuff
				newpuzzle(interaction);
				break;
			case CLOSE_PUZZLE_SUBCMD:
				// do close puzzle stuff
				closepuzzle(interaction);
				break;
		}
	}
};

async function newpuzzle(interaction) {
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
}

async function closepuzzle(interaction) {
	try {
		await interaction.deferReply({ephemeral: true});

		// Check to see if this was invoked in an active puzzle channel
		const channelSentIn = await interaction.member.guild.channels.fetch(interaction.channelId)
		
		if (channelSentIn?.parentId !== ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID) {
			await interaction.editReply({
				content: "☝️ Tsk tsk! You can't use this command to archive anything but puzzles in the \"Active Puzzles\" category!",
				ephemeral: true
			})
			return
		}

		const timeDiff = dayjs(channelSentIn.createdAt).fromNow(true)
		await channelSentIn.send(`🏁 This puzzle has been marked as completed by <@${interaction.member.id}>! It took ${timeDiff} to solve! 🕔🎉`)
		await channelSentIn.setParent(OLD_PUZZLES_CHANNEL_CATEGORY_ID)

		await interaction.editReply({content: `You closed <#${channelSentIn.id}>`, ephemeral: true});
	} catch (e) {
		console.error("Error in command", e)
	}
}