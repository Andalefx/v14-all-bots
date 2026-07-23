const { Client, Message, EmbedBuilder } = require("discord.js"); 
// Discord.js v14'te Embedler için EmbedBuilder import edilir.

const cmdBans = require('../../../../Global/Databases/Users.Command.Blocks')
const { genEmbed } = require('../../../../Global/İnit/Embed'); 
// genEmbed fonksiyonunun v14 EmbedBuilder döndürecek şekilde güncellendiği varsayılmıştır.

module.exports = {
    Isim: "safecmd",
    Komut: ["scmd", "scom "],
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
    // Member arama ve alma işlemi v14'te de aynıdır (GuildMembers intenti açık varsayılır).
    let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    
    // Kullanıcı bulunamazsa reaksiyon.
    if(!uye) return message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined)
    
    // Veritabanı işlemi aynıdır.
    await cmdBans.findByIdAndDelete(uye.id)
    
    // Başarılı reaksiyon.
    message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined)
    
    // Embed gönderme yöntemi (embeds: [...]) v14'te de geçerlidir.
    message.channel.send({
        embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla ${uye} isimli üyenin \`${message.guild.name}\` sunucusunda ki komut yasağı \`${tarihsel(Date.now())}\` tarihinde kaldırıldı.`)]
    })
    
    // Log kanalı ve log mesajı aynıdır.
    let logLa = message.guild.kanalBul("safe-command-log")
    if(logLa) logLa.send(({
        embeds: [new genEmbed().setDescription(`${uye} isimli üyenin \`${message.guild.name}\` sunucusunda ki komut yasağı ${message.member} tarafından \`${tarihsel(Date.now())}\` tarihinde kaldırıldı.`)]
    }))
  }
};