const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine EmbedBuilder
} = require("discord.js");

// Varsayımlar: Global değişkenlerin tanımlı olduğunu varsayıyoruz.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const { guildBackup } = require('../../../../Global//İnit/Guild.Backup');

// Emojiler global değişkenden geliyor.
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 
const cevaplar = global.cevaplar || { prefix: "[INFO]" };


module.exports = {
    Isim: "stop",
    Komut: ["close"],
    Kullanim: "stop",
    Aciklama: "Bot üzerindeki dağıtıcı veya özel hizmetleri durdurur.",
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
        
        // Emoji Erişimi için Güvenli Fonksiyon (Eğer emoji bir ID ise veya unicode ise)
        const reactEmoji = (emojiName) => {
            const emojiID = emojiler[emojiName];
            if (message.guild.emojis.cache.has(emojiID)) {
                return message.guild.emojis.cache.get(emojiID).id;
            }
            return emojiID || (emojiName === 'Onay' ? '✅' : '❌'); // Fallback
        }

        // 1. Kontrol: Dağıtıcı/Hizmet Listesi Boş mu?
        if (client.Distributors && client.Distributors.length < 1) {
            return message.react(reactEmoji('Iptal')).catch(err => {});
        }
        
        // 2. İşlem: Dağıtıcıları Kapatma
        // client.closeDistributors() fonksiyonunun var olduğunu ve asenkron çalıştığını varsayıyoruz.
        await client.closeDistributors();
        
        // 3. Başarılı Tepkime
        message.react(reactEmoji('Onay')).catch(err => {});
        
        // 4. Global ve Client listesini temizleme
        global.Distributors = client.Distributors = [];
    }
};