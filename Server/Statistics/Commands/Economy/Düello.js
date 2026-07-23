const { Client, Message } = require("discord.js"); // V14 uyumlu import
const util = require("util")
// Varsayım: Game modülü Discord.js V14 etkileşimlerini (butonları) destekliyor.
const Game = require('../../../../Global/Plugins/Fight') 

module.exports = {
    Isim: "düello",
    Komut: ["vs","duello","kapış"],
    Kullanim: "düello <@andale/ID> <Miktar>", // Kullanim güncellendi
    Aciklama: "Belirtilen üye ile bahisli düello kapışması başlatırsınız.", // Açıklama düzeltildi
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
    * @param {Array<String>} args 
    */

    onRequest: async function (client, message, args) {
        
        // Kanal Kontrolü
        if(!kanallar.coinChat.some(x => message.channel.id == x) && !ayarlar.staff.includes(message.member.id)) return message.reply({content: `${cevaplar.prefix} Sadece ${kanallar.coinChat.map(x => message.guild.channels.cache.get(x)).join(",")} kanallarında oynayabilirsin.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        })
        
        let uye = message.guild.members.cache.get(args[0]) || message.mentions.members.first()
        
        // Üye Kontrolleri
        if (!uye) return message.reply({content: `${cevaplar.prefix} Savaşmak istediğiniz bir üyeyi belirtin!`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 7500);
        });
        
        if (uye.id === message.author.id) return message.reply({content: `${cevaplar.prefix} Kendi pipinle oynayamazsın :)`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 7500);
        });
        
        // Miktar Kontrolleri
        if (!args[1]) return message.reply({content: `${cevaplar.prefix} Lütfen bir miktar belirtin aksi taktirde oyuna başlayamazsınız.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 7500);
        });
        
        // Orijinal kodda "returnmessage.reply" şeklinde bir yazım hatası vardı, düzeltildi.
        if (args[1] <= 0) return message.reply({content: `${cevaplar.prefix} Girdiğiniz miktar lütfen sıfırdan büyük olmalıdır.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 7500);
        });
        
        let data_1 = await client.Economy.viewBalance(message.member.id, 1)
        let data_2 = await client.Economy.viewBalance(uye.id, 1)
        let Miktar = Number(args[1]);

        if (data_1 >= Miktar && data_2 >= Miktar) { 
            // Bahis miktarları her iki oyuncuda da yeterli ise oyunu başlat
            
            // Oyun başlatılmadan önce bahis düşülmez, Game modülünün kendisi bunu halletmeli.
            // Aksi taktirde kabul edilmezse haksız yere para düşülmüş olur.
            // Bu nedenle, external Game modülünün düelloyu kabul ettikten sonra parayı düşürdüğü varsayılmıştır.

            await Game({
                message: message,
                opponent: uye,
                ödül: Miktar * 2,
                bahis: Miktar,
                parabirim: ayarlar.serverName,
                embed: {
                    title: 'acar',
                    color: 'YELLOW',
                    footer: 'acar',
                    timestamp: false
                },
                buttons: {
                    hit: 'Saldırı',
                    heal: 'Savun & İyileş',
                    cancel: 'Savaştan Çekil',
                    accept: 'Kabul Et',
                    deny: 'Kabul Etme'
                },
                // Message içeriği Miktar değişkeni kullanılarak daha okunaklı hale getirildi
                acceptMessage: `<@${uye.id}> Merhaba Savaşçı!\n\n<@${message.author.id}> isimli üye seni \`${Miktar.toLocaleString()} ${ayarlar.serverName} Parası\` değerinde düello kapışması isteği gönderdi, kabul etmek istiyorsan **hemen tıkla**!`,
                winMessage: `Savaş sona erdi, savaşın kazananı <@{{winner}}> oldu!\nSavaştan tam tamına "${(Miktar * 2).toLocaleString()} ${ayarlar.serverName}" Parası değerinde ganimet kazandı!`,
                endMessage: '<@{{opponent}}> zamanında cevap vermedi. Oyun bitirildi!',
                cancelMessage: '<@{{opponent}}> savaş iptal edildi!',
                fightMessage: '{{player}} üyesi başlayacak!',
                opponentsTurnMessage: 'Düşmanının hamlesini beklemelisin!',
                highHealthMessage: 'Savun ve iyileşmek için çok erken!',
                lowHealthMessage: 'Artık savaştan kaçmak için çok geç!',
                returnWinner: false,
                othersMessage: 'Sadece {{author}} üye(ler) kullanabilir!'
            });
        } else return message.reply({content: `${cevaplar.prefix} Belirtiğiniz üyenin veya sizin belirttiğiniz miktarda parası bulunamadı. (Sizin mevcut: ${data_1.toLocaleString()} ${ayarlar.serverName} Parası, ${uye.displayName}'ın mevcut: ${data_2.toLocaleString()} ${ayarlar.serverName} Parası)`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 7500);
        });
    }
};