const { 
    Client, 
    Message 
} = require("discord.js");

// Varsayımlar: Global değişkenlerin ve Schemaların tanımlı olduğunu varsayıyoruz.
// Orijinalde cmdBans olarak import edilen schema, büyük ihtimalle yetki salma kayıtlarını tutuyor.
const StaffRemovals = require('../../../../Global/Databases/Guıild.Remove.Staffs');
const { genEmbed } = require('../../../../Global/İnit/Embed');

// Global Ayarlar
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 
const tarihsel = global.tarihsel || ((date) => new Date(date).toLocaleString()); 

module.exports = {
    Isim: "haksıfırla",
    Komut: ["hak-sıfırla", "hak"],
    Kullanim: "hak-sıfırla <@andale/ID>",
    Aciklama: "Belirtilen üyenin yetki salma haklarını sıfırlar.",
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

        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if(!uye) return message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌');
        
        // Veritabanından üyeye ait kaydı sil (Hak sıfırlama)
        await StaffRemovals.findByIdAndDelete(uye.id).catch(e => {
             console.error(`Hak sıfırlanırken hata oluştu: ${e.message}`);
        });

        // Başarılı tepki ve mesaj
        message.react(getEmojiID('Onay') ? getEmojiID('Onay') : '✅');
        
        message.channel.send({
            embeds: [
                new genEmbed().setDescription(`${getEmoji('Onay')} Başarıyla **${uye.user.tag}** isimli üyenin \`${message.guild.name}\` sunucusundaki yetki salma hakları \`${tarihsel(Date.now())}\` tarihinde **sıfırlandı**.`)]
        });
    }
};