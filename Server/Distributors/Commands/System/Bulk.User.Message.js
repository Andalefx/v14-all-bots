const { 
    Client, 
    Message,
    Collection, // Filtered koleksiyonları yönetmek için
    EmbedBuilder // genEmbed içindeki Embed yapısını temsil eder
} = require("discord.js");

// Varsayımlar: Global değişkenlerin ve Schemaların tanımlı olduğunu varsayıyoruz.
const cmdBans = require('../../../../Global/Databases/Users.Command.Blocks')
const { genEmbed } = require('../../../../Global/İnit/Embed');

// Global Ayarlar
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 


module.exports = {
    Isim: "bulkmessage",
    Komut: ["bulkmessage", "bulkdelete"],
    Kullanim: "bulkmessage <@andale/ID>",
    Aciklama: "Belirtilen üyenin kanaldaki son 100 mesajını siler.",
    Kategori: "-",
    Extend: true,
    
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

        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || (args[0] ? await client.users.fetch(args[0]).catch(e => null) : null);
        
        // Eğer ID ile kullanıcı bulunursa, onu GuildMember'a çevirmeye çalış.
        if (uye && !uye.roles) uye = message.guild.members.cache.get(uye.id);
        
        if(!uye) return message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌');
        
        // Orijinal sonMesajlar fonksiyonu artık burada inline kullanılıyor.
        try {
            await sonMesajlarV14(message, uye.id);
        } catch (error) {
            console.error("Mesajlar silinirken hata oluştu:", error);
            return message.channel.send(`Mesajlar silinirken bir hata oluştu: ${error.message}`).catch(e => {});
        }
        
        message.react(getEmojiID('Onay') ? getEmojiID('Onay') : '✅');
        
        // Başarılı mesajı
        message.channel.send({
            embeds: [
                new genEmbed().setDescription(`${getEmoji('Onay')} **${uye.user ? uye.user.tag : uye.tag}** isimli üyenin ${message.channel} kanalındaki son **100** mesajı başarıyla kaldırıldı.`)
            ]
        }).then(x => {
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 7500);
        }).catch(err => {});
    }
};


/**
 * @param {Message} message 
 * @param {string} id 
 */
async function sonMesajlarV14(message, id) {
    // Son 100 mesajı çek
    let messages = await message.channel.messages.fetch({ limit: 100 });
    
    // Belirtilen kullanıcıya ait mesajları filtrele ve 100 tanesini al (Zaten limit 100 olduğu için splice/slice teknik olarak gereksizdir, ancak orijinal mantığı koruruz)
    let filteredMessages = messages
        .filter((x) => x.author.id === id);
        
    // V14'te bulkDelete bir Collection bekler, bu yüzden Collection'ı doğrudan geçirebiliriz.
    // Ancak Discord'un kuralı gereği 14 günden eski mesajlar bu metotla silinemez.
    // Orijinal kodda da bu kural geçerliydi.
    
    // Not: Orijinal kodunuzda .array().splice(0, 100) vardı. V14'te bu .filter() veya .map() olarak Collection üzerinde kalır.
    // BulkDelete metodu Collection'ı kabul ettiği için filtrelediğimiz Collection'ı kullanıyoruz.
    
    if (filteredMessages.size > 0) {
        await message.channel.bulkDelete(filteredMessages, true) // İkinci parametre (true) silinmeyecek mesajları görmezden gelmeyi sağlar.
            .catch(error => {
                // Eğer silme işlemi başarısız olursa (örn: 14 günden eski mesaj), hata fırlatılır.
                throw new Error(`Mesaj silme başarısız: ${error.message}`);
            });
    }
}