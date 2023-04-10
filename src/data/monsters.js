const path = require('path')
const fs = require('fs')
const monsterStorage = (`${process.cwd()}/data/monsters.json`);
const monsterDirectory = (`${process.cwd()}/assets/monsters`);
const { EmbedBuilder } = require('discord.js');

let monsterPath;
function generateMonsterEmbed(monsterPath) {
	let monsters = JSON.parse(fs.readFileSync(monsterStorage));
	let monster = monsters[Math.floor(Math.random() * monsters.length)];
	monsterPath = path.join(monsterDirectory, `${monster.img}.png`);
	let inventory = monster.inventory;
	let itemNames = '';
	inventory.forEach(item => itemNames += `${item.name}\n`)

	const monsterEmbed = new EmbedBuilder()
		.setTitle(monster.name)
		.setImage(`attachment://${monster.img}.png`)
		.addFields(
			{ name: 'Level', value: `${monster.level}`},
			{ name: 'Description', value: `${monster.description}`},
			{ name: 'HP', value: `${monster.hp}`, inline: true },
			{ name: 'MP', value: `${monster.mp}`, inline: true },
			{ name: 'FP', value: `${monster.fp}`, inline: true },
			{ name: 'Attack', value: `${monster.physicalATK}`, inline: true },
			{ name: 'Magic Attack', value: `${monster.magicATK}`, inline: true },
			{ name: 'Atk Speed', value: `${monster.atkSpeed}%`, inline: true },
			{ name: 'STR', value: `${monster.str}`, inline: true },
			{ name: 'STA', value: `${monster.sta}`, inline: true },
			{ name: 'DEX', value: `${monster.dex}`, inline: true },
			{ name: 'INT', value: `${monster.int}`, inline: true },
			{ name: 'Drops', value: itemNames },
		)
		.setFooter({ text: 'Still under development' })

		return {embed: monsterEmbed, path: monsterPath};
}

let messageCount = 0;
function randomChancePerMessage() {
	const percentChance = 20;
	const randomNum = Math.floor(Math.random()* 100) + 1;

	if (randomNum <= percentChance) {
		const totalMessages = 100;
		const desiredCount = Math.floor(Math.random() * totalMessages + 10);
		return desiredCount
	}
}

module.exports = {
	messageCount,
	randomChancePerMessage,
	generateMonsterEmbed
}