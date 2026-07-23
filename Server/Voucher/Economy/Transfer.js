const { 
    Client, 
    Message, 
    EmbedBuilder // V14: MessageEmbed yerine
} = require("discord.js");

const { genEmbed } = require("../../../../Global/İnit/Embed");
const Coins = require('../../../../Global/Databases/Client.Users');

// NOT: sistem, ayarlar, cevaplar, emojiler gibi global değişkenlerin tanımlı olduğu varsayılmıştır.

module.exports = {
    Isim: "transfer",
    Komut: ["coingönder","cointransfer"],
    Kullanim: "transfer <Altın/Para> <@andale/ID> <Miktar>",
    Aciklama: "Belirtilen üyeye ekonomi birimi transferi yapar.",
    Kategori: "eco",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) {

  },

    /**
    * @param {Client} client
    * @param {Message} message
    * @param {Array<String|Number>} args
    * @returns {Promise<void>}
    */

    onRequest: async function (client, message, args) {
        let embed = new genEmbed()
        let uye = message.guild.members.cache.get(message.member.id);
        let Coin = 0

        // Yardımcı fonksiyon: Hata/Bilgi mesajlarını V14 formatında gönderir ve siler.
        const sendErrorReply = (content) => {
            return message.reply({ content: content }).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                setTimeout(() => {
                    x.delete().catch(err => {})
                }, 7500);
            });
        };
        
        // 1. Birim Belirtilmemiş
        if(!args[0]) {
            return sendErrorReply(`${cevaplar.prefix} Lütfen hangi birimden göndereceğini belirt. (Örn: \`${sistem.botSettings.Prefixs[0]}transfer <Altın/Para> <@andale/ID> <Miktar>\` )`);
        }

        // --- PARA TRANSFERİ (Tipi 1) ---
        if(args[0].toLowerCase() === "para") {
            Coin = await client.Economy.viewBalance(uye.id, 1)
            let Gönderilen = message.mentions.members.first() || message.guild.members.cache.get(args[1])
            
            if(!Gönderilen) return sendErrorReply(`${cevaplar.prefix} Göndermek istediğiniz bir üyeyi belirtin.`);
            
            let Miktar = Number(args[2]);
            if(isNaN(Miktar)) return sendErrorReply(`${cevaplar.prefix} Göndermek istediğiniz miktarı rakam olarak girin.`);
            
            Miktar = Miktar.toFixed(0);
            
            if(Miktar <= 0) return sendErrorReply(`${cevaplar.prefix} Gönderilen rakam birden küçük veya sıfır olamaz.`);
            
            if(Coin < Miktar) return sendErrorReply(`${cevaplar.prefix} Yeteri kadar ${ayarlar.serverName} Paranız bulunmuyor.`);
            
            // İşlemler
            await client.Economy.updateBalance(uye.id, Miktar, "remove", 1)
            await client.Economy.updateBalance(Gönderilen.id, Miktar, "add", 1)
            
            await Coins.updateOne({_id: uye.id}, { $push: { "Transfers": { Uye: Gönderilen.id, Tutar: Miktar, Tarih: Date.now(), Islem: "Gönderilen Para" } }}, {upsert: true}).catch(err => {});
            await Coins.updateOne({_id: Gönderilen.id}, { $push: { "Transfers": { Uye: uye.id, Tutar: Miktar, Tarih: Date.now(), Islem: "Gelen Para" } }}, {upsert: true}).catch(err => {});
            
            // Başarılı Yanıtlar
            await message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
            await message.channel.send({
                embeds: [embed.setDescription(`${message.guild.emojiGöster(emojiler.Onay)} ${Gönderilen} üyesine başarıyla \`${Miktar.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}\` ${ayarlar.serverName} Parası gönderdin.`)]
            }).catch(err => {});
            return;
        } 
        // --- ALTIN TRANSFERİ (Tipi 0) ---
        else if(args[0].toLowerCase() === "altın") {
            Coin = await client.Economy.viewBalance(uye.id, 0)
            let Gönderilen = message.mentions.members.first() || message.guild.members.cache.get(args[1])
            
            if(!Gönderilen) return sendErrorReply(`${cevaplar.prefix} Göndermek istediğiniz bir üyeyi belirtin.`);
            
            let Miktar = Number(args[2]);
            if(isNaN(Miktar)) return sendErrorReply(`${cevaplar.prefix} Göndermek istediğiniz miktarı rakam olarak girin.`);
            
            Miktar = Miktar.toFixed(0);
            
            if(Miktar <= 0) return sendErrorReply(`${cevaplar.prefix} Gönderilen rakam birden küçük veya sıfır olamaz.`);
            
            if(Coin < Miktar) return sendErrorReply(`${cevaplar.prefix} Yeteri kadar Altınınız bulunmuyor.`);
            
            // İşlemler
            await client.Economy.updateBalance(uye.id, Miktar, "remove", 0)
            await client.Economy.updateBalance(Gönderilen.id, Miktar, "add", 0)
            
            await Coins.updateOne({_id: uye.id}, { $push: { "Transfers": { Uye: Gönderilen.id, Tutar: Miktar, Tarih: Date.now(), Islem: "Gönderilen Altın" } }}, {upsert: true}).catch(err => {});
            await Coins.updateOne({_id: Gönderilen.id}, { $push: { "Transfers": { Uye: uye.id, Tutar: Miktar, Tarih: Date.now(), Islem: "Gelen Altın" } }}, {upsert: true}).catch(err => {});
            
            // Başarılı Yanıtlar
            await message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
            await message.channel.send({
                embeds: [embed.setDescription(`${message.guild.emojiGöster(emojiler.Onay)} ${Gönderilen} üyesine başarıyla \`${Miktar}\` ${message.guild.emojiGöster(emojiler.Görev.Altın)} gönderdin.`)]
            }).catch(err => {});
            return;
        }
        
        // 3. Yanlış Birim Belirtilmiş (Altın/Para dışında)
        return sendErrorReply(`${cevaplar.prefix} Lütfen hangi birimden göndereceğini belirt. (Örn: \`${sistem.botSettings.Prefixs[0]}transfer <Altın/Para> <@andale/ID> <Miktar>\` )`);
    }
};