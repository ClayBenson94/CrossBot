import {
	ChannelType,
	ButtonStyle,
	ActionRowBuilder,
	ButtonBuilder,
	Guild,
	CategoryChannel,
	Collection,
	NonThreadGuildBasedChannel,
	TextChannel,
} from 'discord.js';
import { ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID, PUZZ_WATCHERS_ROLE_ID } from '../../config';
import { chromium } from 'playwright';

const DFAC_REGEX = /https:\/\/downforacross.com\/beta\/game\/(.*)/im; // create this each function so that .test() doesn't mess up lastindex

export const urlFormatIsValid = async (url: string): Promise<boolean> => {
	const match = url.match(DFAC_REGEX);
	if (!match || !url) {
		return false;
	}

	return true;
};

export const checkIfTooManyPuzzles = async (guild: Guild, channels: Collection<string, NonThreadGuildBasedChannel | null>): Promise<boolean> => {
	const numActivePuzzles = channels.filter((ch) => {
		return ch?.parentId === ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID;
	}).size;

	if (numActivePuzzles >= 5) {
		return true;
	}
	return false;
};

export const fetchPuzzleTitleFromUrl = async (url: string): Promise<string | null> => {
	const browser = await chromium.launch();
	const page = await browser.newPage();
	await page.setViewportSize({
		width: 1280,
		height: 1080,
	});
	await page.goto(url);
	const puzzleTitle = await page.locator('.chat--header--title').textContent();
	await browser.close();
	return puzzleTitle;
};

export const createChannel = async (guild: Guild, title: string, url: string, submitterUserId: string): Promise<TextChannel> => {
	const categoryChannel = await guild.channels.fetch(ACTIVE_PUZZLES_CHANNEL_CATEGORY_ID) as CategoryChannel;
	const createdChannel = await guild.channels.create({
		name: title,
		type: ChannelType.GuildText,
		parent: categoryChannel,
		topic: url,
	});

	// build and send an announcement message
	const row = new ActionRowBuilder<ButtonBuilder>()
		.addComponents(
			new ButtonBuilder()
				.setLabel('Play this crossword!')
				.setStyle(ButtonStyle.Link)
				.setURL(url),
		);

	const msg = await createdChannel.send({
		content: `🧩🚨 <@&${PUZZ_WATCHERS_ROLE_ID}> New Puzzle added!\nThanks to <@${submitterUserId}> for submitting this one! 🤜 🤛`,
		components: [row],
	});
	await msg.pin();
	return createdChannel;
};
