const { Client, Message, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
// Varsayım: 'ayarlar', 'roller', 'cevaplar', 'client.user' değişkenlerinin erişilebilir olduğu varsayılmıştır.
const roller = require("../../../../Global/Settings/Roles.json")
const cevaplar = require("../../../../Global/Settings/Reply")
const emojiler = require("../../../../Global/Settings/Emoji.json")
const ayarlar = require("../../../../Global/Settings/System.json")
const kanallar = require("../../../../Global/Settings/Channels.json")
module.exports = {
    Isim: "yetkili-mesaj",
    Komut: ["seseçağır", "yetkiliçağır", "yetkili-çağır","sesçağır", "ytçağır"],
    Kullanim: "yetkiliçağır",
    Aciklama: "Seste olmayan yetkilileri çağırır.",
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
        // Yetki Kontrolü
        const requiredRoles = [
            ...(ayarlar.staff || []),
            ...(roller.kurucuRolleri || [])
        ];
        
        const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || requiredRoles.some(oku => message.member.roles.cache.has(oku));
        
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let embed = new genEmbed();
        
        let enAltYetkiliRolü = message.guild.roles.cache.get(roller.başlangıçYetki);
        
        if (!enAltYetkiliRolü) return message.reply("`roller.başlangıçYetki` ID'sine sahip bir rol bulunamadı!").catch(e => {});

        // Seste olmayan yetkilileri filtreleme
        let yetkililer = message.guild.members.cache.filter(uye => 
            !uye.user.bot && 
            uye.roles.highest.position >= enAltYetkiliRolü.position && 
            !uye.voice.channel
        );

        if (yetkililer.size === 0) return message.reply('Aktif olup, seste olmayan yetkili bulunmuyor. Maşallah!').catch(e => {});
        
        let mesaj = await message.channel.send({ content: `**${yetkililer.size}** yetkiliye sese gelme çağırısı yapılıyor...` });
        
        let sentCount = 0; // Başarı ile mesaj gönderilen sayacı

        yetkililer.forEach((yetkili, index) => {
            // Her yetkiliye 4 saniye arayla mesaj gönder
            setTimeout(() => {
                const callMessage = message.guild.name + ' Sunucusunda yetkin var ancak seste değilsin. Eğer sese girmez isen yetki yükseltimin göz önünde bulundurulacaktır.';
                
                yetkili.send({ content: callMessage })
                    .then(() => {
                        sentCount++;
                        // Başarılı mesaj gönderiminde mesajı güncelle
                        mesaj.edit({ embeds: [embed.setDescription(`${yetkili} yetkilisine özelden mesaj atıldı! (${sentCount}/${yetkililer.size})`)] }).catch(e => {});
                    })
                    .catch(err => {
                        // DM kapalıysa kanalda etiketle ve mesajı güncelle
                        message.channel.send({ content: `${yetkili}, ${callMessage} Ayrıca dm'ni aç mesaj atamıyorum.` }).catch(e => {});
                        mesaj.edit({ embeds: [embed.setDescription(`${yetkili} yetkilisine özelden mesaj atılamadığı için kanalda etiketlendi! (${sentCount}/${yetkililer.size})`)] }).catch(e => {});
                    });
            }, index * 4000); // index * 4000 = 0, 4000, 8000, ...
        });
        
        // İşlem bittiğinde son bir bilgilendirme mesajı düzenlemesi yapabilirsiniz (Opsiyonel)
        setTimeout(() => {
            mesaj.edit({ content: `Çağrı işlemi tamamlandı. Toplam **${yetkililer.size}** yetkiliden **${sentCount}** tanesine DM yoluyla ulaşıldı.` , embeds: []}).catch(e => {});
        }, yetkililer.size * 4000 + 1000); 
    }
};