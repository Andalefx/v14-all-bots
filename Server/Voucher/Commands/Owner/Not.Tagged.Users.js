const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
// Global fonksiyonların doğru import edildiği varsayılmıştır.
const { genEmbed } = require("../../../../Global/İnit/Embed");

// Global değişkenlerin doğru import edildiği varsayılmıştır.
// const { ayarlar, roller, cevaplar, emojiler } = global; 

module.exports = {
    Isim: "tagsizver",
    Komut: ["tagsizlarver", "taglırolver"],
    Kullanim: "tagsizver",
    Aciklama: "Sunucudaki taglı/tagsız üyelerin rollerini ve takma adlarını günceller.",
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
        // ayarlar.type kontrolü
        if (!ayarlar.type) return;

        // V14 Embed Oluşturma
        const embed = new genEmbed(); 

        // İzin Kontrolü (Administrator veya kurucu rolleri)
        const hasPermission = message.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)));
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // --------------------------------------------------------------------------------
        // 1. Taglı olup rolü olmayanlar (Rol verilecekler)
        // --------------------------------------------------------------------------------

        // Filtre: Tagı var, tag rolü yok, özel rolleri yok (şüpheli, yasaklı, jail, kayıtsız değil)
        let rolsuzuye = message.guild.members.cache.filter(m => 
            m.user.username.includes(ayarlar.tag) && // Tagı var
            !m.roles.cache.has(roller.tagRolü) &&    // Tag rolü yok
            !m.roles.cache.has(roller.şüpheliRolü) && 
            !m.roles.cache.has(roller.yasaklıTagRolü) &&
            !m.roles.cache.has(roller.jailRolü) &&
            !roller.kayıtsızRolleri.some(x => m.roles.cache.has(x))
        );
        
        rolsuzuye.forEach(roluolmayanlar => { 
            // Rol verme
            roluolmayanlar.roles.add(roller.tagRolü).catch(err => {});
            
            // Takma ad güncelleme (tagsız etiketi varsa taglı etiketine çevirir)
            roluolmayanlar.setNickname(roluolmayanlar.displayName.replace(ayarlar.tagsiz, ayarlar.tag)).catch(err => {});
        });

        // --------------------------------------------------------------------------------
        // 2. Tagsız olup tag rolü olanlar (Rolü alınacaklar)
        // --------------------------------------------------------------------------------

        // Filtre: Tagsız, tag rolü var, özel rolleri yok
        let rollütagsiz = message.guild.members.cache.filter(m => 
            !m.user.username.includes(ayarlar.tag) && // Tagsız
            m.roles.cache.has(roller.tagRolü) &&      // Tag rolü var
            !m.roles.cache.has(roller.şüpheliRolü) && 
            !m.roles.cache.has(roller.yasaklıTagRolü) &&
            !m.roles.cache.has(roller.jailRolü) &&
            !roller.kayıtsızRolleri.some(x => m.roles.cache.has(x))
        );

        rollütagsiz.forEach(rl => {
            // Takma ad güncelleme (taglı etiketi varsa tagsız etiketine çevirir)
            rl.setNickname(rl.displayName.replace(ayarlar.tag, ayarlar.tagsiz)).catch(err => {});
            
            // Rol alma
            rl.roles.remove(roller.tagRolü).catch(err => {});
        });

        // Bilgilendirme mesajı gönderme
        message.channel.send({
            embeds: [embed.setDescription(`Sunucuda taglı olup rolü olmayan **\`${rolsuzuye.size}\`** üyeye taglı rolü verildi, ve tagsız **\`${rollütagsiz.size}\`** üyeden geri alınmaya başlandı!`).setFooter({ text: 'Bu işlem biraz zaman alabilir.' })]
        }).then(x => {
            // Mesajı silme
            setTimeout(() => {
                x.delete().catch(err => {});
            }, 7500);
        });

        // Emoji Tepkisi
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay); 
        if (onayEmoji) {
            message.react(onayEmoji).catch(err => {});
        } else if (emojiler.Onay) {
            message.react(emojiler.Onay).catch(err => {}); 
        }
    }
};