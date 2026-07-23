const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
// Global fonksiyonların ve veritabanı modelinin doğru import edildiği varsayılmıştır.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Users = require('../../../../Global/Databases/Client.Users'); // Veritabanı modeliniz

// Global değişkenlerin ve client metodlarının (ayarlar, roller, cevaplar, emojiler) varlığı varsayılmıştır.
// const { ayarlar, roller, cevaplar, emojiler } = global; 

module.exports = {
    Isim: "not",
    Komut: ["notoluştur"],
    Kullanim: "not <@andale/ID> <Not>",
    Aciklama: "Belirtilen üyeye veritabanına kaydedilmek üzere bir not ekler.",
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
        // V14'te message.mentions.users.first() bir User objesi döndürür, message.guild.members.cache.get(args[0]) ise bir GuildMember objesi. 
        // Burada member objesi gerektiği için kontrolü düzenleyelim.
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
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
        
        // Not Metnini Alma
        const not = args.slice(1).join(" ");
        
        // Not Yok Kontrolü
        if (!not) {
            return message.reply({ 
                content: `${message.guild.emojis.cache.get(emojiler.Iptal) || '❌'} Bir not girmediğinden dolayı işlem iptal edildi.` 
            }).then(msg => {
                const iptalEmoji = message.guild.emojis.cache.get(emojiler.Iptal);
                if (iptalEmoji) message.react(iptalEmoji).catch(err => {});
                setTimeout(() => {
                    msg.delete().catch(err => {});
                }, 7500);
            });
        }
        
        // Veritabanı İşlemi (Notu kaydetme)
        await Users.updateOne({_id: uye.id}, {
            $push: { 
                "Notes": { 
                    "Author": message.member.id, 
                    "Note": not, 
                    "Date": Date.now() 
                }
            }
        }, {upsert: true});
        
        // Onay Mesajı Gönderme
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay) || '✅';
        
        message.channel.send({
            embeds: [
                new genEmbed().setDescription(`${onayEmoji} **${uye.user.tag}** isimli üyeye \`${not}\` notu <t:${String(Date.now()).slice(0, 10)}:R> eklendi.`)
            ]
        }).then(msg => {
            setTimeout(() => {
                msg.delete().catch(err => {});
            }, 7500);
        });
        
        // Onay Tepkisi
        if (typeof emojiler.Onay === 'string') {
            message.react(emojiler.Onay).catch(err => {});
        } else if (onayEmoji && onayEmoji.id) {
            message.react(onayEmoji.id).catch(err => {});
        }
    }
};