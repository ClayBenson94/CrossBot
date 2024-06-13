import cron from 'node-cron';
import dayjs from 'dayjs';
import { ClientWithCommands } from '../client';
import slugify from 'slugify';
import { checkIfTooManyPuzzles, createChannel } from '../commands/puzzle/helpers';
import { chromium } from 'playwright';
import config from '../config';

export default function SetupCron(client: ClientWithCommands) {
	cron.schedule(config.dailyPuzzleCronUTC, async () => {
		const currentDate = dayjs().format('MMM D, YYYY');
		const guilds = client.guilds.cache.map(guild => guild);
		const guild = guilds[0]; // assume just one guild :)

		console.log(`Starting daily puzzle fetch (${currentDate})...`);
		for (const searchTerm of config.dailyPuzzleTerms) {
			const allChannels = await guild.channels.fetch();
			if (await checkIfTooManyPuzzles(guilds[0], allChannels)) {
				console.log(`\tToo many puzzles, skipping ${searchTerm}`);
				continue;
			}

			const searchFilter = encodeURIComponent(`${currentDate} ${searchTerm}`);
			const searchUrl = `https://api.foracross.com/api/puzzle_list?page=0&pageSize=50&filter%5BnameOrTitleFilter%5D=${searchFilter}&filter%5BsizeFilter%5D%5BMini%5D=true&filter%5BsizeFilter%5D%5BStandard%5D=true`;

			console.log(`\tSearching for ${searchTerm} puzzles...`);
			const fetchData = await fetch(searchUrl, {
				headers: {
					accept: '*/*',
				},
				body: null,
				method: 'GET',
			});

			// parse as json
			const puzzlesJson = (await fetchData.json()) as PuzzleListAPIResponse;

			// handle no results. Oops?
			if (puzzlesJson.puzzles.length === 0) {
				console.log(`\tNo puzzles found for ${searchTerm}`);
				continue;
			}

			// Get the first puzzle, assuming there's only one important result
			// const puzzleInfo = puzzlesJson['puzzles'][0]['content']['info'];
			// https://downforacross.com/beta/play/35406
			const puzzleTitle = puzzlesJson.puzzles[0].content.info.title;
			const puzzleId = puzzlesJson.puzzles[0].pid;
			const channelTitle = slugify(puzzleTitle, {
				remove: /[,._\-'"]/gm,
				replacement: '_',
				lower: true,
			});
			console.log(`\tFound puzzle: ${puzzleTitle} (pid: ${puzzleId}). Navigating to puzzle...`);

			const browser = await chromium.launch();
			const page = await browser.newPage();
			await page.setViewportSize({
				width: 1280,
				height: 1080,
			});
			await page.goto(`https://downforacross.com/beta/play/${puzzleId}`);
			await page.waitForURL('https://downforacross.com/beta/game/*');
			const url = await page.url();

			console.log(`\tGot puzzle URL: ${url}`);
			console.log(`\tCreating channel ${channelTitle}...`);

			const _ = await createChannel(guilds[0], channelTitle, url, client.user?.id || '');
		}
		console.log(`Finished daily puzzle fetch (${currentDate})`);
	});
}

// PuzzleListAPIResponse represents the response from the DownForACross API /api/puzzle_list
// It only captures the fields this application cares about, not the full response
interface PuzzleListAPIResponse {
	puzzles: {
		pid: string
		content: {
			info: {
				title: string
			}
		}
	}[]
}
