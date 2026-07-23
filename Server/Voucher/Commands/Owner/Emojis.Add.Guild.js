const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed"); 
// Global değişkenlerin doğru import edildiği varsayılmıştır (ayarlar, roller, cevaplar, sistem, emojiler).
const { ayarlar, roller, cevaplar, sistem, emojiler } = global; 

module.exports = {
    Isim: "emojiyükle",
    Komut: ["emojioluştur", "emojiekle", "emekle", "emyükle"],
    Kullanim: "emojiyükle <Emoji/Emoji Bağlantısı> <Emoji Adı>",
    Aciklama: "Belirtilen bağlantıdan veya var olan bir emojiden sunucuya yeni emoji oluşturur.",
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
        // İzin Kontrolü
        const hasPermission = ayarlar.staff.includes(msg.member.id) || 
                              msg.member.permissions.has(PermissionFlagsBits.Administrator) ||
                              (roller.üstYönetimRolleri && roller.üstYönetimRolleri.some(oku => msg.member.roles.cache.has(oku))) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => msg.member.roles.cache.has(oku)));
                              
        if (!hasPermission) {
            const reply = await msg.reply(cevaplar.noyt).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
            }, 5000);
            return;
        }

        // Regex Tanımları
        const hasEmoteRegex = /<a?:.+:\d+>/gm;
        const emoteRegex = /<:.+:(\d+)>/gm;
        const animatedEmoteRegex = /<a:.+:(\d+)>/gm;
        
        let link, isim;

        const messageMatches = msg.content.match(hasEmoteRegex);

        if (messageMatches) {
            // Komut mesajında emoji varsa (yeni emojiden kopyalama)
            let emoji;

            if ((emoji = emoteRegex.exec(messageMatches[0]))) {
                // Statik Emoji
                link = "https://cdn.discordapp.com/emojis/" + emoji[1] + ".png?v=1";
            } else if ((emoji = animatedEmoteRegex.exec(messageMatches[0]))) {
                // Animasyonlu Emoji
                link = "https://cdn.discordapp.com/emojis/" + emoji[1] + ".gif?v=1";
            }
            
            // Eğer args[1] belirtilmişse emoji adı olarak kullan, yoksa rastgele isim ata
            isim = args[1] || `Rand_${Math.round((Math.random() * 9999))}`;

        } else {
            // Komut mesajında emoji yoksa (Bağlantıdan yükleme)
            
            // Argümanları al: link args[1], isim args[2] olmalı
            link = args[0]; 
            isim = args[1];

            if (!link || !isim) {
                 return msg.channel.send(`Lütfen bir bağlantı ve emoji ismi belirtmelisin! __Örn:__ \`${module.exports.Isim} <Bağlantı> <Emoji Ismi>\``).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
            }
        }
        
        // Emoji Yükleme Fonksiyonu Çağrısı
        if (link && isim) {
            EmojiYükle(link, isim, msg);
        } else {
            return msg.channel.send(`Emoji veya geçerli bir bağlantı bulunamadı.`).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
        }
    }
};

/**
 * @param {string} link 
 * @param {string} ad 
 * @param {Message} message 
 */
async function EmojiYükle(link, ad, message) {
    // Emoji oluşturma işlemi
    try {
        const emoji = await message.guild.emojis.create({ attachment: link, name: ad, reason: `${message.author.tag} tarafından yüklendi` });

        // Başarılı embed oluşturma (V14 EmbedBuilder)
        const successEmbed = new EmbedBuilder()
            .setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla \`${emoji.name}\` adında emoji oluşturuldu. (${emoji})`)
            .setColor("Green");

        const sentMessage = await message.channel.send({ embeds: [successEmbed] }).catch(err => {});
        
        // Mesajı silme ve tepki verme
        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : "1516406207248732251").catch(err => {});
        
        if(sentMessage) {
            setTimeout(() => {
                sentMessage.delete().catch(err => {});
            }, 7500);
        }

    } catch (error) {
        console.error("Emoji yükleme hatası:", error);
        
        // Hata mesajı (Örn: Dosya boyutu büyük, sunucu dolu, geçersiz bağlantı vb.)
        let errorMessage = `Emoji yüklenirken bir hata oluştu. Lütfen bağlantının geçerli olduğundan, dosya boyutunun uygun olduğundan (256kb altı) ve sunucuda emoji kotası olduğundan emin olun.`;
        if(error.message.includes("Max number of guild emojis reached")) {
            errorMessage = `Sunucudaki maksimum emoji sayısına ulaşıldı. Yeni emoji eklemek için yer açmalısınız.`;
        } else if (error.message.includes("File cannot be larger than 256.0 kb")) {
            errorMessage = `Dosya boyutu (256KB sınırı) aşıldı. Lütfen daha küçük bir dosya kullanın.`;
        }

        message.channel.send({ content: `${errorMessage}` }).then(x => {
             setTimeout(() => { x.delete().catch(err => {}) }, 7500);
        }).catch(err => {});
    }
}