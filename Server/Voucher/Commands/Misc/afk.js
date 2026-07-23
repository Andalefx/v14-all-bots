const { Client, Message, EmbedBuilder, MessageActionRow, ButtonBuilder, ButtonStyle, Events } = require("discord.js");
const Afks = require('../../../../Global/Databases/Users.Afks');
 const emojiler = global.emojiler || require("../../../../Global/Settings/Emoji.json"); 


module.exports = {
    Isim: "afk",
    Komut: ["afk"],
    Kullanim: "afk <Sebep>",
    Aciklama: "Klavyeden uzak iseniz gitmeden önce bu komutu girdiğinizde sizi etiketleyenlere sizin klavye başında olmadığınızı açıklar.",
    Kategori: "diğer",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) {
        // v14: client.on("messageCreate") dinleyicisi korunur.
        client.on(Events.MessageCreate, async (message) => {
            if(!message.guild || message.author.bot || !message.channel || message.channel.partial || message.channel.type === 1) return; // DM kontrolü eklendi.

            let GetAfk = await Afks.findById(message.member.id);

            // 1. AFK ETİKETLEME KONTROLÜ
            if(message.mentions.users.size >= 1){
                let victim = message.mentions.users.first();
                // Buton etkileşimlerinde sorun yaşamamak için "partial" kontrolü yapıldı, ancak burada gerek yok.
                let victimData = await Afks.findById(victim.id);
                
                // Etiketlenen kişi AFK ise
                if(victimData) {
                    // Tarih formatlama v14 uyumlu: Date.parse() kullanıldı ve saniye cinsine çevrildi.
                    let tarih = `<t:${String(Date.parse(victimData.sure)).slice(0, 10)}:R>`;
                    
                    // Etiketleyen de AFK ise, etiketleyenin AFK durumunu kaldır
                    if(GetAfk) {
                        await Afks.findByIdAndDelete(message.member.id)
                        // Emojiler değişkeninin erişilebilir olduğu varsayılmıştır.
                        message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(e => {}) 
                    }

                    // Yanıt gönderimi: MessageEmbed yerine EmbedBuilder kullanıldı.
                    return message.reply({embeds: [
                        new EmbedBuilder()
                            .setColor("Aqua") // CYANTan AQUA'ya çevrildi (Daha standart v14 kullanımı)
                            .setAuthor({name: victim.tag, iconURL: victim.displayAvatarURL()})
                            .setDescription(`${victim} kullanıcısı \`${victimData.sebep ? `${victimData.sebep}\` sebebiyle ` : ""}${tarih} **AFK** moduna geçti!`)
                    ]}).then(x => {
                        setTimeout(() => {
                            x.delete().catch(e => {}) // Hata yakalama eklendi
                        }, 7500);
                    })
                };
            };
            
            // 2. KENDİ AFK DURUMUNU KALDIRMA
            if(!GetAfk) return;
            
            // Eğer AFK durumdaysa ve konuşursa AFK'dan çıkar
            await Afks.findByIdAndDelete(message.member.id)
            
            // Yanıt gönderimi
            message.reply({content: `Merhaba **${message.author.tag}** Tekrardan Hoş Geldin. (AFK durumunuz kaldırıldı)`}).then(x => {
                setTimeout(() => {
                    x.delete().catch(e => {}) // Hata yakalama eklendi
                }, 7500);
            })
        });
    },

    /**
    * @param {Client} client
    * @param {Message} message
    * @param {Array<String|Number>} args
    * @returns {Promise<void>}
    */

   onRequest: async function (client, message, args) {
        // v14: message.member her zaman kullanılabilir
        let GetAfk = await Afks.findById(message.member.id);
        
        // Zaten AFK ise
        if(GetAfk) return message.reply({
            content: `${message.guild.emojiGöster(emojiler.Iptal)} AFK durumdayken tekrardan AFK olamazsın ${message.member}!`
        }).then(x => {
            setTimeout(() => {
                x.delete().catch(e => {})
            }, 5000);
        })
        
        // AFK'ya girme işlemi
        let sebep = args.join(' ') || `Şuan da işim var yakın zaman da döneceğim!`;
        await Afks.updateOne({_id: message.member.id}, { $set: { "sure": new Date(), "sebep": sebep } }, {upsert: true})
        
        // Onay reaksiyonu
        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(e => {})
        
        // Kullanıcıya bilgi mesajı
        message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(`${message.member} başarıyla **AFK** moduna geçtin. Seni etiketleyenlere \`${sebep}\` sebebiyle AFK olduğunu bildireceğim.`)
            ]
        }).then(x => {
            setTimeout(() => {
                x.delete().catch(e => {})
            }, 7500);
        })
    }
};