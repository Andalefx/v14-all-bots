const path = require('path'); // path modülünü require etmeyi unutmayın.
const { ANDALE } = require('../../Global/Clients/Global.Client');
const { loadMongo} = require('../../Global/Handlers/mongoHandler');
const client = global.client = new ANDALE();
const { GUILD } = require('../../Global/İnit/Settings');
const ayargetir = require("../../Global/Settings/_system.json")

const botFolder = "Voucher"; 
client.botName = botFolder;


loadMongo(client);
GUILD.fetch(sistem.SERVER.ID, client)
client.fetchCommands(true, true)
client.fetchEvents()
client.connect(ayargetir.TOKENS.Voucher)
