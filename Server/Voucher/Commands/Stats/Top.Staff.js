const { Client, Message, EmbedBuilder } = require("discord.js"); // V14: MessageEmbed yerine EmbedBuilder
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Users = require('../../../../Global/Databases/Client.Users');

// NOT: 'cevaplar' değişkeninin Settings dosyasından geldiği varsayılmıştır.


module.exports = {
  Isim: "topyetkili",
  Komut: ["topyetkililer"],
  Kullanim: "topyetkili",
  Aciklama: "",
  Kategori: "stat",
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
    // V14 UYUMU: message.reply() obje formatında
    let load = await message.reply({content: `${message.guild.name} sunucusuna ait yetkili çekme sıralaması yükleniyor. Lütfen bekleyin!`})
    
    let embed = new genEmbed() // genEmbed'in EmbedBuilder'dan türediği varsayılır.
    let findedIndex = ''
    
    // Verileri çek ve filtrele (Sadece Staffs verisi olanlar)
    let data = await Users.find()
    let topTagli = data.filter(x => x.Staffs && x.Staffs.length > 0)
        // Sıralama (Staffs dizisinin uzunluğuna göre)
        .sort((uye1, uye2) => uye2.Staffs.length - uye1.Staffs.length);
        
    // İlk 20'yi map'le ve findedIndex'i kontrol et
    let topList = topTagli.slice(0, 20).map((m, index) => {
        let uyeToplam2 = m.Staffs.length
        
        // Kullanıcı ilk 20'de değilse ve kendi sırasını buluyorsa
        if(m._id === message.author.id && (index + 1) > 20) {
            findedIndex = `\n\`${index + 1}.\` <@${m._id}>: \` ${uyeToplam2} Yetkili \` **(Siz)**`;
        }
        
        return `\`${index + 1}.\` <@${m._id}>: \` ${uyeToplam2} Yetkili \` ${m._id === message.member.id ? `**(Siz)**` : ``}`;
    }).join('\n');
    
    // Kullanıcının sırası ilk 20'de değilse ve listede varsa, tekrar bul ve findedIndex'i ayarla
    let userRankIndex = topTagli.findIndex(x => x._id === message.member.id);
    if (userRankIndex !== -1 && userRankIndex >= 20) {
        const m = topTagli[userRankIndex];
        const uyeToplam2 = m.Staffs.length;
        findedIndex = `\n\`${userRankIndex + 1}.\` <@${m._id}>: \` ${uyeToplam2} Yetkili \` **(Siz)**`;
    }

    let description;
    
    if (topList.length > 0) {
        description = `Aşağı da **${message.guild.name}** sunucusunun en iyi yetki çekenlerin sıralaması belirtilmiştir.\n\n${topList}${findedIndex}`;
    } else {
        description = `${cevaplar.prefix} ${message.guild.name} Sunucusun da yetkili bilgileri bulunamadı.`;
    }

    // V14 UYUMU: load.edit() ve EmbedBuilder
    load.edit({
        content: null, 
        embeds: [embed.setDescription(description)]
    }).then(x => {
        // V14 UYUMU: Message.delete() promise tabanlıdır
        setTimeout(() => {
          x.delete().catch(err => {})
        }, 20000);
    })
  
  }
};