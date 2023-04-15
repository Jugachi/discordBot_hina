const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, EmbedBuilder, ActivityType, REST, Routes } = require('discord.js');
const { deployCommands, commands} = require('./deploy-commands.js');
let { messageCount, randomChancePerMessage, generateMonsterEmbed, monsterPath } = require('./data/monsters');
let statstics  = require('./data/statistics.json');
const dotenv = require('dotenv');
const { getGuildConfig } = require('./data/constants.js');

require('dotenv').config();

// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent
	],
});

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	if (interaction.commandName === 'deploy-commands') {
		await deployCommands(client);
		await interaction.reply('Application commands reloaded!');
	}
	
	const command = interaction.client.commands.get(interaction.commandName);

	if(!command) {
		console.error(`No command matching ${interaction.commandName} was found`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true});
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true});
		}
	}
});

let activitiesList = [];

function updateTotalCharacter() {
	let data = JSON.parse(fs.readFileSync('./data/statistics.json'))
	return data.totalCharacter
}
updateTotalCharacter();

activitiesList.push({ name: 'start with /create'});
activitiesList.push({ name: `over ${updateTotalCharacter()} characters`, type: ActivityType.Watching });

let activityIndex = 0;

dotenv.config({ path: '.env' });
const envConfig = dotenv.parse(fs.readFileSync('.env'));
let guildIDs = envConfig.GUILD_ID ? envConfig.GUILD_ID.split(';') : [];
// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);

	const guildIDs = client.guilds.cache.map(guild => guild.id);
	console.log(`Bot is on guilds: ${guildIDs.join(', ')}`);
	envConfig.GUILD_ID = guildIDs.join(',');
	const envString = Object.entries(envConfig).map(([key, value]) => `${key}=${value}`).join('\n');
	fs.writeFileSync('.env', envString);
	deployCommands(client);

	setInterval(() => {
		activitiesList.pop();
		activitiesList.push({ name: `over ${updateTotalCharacter()} characters`, type: ActivityType.Watching });
	}, 60000);
	setInterval(() => {
		client.user.setPresence({ activities: [activitiesList[activityIndex]] });
		activityIndex = (activityIndex + 1 ) % activitiesList.length;
	}, 10000);
});

client.on('guildCreate', async guild => {

	guildIDs.push(guild.id);
	console.log(`Added guild ${guild.id} (${guild.name}) to list`);

	envConfig.GUILD_ID = guildIDs.join(',');

	const envString = Object.entries(envConfig).map(([key, value]) => `${key}=${value}`).join('\n');
	fs.writeFileSync('.env', envString);

	await new Promise(resolve => setTimeout(resolve, 5000));

	try {
		data = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
			{ body : commands },
		);
		console.log(`Successfully reloaded ${data.length} application (/) commands for guild ${guild.id}`);
	} catch (error) {
		console.error(`Failed to deploy commands for guild ${guild.id}: ${error.message}`);
	}

	 // Find a channel where the bot can send messages
	const channel = guild.channels.cache.find(channel =>
		channel.type === 0 // && channel.permissionsFor(guild.me).has('SEND_MESSAGES')
	);
	
	  // If the bot cannot find a channel to send messages, return
	if (!channel) {
		console.log(`Could not find a channel to send messages in guild ${guild.name} (id: ${guild.id}).`);
		return;
	}
	
	// Send a message to the channel
	channel.send(`Hello, everyone! Make sure to use /setchannel to configure a channel!`);
});

client.on('guildDelete', guild => {
	console.log(guildIDs)
	const index = guildIDs.indexOf(guild.id);

	if (index > -1) {
		guildIDs.splice(index, 1);
		console.log(`Removed guild ${guild.id} (${guild.name}) from list`);
		dotenv.config({ path: '.env'});
		const envConfig = dotenv.parse(fs.readFileSync('.env'));
		envConfig.GUILD_ID = guildIDs.join(',');
		const envString = Object.entries(envConfig).map(([key, value]) => `${key}=${value}`).join('\n');
		fs.writeFileSync('.env', envString);
	} else {
		console.log(`Guild ${guild.id} (${guild.name}) not found in list`)
	}
})

client.on('messageCreate', async (message) => {
	if (message.author.bot) return;

	if (message.content === 'update' && message.author.id === process.env.AUTHOR) {
		deployCommands(client)
		const guildIDs = client.guilds.cache.map(guild => guild.id);
		client.users.send(process.env.AUTHOR, `Updated commands for: ${guildIDs.join(', ')}` )
	}

	const guildId = message.guild.id;
	const guildConfig = await getGuildConfig(guildId);
	if (!guildConfig) return;
	// Increment the message count
	const desiredCount = randomChancePerMessage();
	guildConfig.messageCount++;

	// Write updated messageCount to the JSON file
	const filePath = 'data/guilds.json';
	const guildConfigs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	guildConfigs[guildId] = guildConfig;
	fs.writeFileSync(filePath, JSON.stringify(guildConfigs, null, 2));

	console.log('Guild: ' + message.guild.name + ' ~ Messages: ' + guildConfig.messageCount + ' ~ Possible Monster spawn: ' + desiredCount);

setInterval(() => {
	if (guildConfig.messageCount >= desiredCount) {
		guildConfig.messageCount = 0;

		fs.writeFileSync(filePath, JSON.stringify(guildConfigs, null, 2));

		const channelId = guildConfig.channelId;

		if(!channelId) {
			console.log('Channel not set for guild ' + guildId);
			return;
		}

		const guild = client.guilds.cache.get(guildId);
		if (!guild) return;
		const channel = guild.channels.cache.get(channelId);
		if (!channel) return;

		const { embed: monsterEmbed, path: monsterPath } = generateMonsterEmbed();

	channel.send({ embeds: [monsterEmbed], files: [monsterPath] })
	}
}, 500)});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_BOT_TOKEN);