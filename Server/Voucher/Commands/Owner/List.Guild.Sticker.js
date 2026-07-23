const { Client, Message, Util, Formatters, PermissionFlagsBits } = require("discord.js");

// Global değişkenlerin doğru import edildiği varsayılmıştır (ayarlar, roller, cevaplar).
const { ayarlar, roller, cevaplar } = global;

module.exports = {
    Isim: "cıkartmalistele",
    Komut: ["stickerid", "cıkartmalar", "stickerlist"],
    Kullanim: "cıkartmalistele",
    Aciklama: "Sunucudaki tüm çıkartmaları (sticker) ID'leri, isimleri ve URL'leri ile birlikte listeler.",
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
        // İzin Kontrolü (Emoji komutunda kullanılan izin kontrolünü koruruz)
        const hasPermission = ayarlar.staff.includes(message.member.id) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)));
                              
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Çıkartmaları (stickers) ID, isim ve URL'leriyle birlikte listele
        // Not: Çıkartmaların mesajda direkt gösterimi mümkün değildir, bu yüzden isim ve URL (veya ID) kullanılır.
        let veri = message.guild.stickers.cache.map(sticker => 
            `(${sticker.id}) ${sticker.name} -> URL: ${sticker.url}`
        ).join('\n');
        
        if (!veri) {
             return message.channel.send("Bu sunucuda hiç özel çıkartma (sticker) bulunmuyor.");
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