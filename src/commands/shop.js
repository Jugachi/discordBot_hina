const fs = require('fs');
const path = require('path');
const { ActionRowBuilder, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('You can buy various items in this shop'),

  async execute(interaction) {
    const storagePath = `${__dirname}/../data/playerdata`;
    const userStorage = require(`${storagePath}/${interaction.user.id}.json`);
    // Read the items file
    const itemsFile = fs.readFileSync(`${__dirname}/../data/shop.json`);
    const items = JSON.parse(itemsFile);

    // Create an embed for the items list
    const embed = new EmbedBuilder()
      .setTitle('Shop')
      .setDescription(`Here is a list of all the items available for purchase:\nYou have ${userStorage.penya} penya`)
      .setColor('#00FF00');

      const row = new ActionRowBuilder();
      for (const [itemName, itemData] of Object.entries(items)) {
        const itemName2 = itemData.name;
		    const itemDescription = itemData.description;
    	  const itemCategory = itemData.category;
    	  const itemPrice = itemData.price;

        embed.addFields({ name: itemName2, value: `Description: ${itemDescription}\nPrice: ${itemPrice}`});
        
        const buyButton = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setLabel(`Buy ${itemName2}`)
          .setCustomId(`buy_${itemName}`);
  
          row.addComponents(buyButton)
      }

    const message = await interaction.reply( {
      embeds: [embed],
      components: [row],
      fetchReply: true
    });
    setTimeout(() => {
      interaction.deleteReply();
    }, 30000);

    const filter = (interaction) => interaction.isButton() && interaction.message.id === message.id;
    const collector = message.createMessageComponentCollector( { filter, time: 10000 } );

    collector.on('collect', async (interaction) => {
      const itemName = interaction.customId.split('_')[1];
      const itemData = items[itemName];
      const itemName2 = itemData.name;
      const itemPrice = itemData.price;

      const playerDataPath = path.join(__dirname, '..', 'data', 'playerdata');
			fs.readdirSync(playerDataPath)
			.filter(file => file.endsWith('.json'))
			.forEach(file => delete require.cache[require.resolve(path.join(playerDataPath, file))]);

      const userStorage = require(`${storagePath}/${interaction.user.id}.json`);


      if (userStorage.penya < itemData.price) {
        await interaction.reply({
          content: `You don't have enough penya to buy ${itemName2}.`,
          ephemeral: true
        });
      } else {
        userStorage.penya -= itemData.price;

        userStorage.inventory.push(itemData);

        fs.writeFileSync(`${storagePath}/${interaction.user.id}.json`, JSON.stringify(userStorage));

        await interaction.reply({
          content: `You have successfully bought ${itemName2} for ${itemPrice}!`,
          ephemeral: true
        });
      }
    });
  }
};
