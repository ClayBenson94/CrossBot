const { Client, Events, GatewayIntentBits, Collection, MessageType } = require('discord.js');
const commands = require('./commands')

const token = process.env.DISCORD_BOT_TOKEN;

function SetupClient(login = true) {
	// Create a new client instance and set a callback to log when it's ready
	const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

	// Instantiate all client commands
	client.commands = new Collection();
	for (const key in commands) {
		const command = commands[key];
		client.commands.set(command.data.name, command)
	}

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

	// Delete own pin messages
	client.on(Events.MessageCreate, async message => {
		const isFromBot = message.author.bot;
		const isPinMessage = message.type === MessageType.ChannelPinnedMessage;
		const isFromSelf = message.author.id === client.user.id;

		if (isFromBot && isPinMessage && isFromSelf) {
			await message.delete();
		}
	});

	// If instructed to login, do so and return the client once you do
	if (login) {
		client.login(token);

		const clientLoggedInPromise = new Promise((resolve, _) => {
			client.once(Events.ClientReady, c => {
				console.log(`Ready! Logged in as ${c.user.tag}`);
				resolve(client)
			});
		});

		return clientLoggedInPromise
	} else { // otherwise, just return the client without logging in
		return new Promise((res, _) => {res(client)})
	}

}

module.exports = {
	SetupClient
}