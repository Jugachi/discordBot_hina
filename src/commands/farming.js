const fs = require('fs');
const { SlashCommandBuilder, EmbedBuilder, bold, blockQuote, codeBlock } = require('discord.js');
let { streakChecker } = require('../data/streak');
let string = ``;
let boldString = bold(string);
let blockQuoteString = blockQuote(string);
let codeBlockString = codeBlock(string);

const levels = require(`${__dirname}/../data/levels.json`);
const cooldowns = require(`${__dirname}/../data/cooldowns.json`);
const streaks = require(`${__dirname}/../data/streaks.json`);
const constants = require(`${__dirname}/../data/constants`)

//Cooldown in minutes
const COOLDOWN_DURATION = 60;

function expCalculation(exp, constants, currentLevel, streak) {
	const newExp = exp + Math.floor(Math.floor(Math.random() * 10) + 1 * currentLevel * constants.eventBonus * streakChecker(streak));
	return { newExp };
}

module.exports = {
	data: new SlashCommandBuilder()
			.setName('farming')
			.setDescription('Let your character farm for 1 hour'),

	async execute(interaction) {
		const storagePath = `${__dirname}/../data/playerdata`;
		const userFiles = fs.readdirSync(storagePath).filter(file => file.endsWith('.json') && file.includes(interaction.user.id));
		if (userFiles.length === 0) {
			return interaction.reply(`You must use the /create command before you can farm.`);
		}
		// Check if the user is on cooldown
		if (cooldowns[interaction.user.id] && Date.now() < cooldowns[interaction.user.id]) {
			return interaction.reply(`You are on cooldown. Please wait until <t:${Math.floor(cooldowns[interaction.user.id] / 1000)}:t>.`);
		}
		// Read the user's data from the storage file
		const playerDataPath = `${storagePath}/${interaction.user.id}.json`;
		let userStorage = {};
		if (fs.existsSync(playerDataPath)) {
			userStorage = JSON.parse(fs.readFileSync(playerDataPath));
		}

		// Retrieve the user's current values or set them to 0 if they don't exist
		let currentLevel = userStorage.level || 1;
		let previousLevel = userStorage.level;
		let availableStatPoints = userStorage.availableStatPoints || 0;
		const exp = userStorage.exp || 0;
		const gold = userStorage.gold || 0;
		let streak = userStorage.streak || 0;

		const streakCooldown = 24 * 60 * 60 * 1000; // 24 hours

		if (streaks[interaction.user.id]) {
			const lastUsed = streaks[interaction.user.id];
			const timeSinceLastUsed = Date.now() - lastUsed;

			if (timeSinceLastUsed < streakCooldown) {

			} else {
				userStorage.streak++;
				streaks[interaction.user.id] = Date.now();
				fs.writeFileSync(`${__dirname}/../data/streaks.json`, JSON.stringify(streaks, null, 2));
			}
		} else {
			userStorage.streak = 0;
			streaks[interaction.user.id] = Date.now();
			fs.writeFileSync(`${__dirname}/../data/streaks.json`, JSON.stringify(streaks, null, 2));
		}
		
		//fs.writeFileSync(`${__dirname}/../data/streaks.json`, JSON.stringify(streaks, null, 2));

		// Increment the values by a random amount
		let { newExp } = expCalculation(exp, constants, currentLevel, streak);
		let gainedExp = newExp - exp;
		const newGold = gold + Math.floor(Math.random() * 50) + 1;

		// Check for level up
		let requiredExp = levels[currentLevel];
		while (newExp >= requiredExp) {
			currentLevel++;
			availableStatPoints += 2;
			requiredExp = levels[currentLevel];
			newExp = 0;
		}

		userStorage.level = currentLevel;

		// Store the new values in the user's storage object
		userStorage.exp = newExp;
		userStorage.gold = newGold;
		userStorage.level = currentLevel;
		userStorage.availableStatPoints = availableStatPoints;

		const currentLevelExp = levels[currentLevel.toString()];
		const remainingExp = currentLevelExp - newExp;
		
		// Write the updated storage object back to the storage file
		fs.writeFileSync(playerDataPath, JSON.stringify(userStorage, null, 2));

		// Set the user on cooldown
		cooldowns[interaction.user.id] = Date.now() + COOLDOWN_DURATION * 60 * 1000;
		fs.writeFileSync(`${__dirname}/../data/cooldowns.json`, JSON.stringify(cooldowns, null, 2));

		const farmingEmbed = new EmbedBuilder()
			.setColor(0xfffff)
			.setTitle('Farming')
			.setDescription('Your farming results are here')
			.setAuthor({ name: `${userStorage.characterName}`, iconURL: `${interaction.user.avatarURL()}` })
			
			if (currentLevel > previousLevel) {
				farmingEmbed.addFields(
					{ name: 'Level' , value: `${currentLevel}`},
					{ name: 'EXP until next Level', value: `${levels[currentLevel + 1]}` },
					{ name: 'Gained', value: `EXP: +${gainedExp}\nGold: +${newGold - gold}\nStreak: ${userStorage.streak}`},
					{ name: 'EXP', value: `${exp} → ${newExp}`, inline: true},
					{ name: 'Gold', value: `${gold} → ${newGold}`, inline: true},
					{
						name: 'Cooldown', value: `Next use at <t:${Math.floor(cooldowns[interaction.user.id] / 1000)}:t>`
					}
				)
				.setFooter({ text: 'Still under development!'})
			} else {
				farmingEmbed.addFields(
					{ name: 'Level' , value: `${currentLevel}`},
					{ name: 'EXP until next Level', value: `${remainingExp}` },
					{ name: 'Gained', value: `EXP: +${newExp - exp}\nGold: +${newGold - gold}\nStreak: ${userStorage.streak}`},
					{ name: 'EXP', value: `${exp} → ${newExp}`, inline: true},
					{ name: 'Gold', value: `${gold} → ${newGold}`, inline: true},
					{
						name: 'Cooldown', value: `Next use at  <t:${Math.floor(cooldowns[interaction.user.id] / 1000)}:t>`
					}
				)
				.setFooter({ text: 'Still under development!'})
			}

		if (currentLevel > previousLevel) {
			const levelUpEmbed = new EmbedBuilder()
			.setColor(0x00ff00)
			.setTitle('Level up!')
			.setDescription('Congratz your character got a level up!')
			.setAuthor({ name: `${userStorage.characterName}`, iconURL: `${interaction.user.avatarURL()}` })
			.addFields(
				{ name: 'Level' , value: `${previousLevel} → ${currentLevel} `},
			)
			.setFooter({ text: 'Still under development!'})

			interaction.reply({ embeds: [farmingEmbed, levelUpEmbed]});

		} else {
			interaction.reply({ embeds: [farmingEmbed]});
		}
	}
};