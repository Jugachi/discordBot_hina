const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Your inventory'),

  async execute(interaction) {
    const storagePath = `${__dirname}/../data/playerdata`;
			const userFiles = fs.readdirSync(storagePath).filter(file => file.endsWith('.json') && file.includes(interaction.user.id));
			if (userFiles.length === 0) {
				return interaction.reply( {content: `You must use the /create command before you can see the inventory of your char.`, ephemeral: true });
			} else {

			const playerDataPath = path.join(__dirname, '..', 'data', 'playerdata');
			fs.readdirSync(playerDataPath)
			.filter(file => file.endsWith('.json'))
			.forEach(file => delete require.cache[require.resolve(path.join(playerDataPath, file))]);

			const userStorage = require(`${storagePath}/${interaction.user.id}.json`);
    
			// Create an embed for the items list
    		const embed = new EmbedBuilder()
    		  .setTitle('Inventory')
    		  .setDescription('Here are all your items')
    		  .setColor('#00FF00')
			  .setThumbnail(`${interaction.user.avatarURL()}`);

    		// Iterate through the items and add them as fields in the embed
    		for (const [itemName, itemData] of Object.entries(userStorage.inventory)) {
				const itemName = itemData.name;
				const itemDescription = itemData.description;
				const itemCategory = itemData.category;
				const itemDamage = itemData.damage || itemData.healing;

				switch(itemCategory) {
					case 'weapon':
						embed.addFields({ name: itemName, value: `Description: ${itemDescription}\nDamage: ${itemDamage}`});
						break;
					case 'healing':
						embed.addFields({ name: itemName, value: `Description: ${itemDescription}\nHealing: ${itemDamage}`});
						break;
					default:
						embed.addFields({ name: itemName, value: `Description: ${itemDescription}`});
						break;
				}
    		}
		
    		// Send the embed as a message
    		await interaction.reply({ embeds: [embed], ephemeral: true });
  }		
}
};
