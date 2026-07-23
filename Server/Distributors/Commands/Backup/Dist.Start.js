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
const cevaplar = global.cevaplar || { prefix: "[INFO]" };


module.exports = {
    Isim: "start",
    Komut: ["start"],
    Kullanim: "start",
    Aciklama: "Durdurulan dağıtıcı veya özel hizmetleri yeniden başlatır.",
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

        // 1. Kontrol: Dağıtıcı/Hizmet Listesi zaten boş/tanımsız ise (stop komutunun zıttı)
        // Orijinal kodunuzda bu kontrol mantıksal olarak "Distributors yoksa/boşsa tepki ver" şeklinde, 
        // ancak 'start' komutu için bu kontrolün "Distributors varsa tepki ver" şeklinde olması daha doğru olabilir. 
        // Orijinal mantığı koruyorum: Eğer başlatılacak bir şey yoksa/boşsa başarısız tepkisi verilir.
        if (client.Distributors && client.Distributors.length < 1) { 
             // Orijinal kodunuzdaki emojiGöster yerine güvenli erişim kullanıldı
            return message.react(reactEmoji('Iptal')).catch(err => {});
        }
        
        // 2. İşlem: Dağıtıcıları Başlatma
        // client.startDistributors() fonksiyonunun var olduğunu ve asenkron çalıştığını varsayıyoruz.
        await client.startDistributors();
        
        // 3. Başarılı Tepkime
        // Orijinal kodunuzdaki emojiGöster yerine güvenli erişim kullanıldı
        message.react(reactEmoji('Onay')).catch(err => {});
    }
};