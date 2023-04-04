const fs = require('fs');
const path = require('path');
const { ActionRowBuilder, SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('You can buy various items in this shop'),

  async execute(interaction) {
    const storagePath = `${process.cwd()}/data/playerdata`;
    const userStorage = require(`${storagePath}/${interaction.user.id}.json`);
    // Read the items file
    const itemsFile = fs.readFileSync(`${process.cwd()}/data/shop.json`);
    const items = JSON.parse(itemsFile);

    // Create an embed for the items list
    const embed = new EmbedBuilder()
      .setTitle('Shop')
      .setDescription(`Here is a list of all the items available for purchase:\nYou have ${userStorage.penya} penya`)
      .setColor('#00FF00');

      const closeButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setLabel('Close Shop')
        .setCustomId('close')
      
      const closeButtonRow = new ActionRowBuilder().addComponents(closeButton);

      const row = new ActionRowBuilder();
      for (const [itemName, itemData] of Object.entries(items)) {
        const itemName2 = itemData.name;
        const itemDescription = itemData.description;
        const itemCategory = itemData.category;
        const itemPrice = itemData.price;
        const itemAmount = itemData.amount;
        const itemMaxAmount = itemData.maxAmount;

          if (itemAmount === 1) {
            embed.addFields({ name: itemName2, value: `Description: ${itemDescription}\nPrice: ${itemPrice}`})
          } else {
            embed.addFields(
              { name: `${itemAmount}x ${itemName2}`, value: `Description: ${itemDescription}\nPrice: ${itemPrice}`})
          }
        
        const buyButton = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setLabel(`Buy ${itemName2}`)
          .setCustomId(`buy_${itemName}`);
  
          row.addComponents(buyButton)
      }

      // Prevents the bot from crashing, after closing the shop, because the message got already deleted
      let deletedMsg = 0;

    const message = await interaction.reply( {
      embeds: [embed],
      components: [row, closeButtonRow],
      fetchReply: true
    });
    setTimeout(() => {
      if (deletedMsg > 0) {
        let deletedMsg = 0;
        return;
      } else {
        interaction.deleteReply();
      }
    }, 30000);

    const filter = (interaction) => interaction.isButton() && interaction.message.id === message.id;
    const collector = message.createMessageComponentCollector( { filter, time: 10000 } );

    collector.on('collect', async (interaction) => {
      const itemName = interaction.customId.split('_')[1];
      
      if (interaction.customId.split('close')) {
        await interaction.reply({
          content: 'Closing the shop...',
          ephemeral: true,
        });
        deletedMsg++;
        await message.delete();
        return;
      }

      const itemData = items[itemName];
      const itemName2 = itemData.name;
      const itemPrice = itemData.price;
      const itemAmount = itemData.amount;
      const itemMaxAmount = itemData.maxAmount

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

        let existingItem = userStorage.inventory.find(item => item.name === itemName2);
        if (existingItem) {
          if (existingItem.amount >= itemMaxAmount) {
            await interaction.reply({
              content: `You cannot add more ${existingItem.name}. You already have the maximum amount of ${itemMaxAmount}!`,
              ephemeral: true
            });
          } else {
            existingItem.amount += itemAmount;
            await interaction.reply({
              content: `Added ${itemAmount}x ${existingItem.name}. You now have ${existingItem.amount} ${existingItem.name}`,
              ephemeral: true
            });
          }
        } else {
          const newItem = {
            ...itemData,
            name: itemName2,
            amount: itemAmount,
          };
          if (itemData.damage) {
            newItem.damage = itemData.damage
          }
          if (itemData.healing) {
            newItem.healing = itemData.healing
        }
        userStorage.inventory.push(newItem);
        await interaction.reply({
          content: `Added ${itemAmount} ${newItem.name}. You now have ${newItem.amount} ${newItem.name}.`,
          ephemeral: true,
          });
          }
        }
        fs.writeFileSync(`${storagePath}/${interaction.user.id}.json`, JSON.stringify(userStorage));
    });
  }
};
