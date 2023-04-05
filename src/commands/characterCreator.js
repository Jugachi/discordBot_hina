const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create')
		.setDescription('Create your character')
		.addStringOption(option =>(
			option.setName('name')
				.setDescription('Choose your character name')
				.setMinLength(3)
				.setMaxLength(16)
				.setRequired(true)
		))
		.addStringOption(option => (
			option.setName('sex')
				.setDescription('Choose a sex of your character')
				.setRequired(true)
				.addChoices(
					{ name: 'male' , value: '♂️' },
					{ name: 'female', value: '♀️' }
				)
		))
		.addStringOption(option => (
			option.setName('class')
				.setDescription('Choose a class for your character')
				.setRequired(true)
				.addChoices(
					{ name: 'Warrior' , value: '⚔️' },
					{ name: 'Mage', value: '🧙' }
				)
		)),

	async execute(interaction) {
		const characterName = interaction.options.getString('name');
		const storagePath = `${__dirname}/../data/playerdata`;
		
		// Checks if a user has already created a character
		const userFiles = fs.readdirSync(storagePath).filter(file => file.endsWith('.json') && file.includes(interaction.user.id));
		if (userFiles.length > 0 ) {
			interaction.reply(`You have already created a character. You can't create another one.`);
			return;
		}

		// Checks if a character name is already in use
		const files = fs.readdirSync(storagePath);
		for (const file of files) {
			if (file.endsWith('.json')) {
				const filePath = `${storagePath}/${file}`;
				const userStorage = JSON.parse(fs.readFileSync(filePath));
				if (userStorage.characterName === characterName) {
					message = 'This character name is already in use. Please choose another name';
					break;
				}
			}
		}

		const storageFilePath = `${__dirname}/../data/playerdata/${interaction.user.id}.json`;
		const userStorage = {
			characterName: characterName,
			sex: interaction.options.getString('sex'),
			class: interaction.options.getString('class'),
			level: 1,
			exp: 0,
			penya: 0,
			supporter: 0,
			streak: 0,
			hp: 500,
			mp: 100,
			fp: 75,
			str: 15,
			sta: 15,
			dex: 15,
			int: 15,
			availableStatPoints: 0,
			physicalATK: 100,
			def: 25,
			atkSpeed: 50,
			magicATK: 100,
			inventory: []
		};

		const itemsFile = fs.readFileSync(`${__dirname}/../data/items.json`);

		const chosenClass = interaction.options.getString('class');
		if (chosenClass === '⚔️') {
			const items = JSON.parse(itemsFile);
			const item = items.find((i) => i.name === 'Beginner Sword');
			userStorage.inventory.push(item);
		} else if (chosenClass === '🧙') {
			const items = JSON.parse(itemsFile);
			const item = items.find((i) => i.name === 'Beginner Wand');
			userStorage.inventory.push(item);
		}

			fs.writeFileSync(storageFilePath, JSON.stringify(userStorage, null, 2));
			interaction.reply(`The ${userStorage.sex} ${userStorage.class}, ${characterName} has been successfully created. Time to start /farming!`);
			console.log(`${interaction.user.tag} has created a character.`)

			const statisticsDB = `${__dirname}/../data/statistics.json`
			const statistics = {};
			let totalCharacter = statistics.totalCharacter || 0;
			totalCharacter++;
			statistics.totalCharacter = totalCharacter;
			
			fs.writeFileSync(statisticsDB, JSON.stringify(statistics, null, 2));
	},
};