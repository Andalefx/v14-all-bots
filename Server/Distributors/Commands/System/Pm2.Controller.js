const { Client, Message, Util, Formatters } = require("discord.js"); // v14 import yapısı
const children = require("child_process");

module.exports = {
    Isim: "pm2",
    Komut: ["pm2-controller"],
    Kullanim: "",
    Aciklama: "",
    Kategori: "-",
    
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
    // Kullanıcı ID'lerini kontrol eden kısım aynı kalır.
    let ids = ["1397360217859297321"]
    if(!ids.includes(message.member.id)) return;
    
    // child_process kullanımı aynı kalır.
    const ls = children.exec(`pm2 ${args.join(' ')}`);
    
    ls.stdout.on('data', function (data) {
        // v14: Discord.Util.splitMessage -> Util.splitMessage (Eğer üstteki importta varsa)
        // Ya da doğrudan Discord.Util.splitMessage olarak erişim sağlanabilir, ancak 
        // daha temiz bir v14 importu için Util'i çektik.
        
        const arr = Util.splitMessage(data, { maxLength: 1950, char: "\n" });
        
        arr.forEach(element => {
            // v14: Discord.Formatters.codeBlock -> Formatters.codeBlock
            message.channel.send(Formatters.codeBlock("js", element));
        });
    });
    // Hata durumunu da ekleyelim (önerilen pratik)
    ls.stderr.on('data', function (data) {
        const arr = Util.splitMessage(data, { maxLength: 1950, char: "\n" });
        arr.forEach(element => {
            message.channel.send(Formatters.codeBlock("bash", "HATA:\n" + element));
        });
    });
  }
};