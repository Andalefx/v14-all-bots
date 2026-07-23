const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
// Global fonksiyonların ve veritabanı modelinin doğru import edildiği varsayılmıştır.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Users = require('../../../../Global/Databases/Client.Users'); // Veritabanı modeliniz

// Global değişkenlerin ve client metodlarının (ayarlar, roller, cevaplar, emojiler) varlığı varsayılmıştır.
// const { ayarlar, roller, cevaplar, emojiler } = global; 

module.exports = {
    Isim: "nottemizle",
    Komut: ["not-temizle", "notlartemizle"],
    Kullanim: "not-temizle <@andale/ID>", // Kullanım etiketi güncellendi
    Aciklama: "Belirtilen üyenin veritabanındaki tüm notlarını temizler.",
    Kategori: "kurucu",
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
        // İzin Kontrolü (Administrator, staff veya kurucu rolleri)
        const hasPermission = ayarlar.staff.includes(message.member.id) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)));
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Üye Bulma
        // message.mentions.users.first() bir User objesi döndürür, message.guild.members.cache.get(args[0]) ise bir GuildMember objesi.
        // Veritabanı işlemi için sadece ID lazım olduğundan User objesi yeterlidir.
        let uye = message.mentions.users.first() || client.users.cache.get(args[0]);

        // Üye Yok Kontrolü
        if (!uye) {
            return message.reply({ 
                content: `${message.guild.emojis.cache.get(emojiler.Iptal) || '❌'} Bir üye belirtmediğinden işlem iptal edildi.` 
            }).then(msg => {
                const iptalEmoji = message.guild.emojis.cache.get(emojiler.Iptal);
                if (iptalEmoji) message.react(iptalEmoji).catch(err => {});
                setTimeout(() => {
                    msg.delete().catch(err => {});
                }, 7500);
            });
        }
        
        // Veritabanı Verisini Çekme
        let User = await Users.findOne({ _id: uye.id });

        // Veri/Not Yok Kontrolleri
        const checkFailure = (content) => {
             return message.reply({ content: content }).then(msg => {
                const iptalEmoji = message.guild.emojis.cache.get(emojiler.Iptal);
                if (iptalEmoji) message.react(iptalEmoji).catch(err => {});
                setTimeout(() => {
                    msg.delete().catch(err => {});
                }, 7500);
            });
        };

        if (!User) {
            return checkFailure(`${message.guild.emojis.cache.get(emojiler.Iptal) || '❌'} Belirtilen ${uye} isimli üyenin veritabanında hiç bir kayıdı bulunamadı.`);
        }
        
        // Notların varlığını kontrol et
        if (!User.Notes || User.Notes.length === 0) {
            return checkFailure(`${message.guild.emojis.cache.get(emojiler.Iptal) || '❌'} Belirtilen ${uye} isimli üyenin notları bulunamadı.`);
        }
        
        // Veritabanı İşlemi (Notları silme: $unset)
        await Users.updateOne({ _id: uye.id }, { $unset: { "Notes": 1 } }, { upsert: true });
        
        // Onay Mesajı Gönderme
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay) || '✅';
        
        message.channel.send({
            embeds: [
                new genEmbed().setDescription(`${onayEmoji} Başarıyla **${uye.tag}** isimli üyenin tüm notları temizlendi.`)
            ]
        }).then(async (msg) => {
            setTimeout(() => {
                msg.delete().catch(err => {});
            }, 12000);
        });
        
        // Onay Tepkisi
        if (typeof emojiler.Onay === 'string') {
            message.react(emojiler.Onay).catch(err => {});
        } else if (onayEmoji && onayEmoji.id) {
            message.react(onayEmoji.id).catch(err => {});
        }
    }
};