/*// Import modules
const Discord = require('discord.js');
const botToken = require('./bot-token.json').token;
// Create an instance of a Discord discordClient
const discordClient = new Discord.Client();*/

var express = require('express');
var app = express();
var server = require('http').Server(app);
var port = process.env.PORT || 3000;

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(port, function() {
    console.log("Server active!");
});

/*
discordClient.login(botToken);

discordClient.on('ready', () => {
  console.log('Magnet Stephentron: Ready\n');
});*/