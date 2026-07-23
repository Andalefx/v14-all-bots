const { ANDALE } = require('../../Global/Clients/Guard.Clients');
const { loadMongo} = require('../../Global/Handlers/mongoHandler');
const client = global.client = new ANDALE();
const { GUILD } = require('../../Global/İnit/Settings');
const { Collection } = require('discord.js');
const ayargetir = require("../../Global/Settings/_system.json")
const botFolder = "Guard_II"; 
client.botName = botFolder;

loadMongo(client);
GUILD.fetch(sistem.SERVER.ID)
client.fetchCommands(false)
client.fetchEvents()
client.connect(ayargetir.TOKENS.SECURITY.SEC_TWO)