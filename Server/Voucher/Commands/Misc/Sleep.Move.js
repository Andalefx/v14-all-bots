const { Client, Message, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
// Varsayım: 'ayarlar', 'roller', 'cevaplar', 'emojiler' ve 'kanallar' değişkenlerinin erişilebilir olduğu varsayılmıştır.
const roller = require("../../../../Global/Settings/Roles.json")
const cevaplar = require("../../../../Global/Settings/Reply")
const emojiler = require("../../../../Global/Settings/Emoji.json")
const ayarlar = require("../../../../Global/Settings/System.json")
const kanallar = require("../../../../Global/Settings/Channels.json")
module.exports = {
    Isim: "sleep",
    Komut: ["sleep","sleeptaşı","sleep-taşı"],
    Kullanim: "sleep",
    Aciklama: "",
    Kategori: "yönetim",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) {

  },

   /**
   * @param {Client} client 
   * @param {Message} msg 
   * @param {Array<String>} args 
   */

  onRequest: async function (client, message, args) {
        // Yetki Kontrolü
        const requiredRoles = [
            ...(ayarlar.staff || []),
            ...(roller.üstYönetimRolleri || []),
            ...(roller.altYönetimRolleri || []),
            ...(roller.yönetimRolleri || []),
            ...(roller.kurucuRolleri || [])
        ];
        
        const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || requiredRoles.some(oku => message.member.roles.cache.has(oku));
        
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let voiceChannel = message.member.voice.channelId;
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])

        // Eğer komut tek bir üyeye yönelik değilse ve komutu kullanan seste değilse
        if (!uye && !voiceChannel) {
            return message.reply({ content: `${cevaplar.prefix} Ses kanalında olmadığın için işlem iptal edildi.` }).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(e => {})
                setTimeout(() => { x.delete().catch(err => {}) }, 7500);
            });
        }
        
        // Tek Üye Taşıma
        if (uye) {
            if (!uye.voice.channel) {
                return message.reply({ content: `${message.guild.emojiGöster(emojiler.Iptal)} Belirtilen **${uye.user.tag}** isimli üye seste aktif olmadığından işlem iptal edildi.` }).then(x => {
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(e => {})
                    setTimeout(() => { x.delete().catch(err => {}) }, 8500);
                });
            }
            
            await uye.voice.setChannel(kanallar.sleepRoom).catch(e => {});

            return message.reply({ content: `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla! ${uye} isimli üye ${message.guild.channels.cache.get(kanallar.sleepRoom)} kanalına taşındı!` }).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(e => {})
                setTimeout(() => { x.delete().catch(err => {}) }, 8500);
            });
        } 
        
        // Toplu Taşıma (Kullanıcı seste olmalı)
        else {
            const currentVoiceChannel = message.member.voice.channel;
            
            // Kulaklığı veya mikrofonu kapalı olan üyeleri filtrele
            let uyeler = currentVoiceChannel.members.filter(x => x.voice.selfDeaf || x.voice.selfMute);

            if (uyeler.size <= 0) {
                return message.reply({ content: `${message.guild.emojiGöster(emojiler.Tag)} Bulunduğun odada kulaklığı veya mikrofonu kapalı üye bulunamadı.` }).then(x => {
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(e => {})
                    setTimeout(() => { x.delete().catch(err => {}) }, 8500);
                });
            }
            
            // Üyeleri sırayla taşı
            uyeler.forEach((m, index) => {
                setTimeout(() => {
                    m.voice.setChannel(kanallar.sleepRoom).catch(e => {});
                }, index * 1000);
            });
            
            message.reply({ content: `${message.guild.emojiGöster(emojiler.Onay)} Bulunduğun ${currentVoiceChannel} adlı ses kanalında kulaklığı veya mikrofonu kapalı olan **${uyeler.size}** üyeyi(leri) ${message.guild.channels.cache.get(kanallar.sleepRoom)} kanalına taşıdım.` }).then(x => {
                setTimeout(() => { x.delete().catch(err => {}) }, 8500);
            });
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(e => {})
        }
    }
}