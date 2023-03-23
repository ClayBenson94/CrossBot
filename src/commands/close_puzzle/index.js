const { SlashCommandBuilder } = require('discord.js');
const { ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID, OLD_PUZZLES_CHANNEL_CATEGORY_ID } = require('../../config')
const dayjs = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)

module.exports = {
	data: new SlashCommandBuilder()
	.setName('closepuzzle')
	.setDescription('Finishes and archives a puzzle channel'),
	async execute(interaction) {
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
	},
};