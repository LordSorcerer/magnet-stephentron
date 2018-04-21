// Import modules
const Discord = require('discord.js');
const botToken = require('./bot-token.json').token;
// Create an instance of a Discord discordClient
const discordClient = new Discord.Client();

// Log our bot in
discordClient.login(botToken);

discordClient.on('ready', () => {
  console.log('Magnet Stephentron: Ready\n');
});