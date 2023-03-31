const fs = require('fs');
const path = require('path')
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
			.setName('stats')
			.setDescription('Shows your characters stats'),

		async execute(interaction) {
			const storagePath = `${__dirname}/../data/playerdata`;
			const userFiles = fs.readdirSync(storagePath).filter(file => file.endsWith('.json') && file.includes(interaction.user.id));
			if (userFiles.length === 0) {
				return interaction.reply(`You must use the /create command before you can see the stats of your char.`);
			} else {

			const playerDataPath = path.join(__dirname, '..', 'data', 'playerdata');
			fs.readdirSync(playerDataPath)
			.filter(file => file.endsWith('.json'))
			.forEach(file => delete require.cache[require.resolve(path.join(playerDataPath, file))]);

			const userStorage = require(`${storagePath}/${interaction.user.id}.json`);
			const statsEmbed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('Character Stats')
			.setDescription('Displays all your characters stats.')
			.setThumbnail(`${interaction.user.avatarURL()}`)
			.addFields(
				{ name: 'Character Name', value: `${userStorage.characterName}` , inline: true },
				{ name: 'Sex', value: `${userStorage.sex}`, inline: true },
				)
				if (userStorage.supporter === 1) {
					statsEmbed.addFields({ name: 'Supporter', value: `❤️`, inline: true })
				}
			statsEmbed.addFields(
				{ name: 'Level', value: `${userStorage.level}`},
				{ name: 'Class', value: `${userStorage.class}`},
				{ name: 'Penya', value: `${userStorage.penya}`},
				{ name: 'HP', value: `${userStorage.hp}`, inline: true },
				{ name: 'MP', value: `${userStorage.mp}`, inline: true },
				{ name: 'FP', value: `${userStorage.fp}`, inline: true },
				{ name: 'ATK', value: `${userStorage.physicalATK}`, inline: true },
				{ name: 'Magic Attack', value: `${userStorage.magicATK}`, inline: true },
				{ name: 'DEF', value: `${userStorage.def}`, inline: true },
				
				)
			.addFields(
				{ name: 'STR', value: `${userStorage.str}`, inline: true },
				{ name: 'STA', value: `${userStorage.sta}`, inline: true },
				{ name: 'DEX', value: `${userStorage.dex}`, inline: true },
				{ name: 'INT', value: `${userStorage.int}`, inline: true },
				{ name: 'Attack Speed', value: `${userStorage.atkSpeed} %`},
			)
			.addFields(
				{ name: 'Available Stat Points', value: `${userStorage.availableStatPoints}`},
			)
			.setTimestamp()
			.setFooter({
				text: `${interaction.user.tag}`,
				iconURL: interaction.user.avatarURL()
			});

			interaction.reply({ embeds: [statsEmbed]});
		}
	}
};