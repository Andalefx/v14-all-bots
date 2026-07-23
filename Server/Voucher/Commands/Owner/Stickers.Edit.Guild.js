const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

// Global değişkenlerin doğru import edildiği varsayılmıştır (ayarlar, roller, cevaplar, sistem, emojiler).
const { ayarlar, roller, cevaplar, sistem, emojiler } = global; 

module.exports = {
    Isim: "stickerdüzenle",
    Komut: ["stickeradlandir", "stkduzenle", "stkdüzenle", "stkd"],
    Kullanim: "stickerdüzenle <Sticker ID/Sticker İsmi> <Yeni Sticker Adı>",
    Aciklama: "Sunucudaki mevcut bir sticker'ın (çıkartma) adını değiştirir.",
    Kategori: "kurucu",
    Extend: true,
    
    /**
    * @param {Client} client 
    */
    onLoad: function (client) {
        // Yükleme işlemi yok
    },

    /**
    * @param {Client} client 
    * @param {Message} msg 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, msg, args) {
        // İzin Kontrolü (Sticker düzenleme izni veya Yönetici/Kurucu rolü)
        const hasPermission = msg.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers) || 
                              msg.member.permissions.has(PermissionFlagsBits.Administrator) ||
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => msg.member.roles.cache.has(oku)));
                              
        if (!hasPermission) {
            const reply = await msg.reply(cevaplar.noyt).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
            }, 5000);
            return;
        }

        const hedefStickerBilgisi = args[0]; // Sticker ID'si veya mevcut adı
        const yeniIsmim = args[1];          // Sticker'ın alacağı yeni isim
        
        if (!hedefStickerBilgisi || !yeniIsmim) {
            const reply = await msg.channel.send(`${cevaplar.prefix} Lütfen bir sticker ve yeni isim belirtmelisin! __Örn:__ \`${sistem.botSettings.Prefixs[0]}${module.exports.Isim} <Sticker ID/İsim> <Yeni Isim>\``).catch(err => {});
            setTimeout(() => { reply.delete().catch(err => {}) }, 7500);
            return;
        }

        // Sticker'ı bulup düzenleme fonksiyonunu çağır
        StickerDuzenle(hedefStickerBilgisi, yeniIsmim, msg);
    }
}

/**
 * Sticker'ın adını günceller.
 * @param {string} stickerTarget - Sticker ID'si veya mevcut adı.
 * @param {string} yeniIsim - Sticker'ın alacağı yeni isim.
 * @param {Message} message - Komutu gönderen mesaj objesi.
 */
async function StickerDuzenle(stickerTarget, yeniIsim, message) {
    
    // 1. Sticker'ı ID'ye veya isme göre bul
    let stickerFind = message.guild.stickers.cache.get(stickerTarget);

    // Eğer ID ile bulunamadıysa, isme göre bulmayı dene
    if (!stickerFind) {
        // Sticker'ları fetch etmeden cache'te isimle bulmaya çalış
        stickerFind = message.guild.stickers.cache.find(x => x.name.toLowerCase() === stickerTarget.toLowerCase());
        
        // Hala bulunamadıysa, tüm sticker'ları fetch et ve tekrar dene (büyük sunucularda performans düşüklüğüne yol açabilir)
        if (!stickerFind) {
             await message.guild.stickers.fetch().catch(err => {});
             stickerFind = message.guild.stickers.cache.get(stickerTarget) || message.guild.stickers.cache.find(x => x.name.toLowerCase() === stickerTarget.toLowerCase());
        }
    }

    if (stickerFind) {
        try {
            // 2. Sticker adını güncelle (Sticker nesnesi edit metodu kullanılır)
            const updatedSticker = await stickerFind.edit({ name: yeniIsim }, `Yetkili: ${message.author.tag} tarafından isim düzenlemesi.`);
            
            // 3. Başarılı yanıt
            const reply = await message.reply(`Başarıyla \`${stickerFind.name}\` sticker'ının ismi **${updatedSticker.name}** olarak güncellendi. ${message.guild.emojiGöster(emojiler.Onay)}`).catch(err => {});
            
            if (reply) {
                 setTimeout(() => {
                    reply.delete().catch(err => {});
                 }, 7500);
            }
            // Başarılı reaksiyon
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});

        } catch (error) {
            console.error("Sticker adlandırma hatası:", error);
            // Hata yanıtı (örn: İsim kurallara uymuyor, botun yetkisi yok, Sticker bulunamadı)
            let errorMessage = "Sticker adı değiştirilemedi. Lütfen adın 2-30 karakter arasında olduğundan ve botun gerekli yetkilere sahip olduğundan emin olun.";
            
            if (error.message.includes("Name is too short/long")) {
                 errorMessage = `Sticker adı 2 ila 30 karakter arasında olmalıdır.`;
            }
            
            const errorReply = await message.reply(`${errorMessage} ${message.guild.emojiGöster(emojiler.Iptal)}`).catch(err => {});
            
            if (errorReply) {
                 setTimeout(() => {
                    errorReply.delete().catch(err => {});
                 }, 7500);
            }
        }
    } else {
        // Sticker bulunamadı yanıtı
        const reply = await message.reply(`Belirtilen ID/isimde bir sticker bulunamadı. ${cevaplar.prefix}`).catch(err => {});
        
        if (reply) {
             setTimeout(() => {
                reply.delete().catch(err => {});
             }, 7500);
        }
    }
}