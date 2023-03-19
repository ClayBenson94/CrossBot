const { REST, Routes } = require('discord.js');
const clientId = process.env.DISCORD_CLIENT_ID;
const token = process.env.DISCORD_BOT_TOKEN;

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

async function registerSlashCommands(commandDataArray) {
	try {
		console.log(`Refreshing commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commandDataArray },
		);

		console.log(`Successfully refreshed slash commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
}

module.exports = registerSlashCommands