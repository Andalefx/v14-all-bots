const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed"); 

// Global değişkenlerin doğru import edildiği varsayılmıştır (ayarlar, roller, cevaplar, sistem, emojiler).
const { ayarlar, roller, cevaplar, sistem, emojiler } = global; 

module.exports = {
    Isim: "emojidüzenle",
    Komut: ["emojiduzenle", "emojiadlandir", "emduzenle", "emdüzenle", "emd"],
    Kullanim: "emojiduzenle <Emoji/Emoji ID/Emoji İsmi> <Yeni Emoji Adı>",
    Aciklama: "Sunucudaki mevcut bir emojinin adını değiştirir.",
    Kategori: "kurucu",
    Extend: true,
    
    /**
    * @param {Client} client 
    */
    onLoad: function (client) {
        // Bu komut için CronJob gibi bir yükleme işlemi yok.
    },

    /**
    * @param {Client} client 
    * @param {Message} msg 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, msg, args) {
        // İzin Kontrolü
        const hasPermission = ayarlar.staff.includes(msg.member.id) || 
                              msg.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => msg.member.roles.cache.has(oku)));
                              
        if (!hasPermission) {
            const reply = await msg.reply(cevaplar.noyt).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
            }, 5000);
            return;
        }

        // Regex Tanımları
        const hasEmoteRegex = /<a?:.+:\d+>/gm; // Mesajdaki tüm emoji formatları
        const emoteRegex = /<:.+:(\d+)>/gm; // Statik emoji ID'si
        const animatedEmoteRegex = /<a:.+:(\d+)>/gm; // Animasyonlu emoji ID'si

        let yeniIsmim = args[1];
        let hedefEmojiBilgisi = args[0]; // Emoji ID'si, adı veya doğrudan emoji stringi

        if (!yeniIsmim) {
            const reply = await msg.channel.send(`${cevaplar.prefix} Lütfen **yeni bir emoji ismi** belirtmelisin! __Örn:__ \`${sistem.botSettings.Prefixs[0]}${module.exports.Isim} <Emoji> <Yeni Isim>\``).catch(err => {});
            setTimeout(() => { reply.delete().catch(err => {}) }, 7500);
            return;
        }
        
        let emojiID;
        let emojiMatch;
        
        // 1. Durum: Mesajda emoji kullanılmışsa, ID'yi al
        if ((emojiMatch = msg.content.match(hasEmoteRegex)) && emojiMatch.length > 0) {
            // Emojinin ID'sini çıkarmak için Regex kullan
            let matchResult;
            if ((matchResult = emoteRegex.exec(emojiMatch[0])) || (matchResult = animatedEmoteRegex.exec(emojiMatch[0]))) {
                emojiID = matchResult[1];
            }
            // Yeni isim args[1]'dir
            yeniIsmim = args[1]; 

        } else if (args[0]) {
            // 2. Durum: İlk argüman ID veya doğrudan isim ise
            // ID mi yoksa isim mi olduğunu EmojiDuzenle fonksiyonu içinde kontrol edeceğiz.
            hedefEmojiBilgisi = args[0];
            yeniIsmim = args[1];
        } else {
             const reply = await msg.channel.send(`${cevaplar.prefix} Lütfen bir emoji belirtmelisin (emoji, ID veya mevcut ismi)! __Örn:__ \`${sistem.botSettings.Prefixs[0]}${module.exports.Isim} <Emoji> <Yeni Isim>\``).catch(err => {});
             setTimeout(() => { reply.delete().catch(err => {}) }, 7500);
             return;
        }

        // Emoji ID'sini veya doğrudan ismi kullanarak düzenleme fonksiyonunu çağır
        // Eğer komut '!emd :emoji_adi: yeni_isim' şeklinde kullanılmışsa, hedefEmojiBilgisi ID'dir.
        // Eğer komut '!emd emoji_adi yeni_isim' şeklinde kullanılmışsa, hedefEmojiBilgisi isimdir.
        EmojiDuzenle(emojiID || hedefEmojiBilgisi, yeniIsmim, msg);
    }
}

/**
 * Emojinin adını günceller.
 * @param {string} emojiTarget - Emoji ID'si veya mevcut adı.
 * @param {string} yeniIsim - Emojinin alacağı yeni isim.
 * @param {Message} message - Komutu gönderen mesaj objesi.
 */
async function EmojiDuzenle(emojiTarget, yeniIsim, message) {
    // Emoji ID'si veya ismine göre emojiyi bul
    const emojiFind = message.guild.emojis.cache.get(emojiTarget) || message.guild.emojis.cache.find(x => x.name === emojiTarget);

    if (emojiFind) {
        try {
            // Emoji adını güncelle
            await emojiFind.setName(yeniIsim, `Yetkili: ${message.author.tag} tarafından isim düzenlemesi.`);
            
            // Başarılı yanıt
            const reply = await message.reply(`Başarıyla ${emojiFind} emojisinin ismi **${yeniIsim}** olarak güncellendi. ${message.guild.emojiGöster(emojiler.Onay)}`).catch(err => {});
            
            if (reply) {
                 setTimeout(() => {
                    reply.delete().catch(err => {});
                 }, 7500);
            }
            // Başarılı reaksiyon
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});

        } catch (error) {
            console.error("Emoji adlandırma hatası:", error);
            // Hata yanıtı (örn: İsim kurallara uymuyor, botun yetkisi yok)
            const errorReply = await message.reply(`Emoji adı değiştirilemedi. Hata: ${error.message} ${message.guild.emojiGöster(emojiler.Iptal)}`).catch(err => {});
            
            if (errorReply) {
                 setTimeout(() => {
                    errorReply.delete().catch(err => {});
                 }, 7500);
            }
        }
    } else {
        // Emoji bulunamadı yanıtı
        const reply = await message.reply(`Belirtilen ID/isimde bir emoji bulunamadı. ${cevaplar.prefix}`).catch(err => {});
        
        if (reply) {
             setTimeout(() => {
                reply.delete().catch(err => {});
             }, 7500);
        }
    }
}