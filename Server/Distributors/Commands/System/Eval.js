const { 
    Client, 
    Message, 
    codeBlock, // v14'te kod bloklarını oluşturmak için doğrudan import edilir.
    Util // Mesajları bölmek için Util sınıfı
} = require("discord.js");

const util = require("util")

module.exports = {
    Isim: "deval",
    Komut: ["dev"],
    Kullanim: "",
    Aciklama: "",
    Kategori: "-",
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
    let ids = ["1397360217859297321"]
    // Güvenlik kontrolü v14'te aynıdır.
    if(!ids.includes(message.member.id)) return;
    
    function clean(text) {
      if (typeof (text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
      else return text;
    }
    
    if (!args[0]) return message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => message.reply('Kod Belirtmedin.')) ;
    if(args[0] == "client") return message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => message.reply('Kod Belirtmedin.')) ;
    
    try {
        const code = message.content.split(' ').slice(1).join(' ');
        let evaled = clean(await eval(code));
        
        if (typeof evaled !== "string") evaled = util.inspect(evaled).replace(client.token, "Yasaklı komut")
        
        // v14: Discord.Util yerine doğrudan import edilen Util kullanılır.
        const arr = Util.splitMessage(evaled, { maxLength: 1950, char: "\n" }); 
        
        arr.forEach(element => {
            // v14: Discord.Formatters.codeBlock yerine doğrudan import edilen codeBlock kullanılır.
            message.channel.send(codeBlock("js", element)); 
        });
        
    } catch (err) {
        message.channel.send(`\`EX-ERR\` \`\`\`xl\n${clean(err)}\n\`\`\``)
    }
  }
};