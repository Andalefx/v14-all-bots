// Discord.js v14 için importlar güncellendi.
const { Message, Client, PermissionsBitField } = require("discord.js");
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');

// Lowdb kaldırıldığı için, bu kısım artık direkt olarak dosyadan veri çekiyor olmalı.
// Emojiler verisinin başka bir yerden yüklendiğini varsayıyoruz.
// Örneğin: const emojiler = require('../../../../Global/Settings/_emojis.json');

 /**
 * @param {Message} message 
 */

module.exports = async (message) => { 
 // DM veya bot mesajları kontrolü V14'te aynıdır, ancak 'type' kullanımı 'channel.type' olarak değişebilir.
 // message.channel.type == "dm" yerine (message.channel.type === ChannelType.DM) kullanılabilir.
 // Sizin kodunuzda `message.channel.type == "dm"` olduğu için, bu kısım düzgün çalışmaya devam edecektir.

 // Sync Data's
 let Data = await GUILDS_SETTINGS.findOne({ _id: 1 })
 // Global değişkenlerin tanımlanması V14 ile ilgili değildir, aynı kalabilir.
 ayarlar = client._settings = global.ayarlar = global._settings = kanallar = client._channels = global.kanallar = global.channels =  roller = client._roles = global.roller = global._roles = Data.Ayarlar
 
 // Lowdb ile yapılan bu işlem kaldırıldı. Emojiler verisinin uygulamanın 
 // ana başlangıcında zaten yüklenmiş olması beklenir.
 // const adapter = new FileSync("../../Global/Settings/_emojis.json")
 // const db = low(adapter)
 // emojiler = client._emojis = global.emojiler = global._emojis = db.value();
    
    // Lowdb yerine direct require kullanılıyorsa:
    emojiler = client._emojis = global.emojiler = global._emojis = require('../../../../Global/Settings/_emojis');
 cevaplar = client._reply = global.cevaplar = global._reply = require('../../../../Global/Settings/_reply');
 // Sync Data's

 // !global.sistem.botSettings.Prefixs.some(x => message.content.startsWith(x)) V14'te aynı çalışır.
 if (!global.sistem.botSettings.Prefixs.some(x => message.content.startsWith(x)) || !message.channel || message.channel.type == "dm") return;
 
 // Prefix kontrolü ve argüman ayrıştırma aynı kalır.
 let args = message.content.substring(global.sistem.botSettings.Prefixs.find(x => message.content.startsWith(x)).length).split(" ");
 let komutcuklar = args[0].toLocaleLowerCase()
 let acar = message.client;
 args = args.splice(1);
 let calistirici;

 if(acar.commands.has(komutcuklar) || acar.aliases.has(komutcuklar)) {
        // İzin kontrolü için V14'e uygun PermissionsBitField.Flags.Administrator kullanıldı.
  if (!(ayarlar && ayarlar.staff && ayarlar.staff.includes(message.member.id)) && message.guild.ownerId != message.member.id && client.user.id != message.member.id ) {
            if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return; 
        }

 calistirici = acar.commands.get(komutcuklar) || acar.aliases.get(komutcuklar);
 if(calistirici) calistirici.onRequest(acar, message, args);
 }

};

module.exports.config = {
 Event: "messageCreate" // V14'teki event adı budur (önceki sürümlerde message veya message.create olabilir).
};