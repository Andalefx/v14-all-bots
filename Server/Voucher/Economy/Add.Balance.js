const { Client, Message } = require("discord.js"); // MessageEmbed kaldırıldı, zaten genEmbed kullanılıyor.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Coins = require('../../../../Global/Databases/Client.Users');

// Not: 'ayarlar', 'cevaplar', 'sistem', 'emojiler', 'client.Economy' gibi objelerin/metotların
// dışarıdan erişilebilir (global veya client'a eklenmiş) olduğunu varsayıyorum.

module.exports = {
    Isim: "addbalance",
    Komut: ["baladd", "bal-add", "balla", "coinekle"],
    Kullanim: "addbalance <Altın/Para> <@andale/ID> <Miktar>",
    Aciklama: "Belirtilen üyeye Altın veya Para ekler.",
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
        let embed = new genEmbed();
        // Orijinal kodda message.guild.members.cache.get(message.member.id) kullanılmıştı. message.member daha doğru olsa da, orijinali korundu.
        let uye = message.guild.members.cache.get(message.member.id); 
        let Coin = 0;
let staff = ["1397360217859297321", "1509185761386303489", "1437723701180108835"];

// Yetki Kontrolü
if (!staff.includes(message.member.id)) {
    return message.reply({ content: cevaplar.noyt })
        .then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
}

        // İlk argüman (Para birimi) kontrolü
        if (!args[0]) {
            return message.reply({ content: `${cevaplar.prefix} Lütfen hangi birimden göndereceğini belirt. (Örn: \`${sistem.botSettings.Prefixs[0]}addbalance <Altın/Para> <@andale/ID> <Miktar>\` )` }).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                setTimeout(() => {
                    x.delete().catch(err => {});
                }, 7500);
            });
        }

        // --- PARA İŞLEMLERİ ---
        if (args[0].toLowerCase() === "para") {
            // let Coin = await client.Economy.viewBalance(uye.id, 1); // Bu satırın burada bir işlevi yok, kaldırılabilir veya bırakılabilir.
            
            let Gönderilen = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
            
            // Üye Kontrolü
            if (!Gönderilen) {
                return message.reply({ content: `${cevaplar.prefix} Göndermek istediğiniz bir üyeyi belirtin.` }).then(x => {
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                    setTimeout(() => {
                        x.delete().catch(err => {});
                    }, 7500);
                });
            }

            let Miktar = Number(args[2]);

            // Miktar Rakam Kontrolü
            if (isNaN(Miktar)) {
                return message.reply({ content: `${cevaplar.prefix} Göndermek istediğiniz miktarı rakam olarak girin.` }).then(x => {
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                    setTimeout(() => {
                        x.delete().catch(err => {});
                    }, 7500);
                });
            }
            
            Miktar = Miktar.toFixed(0);

            // Miktar Pozitif Kontrolü
            if (Miktar <= 0) {
                return message.reply({ content: `${cevaplar.prefix} Gönderilen rakam birden küçük veya sıfır olamaz.` }).then(x => {
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                    setTimeout(() => {
                        x.delete().catch(err => {});
                    }, 7500);
                });
            }

            // İşlemler
            await client.Economy.updateBalance(Gönderilen.id, Miktar, "add", 1);
            await Coins.updateOne({ _id: Gönderilen.id }, { $push: { "Transfers": { Uye: uye.id, Tutar: Miktar, Tarih: Date.now(), Islem: "Havadan Gelen Para" } } }, { upsert: true });

            // Başarılı Bildirim
            await message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
            await message.channel.send({ 
                embeds: [
                    embed.setDescription(`${message.guild.emojiGöster(emojiler.Onay)} ${Gönderilen} üyesine başarıyla \`${Miktar}\` ${ayarlar.serverName} Parası gönderildi.`)
                ] 
            });
            return;
        } 
        
        // --- ALTIN İŞLEMLERİ ---
        else if (args[0].toLowerCase() === "altın") {
            // let Coin = await client.Economy.viewBalance(uye.id, 0); // Bu satırın burada bir işlevi yok, kaldırılabilir veya bırakılabilir.
            
            let Gönderilen = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
            
            // Üye Kontrolü
            if (!Gönderilen) {
                return message.reply({ content: `${cevaplar.prefix} Göndermek istediğiniz bir üyeyi belirtin.` }).then(x => {
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                    setTimeout(() => {
                        x.delete().catch(err => {});
                    }, 7500);
                });
            }

            let Miktar = Number(args[2]);

            // Miktar Rakam Kontrolü
            if (isNaN(Miktar)) {
                return message.reply({ content: `${cevaplar.prefix} Göndermek istediğiniz miktarı rakam olarak girin.` }).then(x => {
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                    setTimeout(() => {
                        x.delete().catch(err => {});
                    }, 7500);
                });
            }
            
            Miktar = Miktar.toFixed(0);

            // Miktar Pozitif Kontrolü
            if (Miktar <= 0) {
                return message.reply({ content: `${cevaplar.prefix} Gönderilen rakam birden küçük veya sıfır olamaz.` }).then(x => {
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                    setTimeout(() => {
                        x.delete().catch(err => {});
                    }, 7500);
                });
            }

            // İşlemler
            await client.Economy.updateBalance(Gönderilen.id, Miktar, "add", 0);
            await Coins.updateOne({ _id: Gönderilen.id }, { $push: { "Transfers": { Uye: uye.id, Tutar: Miktar, Tarih: Date.now(), Islem: "Havadan Gelen Altın" } } }, { upsert: true });

            // Başarılı Bildirim
            await message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
            await message.channel.send({ 
                embeds: [
                    embed.setDescription(`${message.guild.emojiGöster(emojiler.Onay)} ${Gönderilen} üyesine başarıyla \`${Miktar}\` ${message.guild.emojiGöster(emojiler.Görev.Altın)} gönderildi.`)
                ] 
            });
            return;
        } 
        
        // --- GEÇERSİZ BİRİM ---
        else {
            return message.reply({ content: `${cevaplar.prefix} Lütfen hangi birimden göndereceğini belirt. (Örn: \`${sistem.botSettings.Prefixs[0]}addbalance <Altın/Para> <@andale/ID> <Miktar>\` )` }).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                setTimeout(() => {
                    x.delete().catch(err => {});
                }, 7500);
            });
        }
    }
};