const { Client, Message, PermissionsBitField } = require("discord.js");
// genEmbed'i orijinal kodunuzda kullanmasanız da, dosya yolunda olduğu için tutabilirsiniz.
// const { genEmbed } = require("../../../../Global/Init/Embed"); 

// Varsayım: 'ayarlar', 'roller', 'cevaplar', 'emojiler' değişkenlerinin erişilebilir olduğu varsayılmıştır.
const roller = require("../../../../Global/Settings/Roles.json")
const cevaplar = require("../../../../Global/Settings/Reply")
const emojiler = require("../../../../Global/Settings/Emoji.json")
const ayarlar = require("../../../../Global/Settings/System.json")
const kanallar = require("../../../../Global/Settings/Channels.json")

const MAX_MESSAGE_LENGTH = 1950; // 2000 karakter sınırının biraz altı

module.exports = {
    Isim: "ex-yetkilisay",
    Komut: ["ex-yetkilisay"],
    Kullanim: "ex-yetkilisay",
    Aciklama: "Seste olmayan yetkilileri belirtir.",
    Kategori: "kurucu",
    Extend: false,
    
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
        // Yetki Kontrolü (V14: PermissionsBitField.Flags.Administrator)
        const requiredRoles = [
            ...(ayarlar.staff || []),
            ...(roller.kurucuRolleri || [])
        ];
        
        const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || requiredRoles.some(oku => message.member.roles.cache.has(oku));
        
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));

        let roles = message.guild.roles.cache.get(roller.başlangıçYetki);
        
        if (!roles) return message.reply("`roller.başlangıçYetki` ID'sine sahip rol bulunamadı!").catch(e => {});

        // V14 Uyumlu Filtre: Bot olmayan, başlangıç yetkisinden yüksek veya eşit role sahip VE seste olmayan, online üyeler
        let üyeler = message.guild.members.cache.filter(uye => 
            !uye.user.bot && 
            uye.roles.highest.position >= roles.position && 
            !uye.voice.channel && 
            uye.presence?.status !== "offline" // Online, Idle veya DND olanlar (Presence Intent gerektirir)
        );

        if(üyeler.size === 0) {
            return message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(e => {});
        }
        
        // Başlık mesajını gönder
        message.channel.send({ 
            content: `Online olup seste olmayan <@&${roles.id}> rolündeki ve üzerinde ki yetkili sayısı: **${üyeler.size}**` 
        });
        
        const üyeListesi = üyeler.map(x => `<@${x.id}>`).join(", ");
        
        if (üyeListesi.length > 0) {
            
            if (üyeListesi.length <= 2000) {
                 message.channel.send({ content: üyeListesi });
            } else {
                // Eğer liste çok uzunsa (2000 karakteri aşarsa), manuel olarak ayır
                const mentions = üyeListesi.split(", ");
                let currentMessage = "";

                for (const mention of mentions) {
                    // Mevcut mesaj uzunluğunu, yeni eklenecek kullanıcı ve ayırıcı ile kontrol et
                    if ((currentMessage + mention + ", ").length > MAX_MESSAGE_LENGTH) {
                        // Sınırı aşacaksa, mevcut mesajı gönder
                        await message.channel.send({ content: currentMessage.trim().replace(/,$/, '') });
                        // Yeni mesaja başla
                        currentMessage = mention + ", ";
                    } else {
                        // Sınır aşılmazsa, kullanıcıyı ekle
                        currentMessage += mention + ", ";
                    }
                }
                
                // Kalan son mesajı gönder
                if (currentMessage.length > 0) {
                    await message.channel.send({ content: currentMessage.trim().replace(/,$/, '') });
                }
            }
        }
    }
};