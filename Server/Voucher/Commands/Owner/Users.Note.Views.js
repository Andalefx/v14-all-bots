const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
// Global fonksiyonların ve veritabanı modelinin doğru import edildiği varsayılmıştır.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Users = require('../../../../Global/Databases/Client.Users'); // Veritabanı modeliniz

// Global değişkenlerin, client metodlarının ve özellikle tarihsel fonksiyonunun (tarihsel) varlığı varsayılmıştır.
// const { ayarlar, roller, cevaplar, emojiler, tarihsel } = global; 

module.exports = {
    Isim: "notlar",
    Komut: ["not-listele", "notes"],
    Kullanim: "notlar <@andale/ID>", // Kullanım etiketi güncellendi
    Aciklama: "Belirtilen üyenin veritabanındaki tüm notlarını listeler.",
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

        // Üye Bulma (Mention veya ID)
        let uye = message.mentions.users.first() || client.users.cache.get(args[0]);

        // Hata kontrolü için yardımcı fonksiyon
        const checkFailure = (content) => {
             return message.reply({ content: content }).then(msg => {
                const iptalEmoji = message.guild.emojis.cache.get(emojiler.Iptal);
                if (iptalEmoji) message.react(iptalEmoji).catch(err => {});
                setTimeout(() => {
                    msg.delete().catch(err => {});
                }, 7500);
            });
        };

        // Üye Yok Kontrolü
        if (!uye) {
            return checkFailure(`${message.guild.emojis.cache.get(emojiler.Iptal) || '❌'} Bir üye belirtmediğinden işlem iptal edildi.`);
        }
        
        // Veritabanı Verisini Çekme
        let User = await Users.findOne({ _id: uye.id });

        // Veri/Not Yok Kontrolleri
        if (!User) {
            return checkFailure(`${message.guild.emojis.cache.get(emojiler.Iptal) || '❌'} Belirtilen **${uye.tag}** isimli üyenin veritabanında hiç bir kayıdı bulunamadı.`);
        }
        
        // Notların varlığını kontrol et
        if (!User.Notes || User.Notes.length === 0) {
            return checkFailure(`${message.guild.emojis.cache.get(emojiler.Iptal) || '❌'} Belirtilen **${uye.tag}** isimli üyenin notları bulunamadı.`);
        }

        // Notları Listeleme ve Formatlama
        // Not: 'tarihsel' fonksiyonunun global olarak tanımlı olduğu varsayılmıştır.
        let Notlar = User.Notes.map((data, index) => {
            const authorMember = message.guild.members.cache.get(data.Author);
            const authorTag = authorMember ? authorMember.user.tag : `<@${data.Author}>`;
            const date = data.Date ? tarihsel(data.Date) : tarihsel(Date.now());
            
            return `\` ${index + 1} \` **${data.Note}** (${authorTag}) (\`${date}\`)`;
        }).join("\n");
        
        // Listeyi Embed ile Gönderme
        const embed = new genEmbed()
            .setFooter({ text: `${message.member.user.tag} tarafından istendi.` })
            .setDescription(`Aşağıda **${uye.tag}** isimli üyenin yöneticiler tarafından eklenmiş notları listelenmektedir.\n\n${Notlar}`);

        message.channel.send({ embeds: [embed] }).catch(err => {});
        
        // Onay Tepkisi
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay);
        if (typeof emojiler.Onay === 'string') {
            message.react(emojiler.Onay).catch(err => {});
        } else if (onayEmoji && onayEmoji.id) {
            message.react(onayEmoji.id).catch(err => {});
        }
    }
};