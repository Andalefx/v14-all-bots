const path = require('path');
const { Collection } = require('discord.js'); // path modülünü require etmeyi unutmayın.
const { ANDALE } = require('../../Global/Clients/Global.Client');
const { loadMongo} = require('../../Global/Handlers/mongoHandler');
const client = global.client = new ANDALE();
const { GUILD } = require('../../Global/İnit/Settings');
const ayargetir = require("../../Global/Settings/_system.json")


const botFolder = "Controller"; 
client.botName = botFolder
client.invites = new Collection();



loadMongo(client);
GUILD.fetch(sistem.SERVER.ID, client)
client.fetchCommands(false)
client.fetchEvents()
client.connect(ayargetir.TOKENS.CONTROLLER)
