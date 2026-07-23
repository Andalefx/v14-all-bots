const { Client, Message, Util, Formatters } = require("discord.js");
const util = require("util"); // Node.js'in util modülü (inspect için)
// Global değişkenlerin doğru import edildiği varsayılmıştır (emojiler).
const { emojiler } = global;

module.exports = {
    Isim: "eval",
    Komut: ["ev"],
    Kullanim: "eval <code>",
    Aciklama: "Belirlenen JavaScript kodunu bot üzerinden çalıştırır.",
    Kategori: "-",
    Extend: false,
    
    /**
    * @param {Client} client 
    */
    onLoad: function (client) {
        // Bu komut için yükleme işlemi yok.
    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, message, args) {
        // YALNIZCA BELİRLENEN ID'LER İÇİN ERİŞİM (GÜVENLİK!)
        let ids = ["1397360217859297321", ""]; 
        
        if (!ids.includes(message.author.id)) return; // message.member.id yerine message.author.id kullanmak daha güvenlidir.

        function clean(text) {
            if (typeof (text) === "string") 
                // String.fromCharCode(8203) -> ZWS (Zero Width Space)
                return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
            else 
                return text;
        }

        if (!args[0]) {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
            return message.reply({ content: 'Kod Belirtmedin.' }).then(x => setTimeout(() => x.delete().catch(err => {}), 5000));
        }
        
        // Güvenlik: Token'ı gizle
        const botToken = client.token;
        
        try {
            const code = message.content.split(' ').slice(1).join(' ');
            
            // Eval işlemini yap
            let evaled = await eval(code);
            
            // Eğer çıktı string değilse, okunabilir hale getir
            if (typeof evaled !== "string") {
                evaled = util.inspect(evaled, { depth: 0 });
            }
            
            // Bot tokenını çıktıdan gizle
            evaled = clean(evaled).replace(botToken, "[BOT TOKEN GİZLENDİ]");

            // Mesajı 2000 karakter sınırına göre böl (V14'te Util.splitMessage kullanılır)
            const arr = Util.splitMessage(evaled, { 
                maxLength: 1950, 
                char: "\n",
                prepend: '```js\n',
                append: '\n```'
            });

            // Her parçayı ayrı mesaj olarak gönder
            arr.forEach(element => {
                // V14'te Formatters.codeBlock kullanılabilir
                message.channel.send({ content: Formatters.codeBlock("js", element) }).catch(err => {});
            });

        } catch (err) {
            // Hata oluşursa hatayı gönder
            message.channel.send(`\`EX-ERR\` ${Formatters.codeBlock("xl", clean(err))}`).catch(err => {});
        }
    }
};