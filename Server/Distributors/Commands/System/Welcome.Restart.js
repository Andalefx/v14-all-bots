const { 
    Client, 
    Message, 
    EmbedBuilder 
} = require("discord.js");
const children = require("child_process"); // PM2 komutunu çalıştırmak için
const { genEmbed } = require('../../../../Global/İnit/Embed'); // genEmbed varsayımı

// Global Ayarlar
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 


module.exports = {
    Isim: "welcome-restart",
    Komut: ["w-r","wrest","welrest","welcome-r"],
    Kullanim: "welcome-restart",
    Aciklama: "Hoş geldin ses botlarını PM2 üzerinden yeniden başlatır.",
    Kategori: "-",
    Extend: false, // Orijinal kodda Extend yoktu, default false kullandım
    
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array<String>} args 
     */
    onRequest: async function (client, message, args) {
        
        // --- DM KONTROLÜ ---
        if (!message.guild || !message.member) return;

        // Emoji Erişimi için Güvenli Fonksiyon
        const getEmoji = (emojiName) => {
             const emoji = emojiler[emojiName];
             if (message.guild.emojis.cache.has(emoji)) {
                 return message.guild.emojis.cache.get(emoji).toString();
             }
             return emojiName === 'Onay' ? '✅' : '❌';
        }
        const getEmojiID = (emojiName) => {
             const emoji = emojiler[emojiName];
             if (message.guild.emojis.cache.has(emoji)) {
                 return message.guild.emojis.cache.get(emoji).id;
             }
             return undefined; 
        }

        // İlk bekleme mesajını gönder
        let load = await message.reply({ content: `Hoş geldin botları yeniden başlatılırken. Lütfen bekleyin.` }).catch(e => null);
        
        if (!load) return;

        try {
            // PM2 komutunu çalıştır
            const ls = children.exec(`pm2 restart Voices`);
            
            // Komut çıktığında veya başarıyla tamamlandığında
            ls.stdout.on('data', function (data) {
                // Mesajı düzenle
                load.edit({ content: `Başarıyla hoş geldin ses botları yeniden başlatıldı. ${getEmoji('Onay')}` })
                    .then(x => {
                        // Mesaja tepki ekle
                        message.react(getEmojiID('Onay') ? getEmojiID('Onay') : '✅').catch(err => {});
                        
                        // Belirli bir süre sonra mesajı sil
                        setTimeout(() => {
                            x.delete().catch(err => {});
                        }, 7500);
                    })
                    .catch(e => {
                        console.error("Mesaj düzenlenirken hata oluştu:", e);
                    });
            });

            // Hata yakalama (PM2 komutu başarısız olursa)
            ls.stderr.on('data', function (data) {
                 load.edit({ content: `PM2 komutu çalıştırılırken bir hata oluştu: \`\`\`${data}\`\`\`` }).catch(e => {});
                 message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌').catch(err => {});
            });

        } catch (error) {
            console.error("PM2 yeniden başlatma hatası:", error);
            load.edit({ content: `Yeniden başlatma işlemi sırasında beklenmeyen bir hata oluştu.` }).catch(e => {});
        }
    }
};