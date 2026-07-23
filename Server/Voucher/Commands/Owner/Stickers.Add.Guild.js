const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
// Global değişkenlerin doğru import edildiği varsayılmıştır (ayarlar, roller, cevaplar, sistem, emojiler).
const { ayarlar, roller, cevaplar, sistem, emojiler } = global;

module.exports = {
    Isim: "stickeryükle",
    Komut: ["stickeroluştur", "sticker", "stk"],
    Kullanim: "stickeryükle <Bağlantı> <Sticker Adı> <Açıklama> <İlgili Emoji (Tek Karakter)>",
    Aciklama: "Belirtilen bağlantıdan sunucuya yeni bir çıkartma (sticker) yükler.",
    Kategori: "kurucu",
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

    onRequest: async function (client, msg, args) {
        // İzin Kontrolü (Sticker yönetimi izni genellikle gereklidir)
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

        // Argümanları ayırma (Komple metin üzerinden ayırma)
        // Kullanım: !stk [link] [isim] [açıklama] [emoji]
        const [link, ad, aciklama, emojiTag] = args;

        if (!link || !ad || !aciklama || !emojiTag) {
            return msg.channel.send(`${cevaplar.prefix} Lütfen tüm argümanları doğru belirtin!
            __Kullanım:__ \`${sistem.botSettings.Prefixs[0]}${module.exports.Isim} <Bağlantı> <Ad> <Açıklama> <Emoji>\`
            **Not:** Bağlantı, PNG/APNG veya Lottie olmalıdır. Emoji tek bir karakter olmalıdır.
            `).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 10000));
        }

        // Sticker yükleme fonksiyonunu çağır
        StickerYükle(link, ad, aciklama, emojiTag, msg);
    }
};

/**
 * @param {string} link - Sticker'ın bağlantısı (URL)
 * @param {string} ad - Sticker adı (2-30 karakter)
 * @param {string} aciklama - Sticker açıklaması
 * @param {string} emojiTag - Sticker ile ilişkilendirilecek emoji (Tek karakter)
 * @param {Message} message - Komutu gönderen mesaj objesi
 */
async function StickerYükle(link, ad, aciklama, emojiTag, message) {
    // Sticker oluşturma işlemi
    try {
        const sticker = await message.guild.stickers.create({ 
            file: link, 
            name: ad, 
            description: aciklama,
            tags: emojiTag, // Sticker ile ilgili emoji/tag
            reason: `${message.author.tag} tarafından yüklendi`
        });

        // Başarılı embed oluşturma (V14 EmbedBuilder)
        const successEmbed = new EmbedBuilder()
            .setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla \`${sticker.name}\` adında sticker oluşturuldu.`)
            .addFields(
                { name: "Adı", value: `\`${sticker.name}\``, inline: true },
                { name: "Açıklama", value: `\`${sticker.description}\``, inline: true },
                { name: "Etiketi", value: `\`${sticker.tags}\``, inline: true }
            )
            .setThumbnail(sticker.url)
            .setColor("Green");

        const sentMessage = await message.channel.send({ embeds: [successEmbed] }).catch(err => {});
        
        // Mesaja tepki verme
        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
        
        if(sentMessage) {
            setTimeout(() => {
                sentMessage.delete().catch(err => {});
            }, 10000);
        }

    } catch (error) {
        console.error("Sticker yükleme hatası:", error);
        
        let errorMessage = `Sticker yüklenirken bir hata oluştu. Lütfen bağlantının geçerli olduğundan, dosya formatının (PNG/APNG/Lottie) ve boyutunun uygun olduğundan emin olun.`;
        
        if (error.message.includes("Max number of guild stickers reached")) {
            errorMessage = `Sunucudaki maksimum çıkartma sayısına ulaşıldı. Yeni çıkartma eklemek için yer açmalısınız.`;
        } else if (error.message.includes("File is too large")) {
             errorMessage = `Dosya boyutu çok büyük (512KB sınırı veya Boost seviyesine göre farklı). Lütfen daha küçük bir dosya kullanın.`;
        } else if (error.message.includes("Name is too short/long")) {
             errorMessage = `Sticker adı 2 ila 30 karakter arasında olmalıdır.`;
        }

        message.channel.send({ content: `${message.guild.emojiGöster(emojiler.Iptal)} ${errorMessage}` }).then(x => {
             setTimeout(() => { x.delete().catch(err => {}) }, 10000);
        }).catch(err => {});
    }
}