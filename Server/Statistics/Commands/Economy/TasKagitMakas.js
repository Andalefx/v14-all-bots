const { Client, Message } = require("discord.js"); // V14 uyumlu import
const util = require("util")
// Varsayım: Game modülü Discord.js V14 etkileşimlerini (butonları) destekliyor.
const Game = require('../../../../Global/Plugins/Rps')

module.exports = {
    Isim: "taşkağıtmakas",
    Komut: ["taskağıtmakas","tkm"],
    Kullanim: "taşkağıtmakas <@andale/ID> <Miktar>", // Kullanim güncellendi
    Aciklama: "Belirtilen üye ile bahisli Taş-Kağıt-Makas oynarsınız.", // Açıklama düzeltildi
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
        
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        
        // Üye Kontrolleri
        if (!uye) return message.reply({content: `${cevaplar.prefix} Oynamak istediğiniz bir üyeyi belirtin!`}).then(x => {
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
        
        // Orijinal koddaki yazım hatası düzeltildi
        if (Number(args[1]) <= 0) return message.reply({content: `${cevaplar.prefix} Girdiğiniz miktar lütfen sıfırdan büyük olmalıdır.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 7500);
        });

        const Miktar = Number(args[1]);
        let data_1 = await client.Economy.viewBalance(message.member.id, 1)
        let data_2 = await client.Economy.viewBalance(uye.id, 1)

        if (data_1 >= Miktar && data_2 >= Miktar) {  
            await Game({
                message: message,
                opponent: uye,
                embed: {
                    title: 'andale', // Güncellendi
                    description: 'Aşağıda ki elementlerden birini seçin! Taş mı? Kağıt mı? Makas mı?',
                    color: '#5865F2',
                    footer: 'andale', // Güncellendi
                    timestamp: false
                },
                buttons: {
                    rock: 'Taş',
                    paper: 'Kağıt',
                    scissors: 'Makas',
                    accept: 'Kabul Et',
                    deny: 'Kabul Etme',
                },
                ödül: Miktar * 2,
                bahis: Miktar,
                parabirim: ayarlar.serverName,
                time: 60000,
                acceptMessage:
                    `<@${uye.id}> Merhaba!
<@${message.author.id}> isimli üye seni \`${Miktar.toLocaleString()} ${ayarlar.serverName} Parası\` değerinde Taş Kağıt ve Makas oyununa davet ediyor. Kabul etmek istiyorsan **hemen tıkla**!`,
                winMessage: `Oyun sona erdi, oyunun kazananı <@{{winner}}> oldu!\nOyundan tam tamına "${(Miktar * 2).toLocaleString()} ${ayarlar.serverName} Parası" değerinde ödül kazandı!`,
                drawMessage: `Berabere kalındı!
Berabere kalındığından dolayı ${message.member} ve ${uye} üyelerinin \`${Miktar.toLocaleString()} ${ayarlar.serverName} Parası\` her ikisinede tekrardan verildi.`,
                endMessage: "<@{{opponent}}> zamanında cevap vermedi. Oyun bitirildi ve paralar iade edildi!",
                timeEndMessage:
                    "Zamanında cevap verilmediği için, zaman aşımına uğradı!",
                cancelMessage:
                    '<@{{opponent}}> isimli üye seninle "Taş Kağıt ve Makas" oyununu oynamayı reddetti!',
                choseMessage: `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla elementiniz seçildi! (**Element**: {{emoji}})`,
                noChangeMessage: 'Seçiminizi değiştirmek için artık çok geç!',
                othersMessage: 'Sadece {{author}} üye(ler) kullanabilir!',
                returnWinner: false
            });
        } else return message.reply({content: `${cevaplar.prefix} Belirtiğiniz üyenin veya sizin belirttiğiniz miktarda parası bulunamadı. (Sizin mevcut: ${data_1.toLocaleString()} ${ayarlar.serverName} Parası, ${uye.displayName}'ın mevcut: ${data_2.toLocaleString()} ${ayarlar.serverName} Parası)`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 7500);
        });
    }
};