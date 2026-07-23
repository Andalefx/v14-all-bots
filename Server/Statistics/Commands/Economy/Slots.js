const { 
    Client, 
    Message, 
    EmbedBuilder // MessageEmbed yerine
} = require("discord.js");
const moment = require("moment");
const { genEmbed } = require("../../../../Global/İnit/Embed");
require("moment-duration-format");
require("moment-timezone");
const Beklet = new Set(); // Cooldown için Set kullanımı V14'te aynı

module.exports = {
    Isim: "slots",
    Komut: ["slot", "s"],
    Kullanim: "slots <100-500000-all>",
    Aciklama: "Belirlenen miktar ile slot makinesinde şansınızı denersiniz. (4x ödül)",
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
        
        // Kanal Kontrolü
        if(!kanallar.coinChat.some(x => message.channel.id == x) && !ayarlar.staff.includes(message.member.id)) return message.reply({content: `${cevaplar.prefix} Sadece ${kanallar.coinChat.map(x => message.guild.channels.cache.get(x)).join(",")} kanallarında oynayabilirsin.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        });

        // Flood Kontrolü
        if(Beklet.has(message.author.id)) return message.reply({content: `${cevaplar.prefix} \`Flood!\` Lütfen bir kaç saniye sonra tekrar oynamayı deneyin.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        });
        
        let uye = message.guild.members.cache.get(message.member.id);
        let Coin = await client.Economy.viewBalance(uye.id, 1)
        let Miktar = Number(args[0]);
        
        // Miktar Kontrolleri
        if(args[0] == "all") {
            if(Coin >= 500000) Miktar = 500000
            if(Coin < 500000) Miktar = Coin
            if(Coin <= 0) Miktar = 10
        }
        
        Miktar = Miktar.toFixed(0);
        
        if(isNaN(Miktar)) return message.reply({content: `${cevaplar.prefix} Miktar yerine harf kullanmamayı tavsiye ederim.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        })

        if(Miktar <= 0) return message.reply({content: `${cevaplar.prefix} Göndermek istediğiniz miktar, birden küçük olamaz.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        })

        // Not: Maksimum bahis miktarı 500.000 olarak düzeltildi.
        if(Miktar > 500000) return message.reply({content: `${cevaplar.prefix} Bahise en fazla \`500.000\` ${ayarlar.serverName} Parası ile girilebilir.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        })

        if(Miktar < 10) return message.reply({content: `${cevaplar.prefix} Bahise en az \`10\` ${ayarlar.serverName} Parası ile girebilirsiniz.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        })

        if(Coin < Miktar) return message.reply({content: `${cevaplar.prefix} Belirtiğiniz miktar kadar yeterince ${ayarlar.serverName} Parası olmadığından dolayı bahse giremezsiniz. (Mevcut: ${Coin.toLocaleString()})`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        })

        // Slot Emolojileri (acar -> andale güncellendi)
        let KıbrısANDALE = [
            message.guild.emojiGöster("andale_pat"), // pat
            message.guild.emojiGöster("andale_heart"), // heart
            message.guild.emojiGöster("andale_vis") // vis
        ];
        
        var SlotOne = KıbrısANDALE[Math.floor(Math.random() * 3)]
        var SlotTwo = KıbrısANDALE[Math.floor(Math.random() * 3)]
        var SlotThree = KıbrısANDALE[Math.floor(Math.random() * 3)]

        // Bahisi düş ve cooldown ekle
        await client.Economy.updateBalance(uye.id, Number(Miktar), "remove", 1)
        Beklet.add(message.author.id);
        
        let cc = Miktar * 4;
        
        // İlk mesaj
        message.reply({content: `
\`___SLOTS___\`
 ${message.guild.emojiGöster("andale_slot") || '🎰'} ${message.guild.emojiGöster("andale_slot") || '🎰'} ${message.guild.emojiGöster("andale_slot") || '🎰'}
\`|         |\`
\`|         |\`
Belirlenen Miktar: \` ${Miktar.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} ${ayarlar.serverName} Parası \`
Kazanılacak Miktar: \` ${cc.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} ${ayarlar.serverName} Parası \``
        }).then(msg => {
            
            if (SlotOne === SlotTwo && SlotOne === SlotThree) {
                // KAZANMA DURUMU
                setTimeout(async () => {
                    let coin = Number(Miktar) * 4; // Toplam ödül (Bahis + 3x Kar)
                    await client.Economy.updateBalance(uye.id, Number(coin), "add", 1)
                    
                    msg.edit({content: `\`___SLOTS___\`
 ${SlotOne} ${SlotTwo} ${SlotThree}
\`|         |\`
\`|         |\`
:tada: **Tebrikler!** Bu oyunu kazandınız! 
Kazanılan Ödül: \` ${Miktar.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} ${ayarlar.serverName} Parası => [ 4x ] => +${coin.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} ${ayarlar.serverName} Parası \``}).catch(err => {});   
                    
                    Beklet.delete(message.author.id);
                    message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {})
                }, 2500);
            } else {
                // KAYBETME DURUMU
                setTimeout(async () => {
                    
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
                    
                    msg.edit({content: `\`___SLOTS___\`
 ${SlotOne} ${SlotTwo} ${SlotThree}
**\`|         |\`**
**\`|         |\`**
${message.guild.emojiGöster(emojiler.Iptal) || '❌'} **Kaybettin!** Bu oyunu kazanamadın!
Kaybedilen Miktar: \` -${Miktar.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} ${ayarlar.serverName} Parası \``}).catch(err => {});
                    
                    Beklet.delete(message.author.id);
                }, 2500);
            }
        });
    }
};