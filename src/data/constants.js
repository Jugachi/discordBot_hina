const eventBonus = 1.05;
const supporterBonus = 1.1;

const fs = require('fs');
const path = require('path');

function getGuildConfig(guildId) {
	const filePath = 'data/guilds.json';
	const data = fs.readFileSync(filePath, 'utf8');
	const guildConfigs = JSON.parse(data);
	return guildConfigs[guildId] || null;
  }
  


module.exports = {
	eventBonus: eventBonus,
	supporterBonus: supporterBonus,
	getGuildConfig
};