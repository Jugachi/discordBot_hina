const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const storagePath = `${__dirname}/../data/playerdata`;

function getAvailableStatPoints(userID) {
	const playerDataPath = `${storagePath}/${userID}.json`;
	let userStorage = {};
	if (fs.existsSync(playerDataPath)) {
		userStorage = JSON.parse(fs.readFileSync(playerDataPath));
	}

	return userStorage.availableStatPoints || 0;
}

function addStatPoints(userID, stat, points) {
	const playerDataPath = `${storagePath}/${userID}.json`;
	let userStorage = {};
	if (fs.existsSync(playerDataPath)) {
		userStorage = JSON.parse(fs.readFileSync(playerDataPath));
	}

	switch (stat) {
		case 'str':
			userStorage.str += points;
			userStorage.physicalATK += points * 15;
			break;
		case 'sta':
			userStorage.sta += points;
			userStorage.hp += points * 5;
			userStorage.def += points * 3;
			break;
		case 'dex':
			userStorage.dex += points;
			userStorage.physicalATK += points * 15;
			userStorage.atkSpeed += points * 0.25;
			break;
		case 'int':
			userStorage.int += points;
			userStorage.mp += points * 9;
			userStorage.magicATK += points * 15;
			break;
		default:
			userStorage[stat] += points;
			break;
	}
	
	fs.writeFileSync(playerDataPath, JSON.stringify(userStorage));
}

function updateAvailableStatPoints(userID, usedPoints) {
	const playerDataPath = `${storagePath}/${userID}.json`;
	let userStorage = {};
	if (fs.existsSync(playerDataPath)) {
		userStorage = JSON.parse(fs.readFileSync(playerDataPath));
	}
	
	userStorage.availableStatPoints -= usedPoints;

	fs.writeFileSync(playerDataPath, JSON.stringify(userStorage));
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('distributeatatpoints')
		.setDescription('Distrubte available stat points')
		.addIntegerOption(option =>
			option.setName('str')
				.setDescription('Number of stats points to add to STR')
				.setRequired(false))
			
		.addIntegerOption(option =>
			option.setName('sta')
				.setDescription('Number of stats points to add to STA')
				.setRequired(false))
			
		.addIntegerOption(option =>
			option.setName('dex')
				.setDescription('Number of stats points to add to DEX')
				.setRequired(false))
			
		.addIntegerOption(option =>
			option.setName('int')
				.setDescription('Number of stats points to add to INT')
				.setRequired(false)),
			
		
		async execute(interaction) {

			// Read the user's data from the storage file
			const playerDataPath = `${storagePath}/${interaction.user.id}.json`;
			let userStorage = {};
			if (fs.existsSync(playerDataPath)) {
				userStorage = JSON.parse(fs.readFileSync(playerDataPath));
			}

			const user = interaction.user;
			const STR = interaction.options.getInteger('str') || 0;
			const STA = interaction.options.getInteger('sta') || 0;
			const DEX = interaction.options.getInteger('dex') || 0;
			const INT = interaction.options.getInteger('int') || 0;

			const availableStatPoints = getAvailableStatPoints(user.id);
			if (availableStatPoints === 0) {
				return interaction.reply('You have no available stat points.');
			}

			const totalStatPoints = STR + STA + DEX + INT;
			if (totalStatPoints === 0) {
				return interaction.reply('You need to distribute at least 1 stat point.');
			}

			if (totalStatPoints > availableStatPoints) {
				return interaction.reply(`You only have ${availableStatPoints} available stat point(s).`)
			}

			const stats = ['str', 'sta', 'dex', 'int'];
			const statValues = [STR, STA, DEX, INT];
			for (let i = 0; i < stats.length; i++) {
				const stat = stats[i];
				const statValue = statValues[i];
				if (statValue > 0) {
					addStatPoints(user.id, stat, statValue);
				}
			}

			updateAvailableStatPoints(user.id, totalStatPoints);

			return interaction.reply(`You have successfully distributed ${totalStatPoints} stat point(s).`)
		}
	}