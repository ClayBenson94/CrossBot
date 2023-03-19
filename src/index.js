// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const token = process.env.DISCORD_BOT_TOKEN;

// Import helper for registering slash commands
const registerSlashCommands = require('./register_slash_commands')

// Import all commands we care aboaut
const commands = require('./commands')

// Create a new client instance and set a callback to log when it's ready
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in the client
client.login(token);

// Instantiate all client commands
client.commands = new Collection();
for (const key in commands) {
  const command = commands[key];
  client.commands.set(command.data.name, command)
}

// Refresh all known slash commands
(async () => {
	await registerSlashCommands(client.commands.map(c => c.data.toJSON()));
})()

// Set up interaction handling
client.on(Events.InteractionCreate, async interaction => {
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});
