const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
// Global fonksiyonların doğru import edildiği varsayılmıştır.
// V14'te EmbedBuilder kullanıldığı için bu satırı değiştirdik.
const { genEmbed } = require("../../../../Global/İnit/Embed");

// Global değişkenlerin doğru import edildiği varsayılmıştır (ayarlar, roller, cevaplar).
// Bu kod örneğinde global değişkenlerin varlığı varsayılmaktadır.
// const { ayarlar, roller, cevaplar } = global; 

module.exports = {
    Isim: "etiketle",
    Komut: ["roletiketle"],
    Kullanim: "etiketle <etiketRol/RolID> <Sebep>",
    Aciklama: "Belirtilen bir rolü belirli bir sebeple etiketler.",
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
        // İzin Kontrolü
        const hasPermission = ayarlar.staff.includes(message.member.id) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)));
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Rol Bulma
        let rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        if (!rol) {
            return message.reply({ content: cevaplar.argümandoldur }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Sebep Belirleme
        let sebep = args.slice(1).join(" ");
        if (!sebep) {
            return message.reply({ content: cevaplar.sebep }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Orijinal mesajı silme
        message.delete().catch(err => {});
        
        // Embed Oluşturma (v14 EmbedBuilder kullanımı)
        const etiketEmbed = new EmbedBuilder()
            // genEmbed fonksiyonunuzun EmbedBuilder döndürdüğünü varsayıyorum.
            // Eğer genEmbed sadece MessageEmbed döndürüyorsa, bu satır hata verebilir.
            // Bu yüzden direkt EmbedBuilder kullanmayı tercih ettim:
            // .setColor("White") yerine .setColor("White") kullanılır.
            // V14'te color değerleri string veya integer olabilir.
            .setColor("White") 
            .setFooter({ text: `${message.member.user.tag} tarafından etiketlendirildi.` })
            .setDescription(sebep);
            
        // Mesajı Gönderme (V14'te reply/send fonksiyonları content ve embeds parametrelerini bir obje içinde alır.)
        message.channel.send({ 
            content: `${rol}`, 
            embeds: [etiketEmbed] 
        }).catch(err => console.error(err));
    }
};