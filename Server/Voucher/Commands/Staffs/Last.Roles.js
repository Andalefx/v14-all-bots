const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
// Veritabanı modelleri ve global fonksiyonlar korunmuştur.
const Unleash = require('../../../../Global/Databases/Guıild.Remove.Staffs');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require('../../../../Global/İnit/Embed');

// Global değişkenlerin ve client metodlarının (roller, cevaplar, emojiler) varlığı varsayılmıştır.
// const { roller, cevaplar, emojiler } = global; 

module.exports = {
    Isim: "sonyetki",
    Komut: ["son-yetkisi", "sonrolleri", "sonroller", "yetkibırakan"],
    Kullanim: "yetkibırakan <@andale/ID>", // Kullanım etiketi güncellendi
    Aciklama: "Belirtilen eski yetkili üyenin yetkiden ayrılırken sahip olduğu son rolleri listeler.",
    Kategori: "yönetim",
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
        // İzin Kontrolü (Yönetim Rolleri veya Admin)
        const hasPermission = roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) ||
                              roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) ||
                              roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) ||
                              roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) ||
                              message.member.permissions.has(PermissionFlagsBits.Administrator);
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Üye Bulma
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!uye) {
            return message.reply({ content: cevaplar.üye }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Kendi Kontrolü
        if (message.author.id === uye.id) {
            return message.reply({ content: cevaplar.kendi }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Veritabanı Kontrolü
        let data = await Unleash.findOne({ _id: uye.id });
        
        if (!data || !data.unleashRoles || data.unleashRoles.length === 0) {
            return message.reply({ content: cevaplar.data }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Rolleri Listeleme
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay) || '✅';

        const roleList = data.unleashRoles.map(x => {
            const role = message.guild.roles.cache.get(x);
            return `\` • \` ${role ? role.name : x} (\`${x}\`)`;
        }).join("\n");

        // Embed Hazırlama ve Gönderme
        message.channel.send({
            embeds: [
                new genEmbed()
                    .setFooter({ text: "Bu görüntüleme ektedir." })
                    .setTimestamp()
                    .setDescription(`:tada: **${uye.user.tag}** isimli eski yetkili üyenin yetkiden ayrılırken sahip olduğu son rolleri aşağıdadır.\n\n\` ••❯ \` **Rolleri Şunlardır**:\n${roleList}`)
            ]
        }).catch(err => {});

        // Not: Orijinal kodda mesajı silme yoktu, sadece hata mesajı siliniyordu.
        // Mesajın silinmesini istemediğiniz için, sadece reaksiyonu ekleyelim.
        const reactEmoji = message.guild.emojis.cache.get(emojiler.Onay);
        if (typeof emojiler.Onay === 'string') {
            message.react(emojiler.Onay).catch(err => {});
        } else if (reactEmoji && reactEmoji.id) {
            message.react(reactEmoji.id).catch(err => {});
        }
    }
};