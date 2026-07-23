const { Client, Message, EmbedBuilder, PermissionsBitField, AttachmentBuilder, ChannelType } = require("discord.js");
const Snipe = require('../../../../Global/Databases/Channels.Snipe');
const moment = require('moment');
const { genEmbed } = require("../../../../Global/İnit/Embed");
require("moment-duration-format");
require("moment-timezone");
// Varsayım: 'roller', 'cevaplar', 'emojiler' ve 'genEmbed' değişken/fonksiyonlarının erişilebilir olduğu varsayılmıştır.
const roller = require("../../../../Global/Settings/Roles.json")
const cevaplar = require("../../../../Global/Settings/Reply")
const emojiler = require("../../../../Global/Settings/Emoji.json")
const ayarlar = require("../../../../Global/Settings/System.json")
const kanallar = require("../../../../Global/Settings/Channels.json")
module.exports = {
    Isim: "snipe",
    Komut: ["snipe"],
    Kullanim: "snipe",
    Aciklama: "Komutun kullanıldığı kanal da en son silinmiş mesajın içeriğini ve tarihini gösterir.",
    Kategori: "yönetim",
    Extend: true,
  /**
   * @param {Client} client 
   */
  onLoad: function (client) {
    client.on("messageDelete", async message => {
        if (message.channel.type === "dm" || !message.guild || message.author.bot) return;
        await Snipe.updateOne({ _id: message.channel.id }, { $set: {  
            "yazar": message.author.id, 
            "yazilmaTarihi": message.createdTimestamp,
            "silinmeTarihi": Date.now(), 
            "dosya": message.attachments.first() ? true : false,
	    "icerik": message.attachments.first() ? message.attachments.first().proxyURL : message.content ? message.content : "Boş Mesaj!"
          } }, { upsert: true })
    });
  },
  /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   * @param {Guild} guild
   */
  onRequest: async function (client, message, args, guild) {

        // Yetki Kontrolü
        const requiredRoles = [
            ...(roller.üstYönetimRolleri || []),
            ...(roller.altYönetimRolleri || []),
            ...(roller.yönetimRolleri || []),
            ...(roller.kurucuRolleri || []),
            ...(roller.Yetkiler || []),
        ];
        
        const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || message.member.roles.cache.has(roller.boosterRolü) || requiredRoles.some(x => message.member.roles.cache.has(x));

        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let mesaj = await Snipe.findById(message.channel.id);
        
        if (!mesaj) return message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(e => {});
        
        let mesajYazari = await client.users.fetch(mesaj.yazar).catch(e => null);
        if (!mesajYazari) return message.reply({ content: "Mesajın yazarını bulamadım." });

        let embed = new genEmbed()
            .setDescription(`Atan Kişi: ${mesajYazari}
Yazılma Tarihi: <t:${Number(String(mesaj.yazilmaTarihi).substring(0, 10))}:R>
Silinme Tarihi: <t:${Number(String(mesaj.silinmeTarihi).substring(0, 10))}:R>  
${mesaj.dosya ? "\n**Atılan mesaj dosya içeriyor**" : ""}`)
            .setAuthor({ name: mesajYazari.tag, iconURL: mesajYazari.avatarURL() }); // V14 setAuthor kullanımı

        // V14: addField yerine addFields kullanımı
        if (mesaj.icerik && !mesaj.dosya) {
             embed.addFields([{ name: 'Mesajın İçeriği', value: mesaj.icerik.substring(0, 1024) }]);
        }
        
        if (mesaj.dosya) embed.setImage(mesaj.icerik);

        let acardörtbin;
        if (mesaj.icerik) acardörtbin = mesaj.icerik;
        
        // İlk Yanıt Denemesi (Embed ile)
        message.reply({ embeds: [embed] }).then(x => setTimeout(() => {
            x.delete().catch(e => {})
        }, 15000)).catch(err => { 
            // Hata Durumu (Mesaj içeriği 4096 karakteri aşarsa)
            
            // V14: AttachmentBuilder kullanımı
            const textAttachment = new AttachmentBuilder(Buffer.from(acardörtbin), { name: `${mesaj.yazar}-snipe.txt` });

            message.reply({
                content: `${message.guild.emojiGöster(emojiler.chatMuteKaldırıldı)} ${message.guild.members.cache.get(mesaj.yazar) || 'Bilinmeyen Üye'} (\`${moment.duration(Date.now() - mesaj.yazilmaTarihi).format("D [gün], H [saat], m [dakika], s [saniye]")} önce yazılma / ${moment.duration(Date.now() - mesaj.silinmeTarihi).format("D [gün], H [saat], m [dakika], s [saniye]")} önce silinme\`) üyesi karakter sayısını aşan bir metin gönderdiği için **Discord API** buna izin vermedi, bende senin için dosya hazırladım.`,
                files: [textAttachment] // V14'te doğrudan AttachmentBuilder objesi gönderilir.
            });
        });
    }
}