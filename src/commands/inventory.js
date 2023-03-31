const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

			  const pageArray = [];

    		// Iterate through the items and add them as fields in the embed
    		for (const [itemName, itemData] of Object.entries(userStorage.inventory)) {
				const itemName = itemData.name;
				const itemDescription = itemData.description;
				const itemCategory = itemData.category;
				const itemDamage = itemData.damage || itemData.healing;

				switch(itemCategory) {
					case 'weapon':
						pageArray.push({
							name: itemName, value: `Description: ${itemDescription}\nDamage: ${itemDamage}`
						})
						//embed.addFields({ name: itemName, value: `Description: ${itemDescription}\nDamage: ${itemDamage}`});
						break;
					case 'healing':
						pageArray.push({
							name: itemName, value: `Description: ${itemDescription}\nHealing: ${itemDamage}`
						})
						//embed.addFields({ name: itemName, value: `Description: ${itemDescription}\nHealing: ${itemDamage}`});
						break;
					default:
						pageArray.push({
							name: itemName, value: `Description: ${itemDescription}`
						})
						//embed.addFields({ name: itemName, value: `Description: ${itemDescription}`});
						break;
				}
    		}

			embed.addFields(...pageArray.slice(0, 5));

			const menuRow = new ActionRowBuilder()
			const nextPageButton = new ButtonBuilder()
				.setStyle(ButtonStyle.Primary)
				.setLabel('Next Page')
				.setCustomId('nextPage');

			const previousPageButton = new ButtonBuilder()
				.setStyle(ButtonStyle.Secondary)
				.setLabel('Previous Page')
				.setCustomId('previousPage')
				.setDisabled(true);

			const closePageButton = new ButtonBuilder()
				.setStyle(ButtonStyle.Danger)
				.setLabel('Close Inventory')
				.setCustomId('closePage');
			
			menuRow.addComponents(nextPageButton, previousPageButton, closePageButton);
		
    		// Send the embed as a message
    		const message = await interaction.reply({ embeds: [embed], components: [menuRow], ephemeral: true });

			const filter = (button) => button.user.id === interaction.user.id;
   			const collector = message.createMessageComponentCollector( { filter, time: 15000 } );
			
			let page = 0;
			collector.on('collect', async (buttonInteraction) => {
				if (pageArray.length > 0) {
					
					let fields = pageArray.slice(page * 5, (page + 1) * 5);
					let isNextDisabled = pageArray.length <= 5;
					let isPrevDisabled = true;

					const updateButtons = async () => {
						nextPageButton.setDisabled(isNextDisabled);
						previousPageButton.setDisabled(isPrevDisabled);
						await buttonInteraction.reply ( { embeds: [embed], components: [menuRow], ephemeral: true })
					};

					const updateFields = async () => {
						const start = page * 5;
						const end = start + 5;
						const fields = pageArray.slice(start, end);
						embed.spliceFields(0, fields.length);
						embed.addFields(fields);
						await updateButtons();
					}

					switch (buttonInteraction.customId) {
						case 'nextPage':
							page++;
							isNextDisabled = (page + 1) * 5 >= pageArray.length;
							isPrevDisabled = false;
							await updateFields(page);
							break;
						case 'previousPage':
							page--;
							isNextDisabled = (page +1 ) * 5 >= pageArray.length;
							isPrevDisabled = page === 0;
							await updateFields(page);
							break;
						default:
							collector.stop();
							await message.delete();
							break;

					}
				}
			});
  }
}
}
