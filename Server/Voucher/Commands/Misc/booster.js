const { Client, Message, EmbedBuilder } = require("discord.js"); // MessageEmbed yerine EmbedBuilder kullanıldı
const { genEmbed } = require('../../../../Global/İnit/Embed');
// Dışarıdan gelen global değişkenlerin var olduğu varsayılmıştır (roller, ayarlar, emojiler, cevaplar).

let zaman = new Map();

module.exports = {
    Isim: "booster",
    Komut: ["b","boost","zengin"],
    Kullanim: "booster <Belirlenen Isim>",
    Aciklama: "Sunucuya takviye atan üyeler bu komut ile isim değişimi yapar.",
    Kategori: "diğer",
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
    onRequest: async (client, message, args) => {
        
        // Bu komutta kullanılmadığı için genEmbed değişkeni kaldırılabilir, ancak yapıyı koruyorum.
        // let embed = new genEmbed(); 

        // 1. Yetki Kontrolü (message.reply yerine güncel syntax kullanıldı)
        const isStaff = roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || message.member.permissions.has('Administrator');
        const isBoosterOrSpecial = message.member.roles.cache.has(roller.boosterRolü) || (roller.özelRoller && roller.özelRoller.some(x => message.member.roles.cache.has(x)));
        
        if (!isBoosterOrSpecial && !isStaff) {
            return message.reply({content: cevaplar.noyt}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // 2. Cooldown (Ephemeral kaldırıldı, normal mesaj gönderildi)
        if (zaman.get(message.author.id) >= 1) {
            return message.reply({content: `${message.guild.emojiGöster(emojiler.Iptal)} Sunucu takviyecisi özellik komutunu sadece **15 Dakika** ara ile kullanabilirsin.`})
                .then(s => setTimeout(() => s.delete().catch(err => {}), 7500))
                .catch(err => {});
        }
        
        // 3. İsim Ayarlama İşlemleri
        let isim = args.join(' ');
        if (!isim) {
            return message.reply({content: cevaplar.argümandoldur}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Yetkili İsim Değiştirme Kuralı (Sadece yetkililer için isim/yaş koruma mantığı)
        if(ayarlar.type && ayarlar.isimyas) {
            if(roller.Yetkiler.some(x => message.member.roles.cache.has(x)) && !isStaff) {
                
                let Nickname = message.member.nickname ? message.member.nickname.replace(ayarlar.tagsiz || "", "").replace(ayarlar.tag || "", "").replace(" ", "").split(" | ")[0] : null;

                if(Nickname && message.member.manageable) {
                    // Nickname.replace ile eski isim parçasını bulup yeni isimle değiştir
                    // Not: Bu mantık v14'te de aynı kalır, ancak doğru çalıştığından emin olmak için test edilmeli.
                    const newNickname = message.member.displayName.replace(Nickname, isim);

                    try {
                        await message.member.setNickname(newNickname);
                        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅');
                        
                        zaman.set(message.author.id, 1);
                        setTimeout(() => {
                            zaman.delete(message.author.id);
                        }, 1000 * 60 * 15 * 1); // 15 dakika

                        return;
                    } catch (err) {
                        client.logger.error(`[BOOSTER KOMUTU] Yetkili isim değiştirme hatası: ${err.message}`, "cmd");
                        return message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌');
                    }
                } else {
                    return message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌');
                }
            }
        }
        
        // Normal Booster İsim Değiştirme (İsim/Yaş koruması yoksa)
        let yazilacakIsim;
        
        if(ayarlar.type) {
            // Taglı sunucular için: [Tag] [İsim]
            const currentTag = message.member.user.username.includes(ayarlar.tag) ? ayarlar.tag : (ayarlar.tagsiz || "");
            yazilacakIsim = `${currentTag} ${isim}`;
        } else {
            // Tagsiz sunucular için: [İsim]
            yazilacakIsim = `${isim}`;
        }
        
        if(message.member.manageable) {
            try {
                await message.member.setNickname(`${yazilacakIsim}`);
                
                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅');
                
                zaman.set(message.author.id, 1);
                setTimeout(() => {
                    zaman.delete(message.author.id);
                }, 1000 * 60 * 15 * 1); // 15 dakika
                
            } catch (err) {
                client.logger.error(`[BOOSTER KOMUTU] Nickname değiştirme hatası: ${err.message}`, "cmd");
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌');
            }
        } else {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌');
        }
    }
};