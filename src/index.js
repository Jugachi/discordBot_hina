const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, EmbedBuilder, ActivityType } = require('discord.js');
const deployCommands = require('./deploy-commands.js');
let { messageCount, randomChancePerMessage, generateMonsterEmbed, monsterPath } = require('./data/monsters');
let statstics  = require('./data/statistics.json');

require('dotenv').config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

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
		await deployCommands();
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

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);

	setInterval(() => {
		activitiesList.push({ name: `over ${updateTotalCharacter()} characters`, type: ActivityType.Watching });
	}, 60000);
	setInterval(() => {
		client.user.setPresence({ activities: [activitiesList[activityIndex]] });
		activityIndex = (activityIndex + 1 ) % activitiesList.length;
	}, 10000);
});

client.once('ready', async () => {
    try {
        await deployCommands();
    } catch (error) {
        console.error(error);
    }
});

client.on('messageCreate', async (message) => {
	if (message.author.bot) return;
	// Increment the message count
	const desiredCount = randomChancePerMessage();
	messageCount++;

setInterval(() => {
	if (messageCount >= desiredCount) {
		messageCount = 0;

		let guild = client.guilds.cache.get('117411643738161154')
		let channel = guild.channels.cache.get('1089663109515448411')

		const { embed: monsterEmbed, path: monsterPath } = generateMonsterEmbed();

	channel.send({ embeds: [monsterEmbed], files: [monsterPath] })
	}
}, 10000)});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_BOT_TOKEN);
