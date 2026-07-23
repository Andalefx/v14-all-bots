const { Client, Message, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
// Varsayım: 'ayarlar', 'roller', 'cevaplar' değişkenlerinin erişilebilir olduğu varsayılmıştır.
const roller = global.roller 
const ayarlar= global.ayarlar 
const cevaplar = global.cevaplar 
const emojiler = global.emojiler 
module.exports = {
    Isim: "toplantıçağır",
    Komut: ["toplantı-çağır", "meeting-call"],
    Kullanim: "toplantıçağır",
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
            ...(roller.kurucuRolleri || [])
        ];
        
        const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || (ayarlar.staff && ayarlar.staff.includes(message.member.id)) || requiredRoles.some(oku => message.member.roles.cache.has(oku));
        
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let embed = new genEmbed();

        // Yetkili Rolü Kontrolü
        if(!roller.başlangıçYetki) return message.reply(`${cevaplar.prefix} Lütfen geçerli bir \`başlangıçYetki\` rol ID'si tanımlayın.`).then(x => setTimeout(() => {x.delete().catch(e => {})}, 7500));

        let enAltYetkiliRolü = message.guild.roles.cache.get(roller.başlangıçYetki);
        if(!enAltYetkiliRolü) return message.reply(`${cevaplar.prefix} Tanımlanan başlangıç yetki rolü sunucuda bulunamadı.`).then(x => setTimeout(() => {x.delete().catch(e => {})}, 7500));


        // Seste Olmayan Yetkilileri Bulma
        let yetkililer = message.guild.members.cache.filter(uye => 
            !uye.user.bot && 
            uye.roles.highest.position >= enAltYetkiliRolü.position && 
            !uye.voice.channel &&
            uye.presence && uye.presence.status !== 'offline' // Çevrimdışı olanları filtreleyebiliriz (opsiyonel)
        )
        
        if (yetkililer.size === 0) return message.reply('Aktif olup, seste olmayan yetkili bulunmuyor. Maşallah!');
        
        let mesaj = await message.channel.send({content: `**${yetkililer.size}** yetkiliye sese gelme çağırısı yapılıyor...`});
        
        let yetkiliArray = Array.from(yetkililer.values());
        
        for (let i = 0; i < yetkiliArray.length; i++) {
            const yetkili = yetkiliArray[i];
            
            // 2 saniye gecikme eklemek için bir Promise/async fonksiyonu kullanıyoruz.
            await new Promise(resolve => setTimeout(resolve, 2 * 1000)); 

            const dmMesajı = `${message.guild.name} Sunucusunda toplantı başladı. Yetkili olduğun halde toplantıda değilsin. Eğer toplantıya girmezsen yetkilerin alınacaktır.`;

            await yetkili.send(dmMesajı)
                .then(async () => {
                    await mesaj.edit({
                        content: `**${yetkiliArray.length - i - 1}** yetkiliye çağrı yapılmaya devam ediyor...`,
                        embeds: [embed.setDescription(`${yetkili} yetkilisine özelden mesaj atıldı!`)]
                    }).catch(e => {});
                })
                .catch(async () => {
                    // DM atılamazsa kanalda etiketle
                    await message.channel.send(`${yetkili}, ${dmMesajı}`).then(async x => {
                        await mesaj.edit({
                            content: `**${yetkiliArray.length - i - 1}** yetkiliye çağrı yapılmaya devam ediyor...`,
                            embeds: [embed.setDescription(`${yetkili} yetkilisine özelden mesaj atılamadığı için kanalda etiketlendi!`)]
                        }).catch(e => {});
                        // Kanalda etiketlenen mesajı 10 saniye sonra sil (opsiyonel ama temizlik için iyi)
                        setTimeout(() => x.delete().catch(e => {}), 10000); 
                    });
                });
        }
        
        // Tüm çağrılar bittikten sonra son mesajı düzenle
        await mesaj.edit({
            content: `**${yetkililer.size}** yetkiliye çağrı tamamlandı.`,
            embeds: [embed.setDescription(`Çağrı tamamlandı. ${yetkililer.size} yetkiliye işlem yapıldı.`)]
        }).catch(e => {});
        
        // Son mesajı 15 saniye sonra sil
        setTimeout(() => {
            mesaj.delete().catch(err => {})
        }, 15000);
    }
};