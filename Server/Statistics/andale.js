const path = require('path'); // path modülünü require etmeyi unutmayın.
const { ANDALE } = require('../../Global/Clients/Global.Client');
const { loadMongo} = require('../../Global/Handlers/mongoHandler');
const client = global.client = new ANDALE();
const { GUILD } = require('../../Global/İnit/Settings');
const { Collection } = require('discord.js');
const ayargetir = require("../../Global/Settings/_system.json")
client.invites = new Collection()
client.botName = "Statistics"


loadMongo(client);
GUILD.fetch(sistem.SERVER.ID)
client.fetchCommands(true, true)
client.fetchEvents()
client.connect(ayargetir.TOKENS.Statistics)


// Haftalık Stat Temizleme

const StatsSchema = require('../../Global/Databases/Client.Users.Stats');

var CronJob = require('cron').CronJob
let HaftalıkVeriler = new CronJob('00 00 00 * * 1', async function() { 
   let guild = client.guilds.cache.get(sistem.SERVER.ID);
   let safeMap = new Map()
   await StatsSchema.updateMany({ guildID: guild.id }, { voiceStats: safeMap, chatStats: safeMap, totalVoiceStats: 0, totalChatStats: 0 }, {multi: true});
   let stats = await StatsSchema.find({ guildID: guild.id });
   stats.filter(s => !guild.members.cache.has(s.userID)).forEach(async (s) =>  await StatsSchema.findByIdAndDelete(s._id));
   client.logger.log("Haftasonu otomatik istatistik veri temizliği!","stat")
   await StatsSchema.updateMany({ guildID: guild.id }, { voiceStats: safeMap, chatStats: safeMap, totalVoiceStats: 0, totalChatStats: 0 }, {multi: true});
}, null, true, 'Europe/Istanbul');

HaftalıkVeriler.start();

// Haftalık Stat Temizleme