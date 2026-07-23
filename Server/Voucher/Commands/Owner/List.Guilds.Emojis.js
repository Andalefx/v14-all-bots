const { Client, Message, Util, Formatters, PermissionFlagsBits } = require("discord.js");

// Global değişkenlerin doğru import edildiği varsayılmıştır (ayarlar, roller, cevaplar).
const { ayarlar, roller, cevaplar } = global;

module.exports = {
    Isim: "emojilistele",
    Komut: ["emojiid", "emojiler"],
    Kullanim: "emojilistele",
    Aciklama: "Sunucudaki tüm emojileri ID'leri ile birlikte listeler.",
    Kategori: "kurucu",
    Extend: true,
    
    /**
    * @param {Client} client 
    */
    onLoad: function (client) {

    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, message, args) {
        // İzin Kontrolü
        const hasPermission = ayarlar.staff.includes(message.member.id) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)));
                              
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Emojileri ID ve etiketleriyle birlikte listele
        // Not: `emoji.toString()` V14'te `emoji.url` veya `emoji.name` yerine emojinin mesajda görünür etiketini (<:name:id> veya <a:name:id>) döndürür.
        let veri = message.guild.emojis.cache.map(emoji => `(${emoji.id}) ${emoji.toString()}`).join('\n');
        
        if (!veri) {
             return message.channel.send("Bu sunucuda hiç özel emoji bulunmuyor.");
        }
        
        // Mesajı 2000 karakter sınırına göre böl (V14 Util.splitMessage)
        const arr = Util.splitMessage(veri, { 
            maxLength: 1950, 
            char: "\n",
            prepend: '```diff\n',
            append: '\n```'
        });

        // Her parçayı ayrı mesaj olarak gönder
        arr.forEach(element => {
            // V14 Formatters.codeBlock kullanımı
            message.channel.send({ content: Formatters.codeBlock("diff", element) }).catch(err => {});
        });
    }
};