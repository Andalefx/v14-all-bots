const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine EmbedBuilder
} = require("discord.js");

// Varsayımlar: Global değişkenlerin tanımlı olduğunu varsayıyoruz.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const { guildBackup } = require('../../../../Global/İnit/Guild.Sync'); // Orijinal ismi korundu

// Emojiler ve ayarlar global değişkenlerden geliyor.
const ayarlar = global.ayarlar || { staff: [] }; // Yetkili ID'leri
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 


module.exports = {
    Isim: "sync",
    Komut: ["senk","senkronizasyon"],
    Kullanim: "sync",
    Aciklama: "Sunucunun rol ve kanal verilerini manuel olarak yedekleyip günceller (Sync).",
    Kategori: "-",
    Extend: false,
    
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array<String>} args 
     */
    onRequest: async function (client, message, args) {
        
        // --- DM KONTROLÜ ---
        if (!message.guild || !message.member) return;
        
        // Emoji Erişimi için Güvenli Fonksiyon
        const reactEmoji = (emojiName) => {
            const emoji = emojiler[emojiName];
            if (!emoji) return emojiName === 'Onay' ? '✅' : '❌'; // Fallback
            
            if (message.guild.emojis.cache.has(emoji)) {
                return message.guild.emojis.cache.get(emoji).id;
            }
            return emoji; 
        }

        // Yetki Kontrolü
        if(!ayarlar.staff.includes(message.member.id)) {
            // Yetkisi yoksa tepki vermeden veya uyarı vermeden sessizce dönebilir
            // Orijinal kodda tepki yoktu, biz de eklemiyoruz.
            return;
        }

        const embed = new genEmbed();
        
        try {
            // 1. İşlem: Kanal ve Rol Verilerini Senkronize Etme/Yedekleme
            await guildBackup.guildChannels();
            await guildBackup.guildRoles();

            // 2. Başarılı Mesajını Gönderme
            const onayEmoji = reactEmoji('Onay');
            
            message.channel.send({
                embeds: [
                    embed.setDescription(`${onayEmoji} Başarıyla **${message.guild.name}** sunucusunun rol ve kanal senkronizasyonu güncellendi.`)
                ]
            })
            .then(x => {
                setTimeout(() => {
                    x.delete().catch(err => {})
                }, 8500);
            })
            .catch(err => {
                console.error("Geri bildirim mesajı gönderilirken hata oluştu:", err);
            });
            
            // 3. Mesaja Tepki Verme
            message.react(onayEmoji).catch(err => {});
            
            // 4. Logger ile Kayıt Etme (Fonksiyonun varlığını koruyoruz)
            if (client.logger && client.logger.log) {
                 client.logger.log(`ROL => Manuel olarak senkronizasyon işlemi gerçekleştirildi. (${message.author.tag})`, "backup");
            }

        } catch (error) {
            console.error("Senkronizasyon sırasında kritik hata:", error);
            message.reply("Senkronizasyon işlemi sırasında bir hata oluştu. Konsolu kontrol edin.");
            message.react(reactEmoji('Iptal')).catch(err => {});
        }
    }
};