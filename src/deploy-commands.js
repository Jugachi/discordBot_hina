require('dotenv').config();

const { REST, Routes} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

async function deployCommands(client) {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const guildIds = process.env.GUILD_ID.split(',');
		const guilds = await Promise.all(guildIds.map(id => client.guilds.fetch(id)));

		for (const guild of guilds) {
			const data = await rest.put(
				Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
				{ body : commands },
			);
			console.log(`Successfully reloaded ${data.length} application (/) commands for guild ${guild.id}`);
			
		}
	} catch (error) {
		console.error(error.message);
	}
}

module.exports = {
	commands,
	deployCommands
}