const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine EmbedBuilder
} = require("discord.js");

// Varsayımlar: Global değişkenlerin tanımlı olduğunu varsayıyoruz.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const { guildBackup } = require('../../../../Global/İnit/Guild.Backup');

// Emojiler global değişkenden geliyor.
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 


module.exports = {
    Isim: "backup",
    Komut: ["yedekal"],
    Kullanim: "backup",
    Aciklama: "Sunucunun tüm kanal ve rol yedeklerini manuel olarak alır.",
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
        
        const embed = new genEmbed()
        
        // Emoji Erişimi için Güvenli Fonksiyon (Özel emoji ID'sini veya unicode'u döner)
        const reactEmoji = (emojiName) => {
            const emoji = emojiler[emojiName];
            if (!emoji) return emojiName === 'Onay' ? '✅' : '❌'; // Fallback
            
            // Eğer emoji bir ID ise, cache'ten bulmayı deneriz.
            if (message.guild.emojis.cache.has(emoji)) {
                return message.guild.emojis.cache.get(emoji).id;
            }
            return emoji; // Eğer unicode ise veya ID bulunamazsa kendisini döner
        }

        try {
            // 1. İşlem: Yedeklemeyi Başlatma
            await guildBackup.guildChannels();
            await guildBackup.guildRoles();

            // 2. Başarılı Mesajını Gönderme
            // message.guild.emojiGöster(emojiler.Onay) yerine güvenli erişim kullanıldı.
            const onayEmoji = reactEmoji('Onay') === '✅' ? '✅' : message.guild.emojis.cache.get(reactEmoji('Onay'));
            
            message.channel.send({
                embeds: [
                    embed.setFooter({ text: "dilediğiniz zaman istediğiniz tarihin yedeğini tekrardan kurabilirsiniz." })
                         .setDescription(`${onayEmoji} Başarıyla \`${message.guild.name}\` sunucusunun kanal ve rol yedeklemesi <t:${String(Date.now()).slice(0, 10)}:R> alındı ve kayıtlara işlendi.`)
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
            message.react(reactEmoji('Onay')).catch(err => {});
            
            // 4. Logger ile Kayıt Etme (Fonksiyonun varlığını koruyoruz)
            if (client.logger && client.logger.log) {
                 client.logger.log(`ROL => Manuel olarak backup işlemi gerçekleştirildi. (${message.author.tag})`, "backup");
            }

        } catch (error) {
            console.error("Yedekleme sırasında kritik hata:", error);
            message.reply("Yedekleme işlemi sırasında bir hata oluştu. Konsolu kontrol edin.");
            message.react(reactEmoji('Iptal')).catch(err => {});
        }
    }
};