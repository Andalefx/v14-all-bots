const { Client, Message, EmbedBuilder } = require("discord.js"); // v14: MessageEmbed -> EmbedBuilder
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "rolsuzver123",
    Komut: ["rolsüzver123"],
    Kullanim: "rolsüzver123",
    Aciklama: "",
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
    let embed = new genEmbed()
    
    // İzin kontrolü v14'te de geçerlidir.
    if(!roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has('ADMINISTRATOR')) return message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined)
    
    // Rolü olmayan üyeleri filtreleme. message.guild.id aynı zamanda @everyone rolünün ID'sidir.
    let rolsuzuye =  message.guild.members.cache.filter(m => m.roles.cache.filter(r => r.id !== message.guild.id).size == 0);
    
    rolsuzuye.forEach(roluolmayanlar => { 
        // setRoles metodu v14'te de geçerlidir ve kullanıcının tüm rollerini kayıtsız rolleriyle değiştirir.
        roluolmayanlar.setRoles(roller.kayıtsızRolleri).catch(err => {}) 
    });
    
    message.channel.send({embeds: [embed.setDescription(`Sunucuda rolü olmayan \`${rolsuzuye.size}\` üyeye kayıtsız rolü verilmeye başlandı!`)]}).then(x => {
        setTimeout(() => {
            x.delete()
        }, 7500);
    })

    message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined)
    }
};