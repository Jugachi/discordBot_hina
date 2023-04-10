const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription('Sets the channel where the bot posts messages')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => 
			option
				.setName('channel')
				.setDescription('The channel where the bot should post messages')
				.setRequired(true)),

    async execute(interaction) {
        try {
			// Retrieve the guild configuration from the JSON file
            const guildId = interaction.guildId;
            const configPath = path.join(__dirname, '../data/guilds.json');
            const configData = await fs.promises.readFile(configPath, 'utf8');
            const guilds = JSON.parse(configData);
            const guildConfig = guilds[guildId] || {};
			
            // Update the guild configuration with the new channel ID
            const newChannelId = interaction.options.getChannel('channel').id;
            guildConfig.channelId = newChannelId;
			guildConfig.messageCount = 0;
            guilds[guildId] = guildConfig;

            // Write the updated configuration to the JSON file
            await fs.promises.writeFile(configPath, JSON.stringify(guilds, null, 2));

            // Send a success message in the interaction channel
            const successEmbed = new EmbedBuilder()
                .setColor(0xfffff)
                .setTitle('Channel set!')
                .setDescription(`The bot will now post messages in <#${newChannelId}>.`);
            interaction.reply({ embeds: [successEmbed] });
        } catch (error) {
            console.error(error);
            interaction.reply({
                content: 'An error occurred while setting the channel',
                ephemeral: true,
            });
        }
    },
};
