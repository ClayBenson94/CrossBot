// import cron from 'node-cron';
import dayjs from 'dayjs';
import { ClientWithCommands } from '../client';
import slugify from 'slugify';
import { createChannel } from '../commands/puzzle/new';
import { chromium } from 'playwright';

// const searchTerms = ['NY Times', 'LA Times'];
const searchTerms = ['NY Times'];
export default function SetupCron(client: ClientWithCommands) {
	// cron.schedule('0 10 * * *', async () => {
	(async () => {
		const guilds = client.guilds.cache.map(guild => guild);

		// Iterate over all guilds
		// for (const guild of guilds) {
		// }

		// const requestUrl = 'https://api.foracross.com/api/puzzle_list?page=0&pageSize=50&filter%5BnameOrTitleFilter%5D=NY&filter%5BsizeFilter%5D%5BMini%5D=true&filter%5BsizeFilter%5D%5BStandard%5D=true'
		const searchUrls = [];
		for (const searchTerm of searchTerms) {
			const currentDate = dayjs().format('MMMM D, YYYY');
			const searchFilter = encodeURIComponent(`${currentDate} ${searchTerm}`);
			searchUrls.push(`https://api.foracross.com/api/puzzle_list?page=0&pageSize=50&filter%5BnameOrTitleFilter%5D=${searchFilter}&filter%5BsizeFilter%5D%5BMini%5D=true&filter%5BsizeFilter%5D%5BStandard%5D=true`);
		}

		for (const searchUrl of searchUrls) {
			// await fetch(searchUrl);
			const fetchData = await fetch(searchUrl, {
				headers: {
					accept: '*/*',
				},
				body: null,
				method: 'GET',
			});

			// parse as json
			const puzzlesJson = (await fetchData.json()) as APIResponse;

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

			const browser = await chromium.launch();
			const page = await browser.newPage();
			await page.setViewportSize({
				width: 1280,
				height: 1080,
			});
			await page.goto(`https://downforacross.com/beta/play/${puzzleId}`);
			const url = await page.url();
			console.log('URL', url);

			const _ = await createChannel(guilds[0], channelTitle, url, 'bazinga');
		}
	// });
	})();
}

interface APIResponse {
	puzzles: {
		pid: string
		content: {
			info: {
				title: string
			}
		}
	}[]
}
