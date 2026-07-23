const { Client, Message, EmbedBuilder } = require("discord.js"); // V14: MessageEmbed yerine EmbedBuilder
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Users = require('../../../../Global/Databases/Client.Users');
const moment = require('moment');
require('moment-duration-format'); // moment-duration-format'ın global olarak yüklü olduğu varsayılır.

// NOT: 'cevaplar' değişkeninin Settings dosyasından geldiği varsayılmıştır.


module.exports = {
    Isim: "topstreaming",
    Komut: ["topyayın","topstream","topyayın","yayınsıralaması","topstreamer"],
    Kullanim: "topstreaming",
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
    let load = await message.reply({content: `${message.guild.name} sunucusuna ait yayın açma sıralaması yükleniyor. Lütfen bekleyin!`})
    
    let embed = new genEmbed() // genEmbed'in EmbedBuilder'dan türediği varsayılır.
    let findedIndex = ''
    let data = await Users.find()

    // Yayın süresini hesaplayan yardımcı fonksiyon
    const calculateStreamingTime = (user) => {
        if (!user.Streaming) return 0;
        let totalTime = 0;
        user.Streaming.forEach(x => {
            // End ve Start değerlerinin varlığını kontrol et
            if (x.End && x.Start) {
                totalTime += Number(x.End - x.Start);
            }
        });
        return totalTime;
    };
     
    // Yayın verisi olanları filtrele ve süreye göre sırala
    let topStreamers = data.filter(x => x.Streaming && calculateStreamingTime(x) > 0)
        .sort((uye1, uye2) => calculateStreamingTime(uye2) - calculateStreamingTime(uye1));
    
    // İlk 20'yi map'le
    let topList = topStreamers.slice(0, 20).map((m, index) => {
        let uyeToplam2 = calculateStreamingTime(m);
        let formattedTime = moment.duration(uyeToplam2).format('Y [yıl,] M [ay,] d [gün,] h [saat,] m [dakika] s [saniye]');
        
        // Bu bölüm, ilk 20'de olmayan kullanıcının sırasını bulmak için ana listenin tamamında aramalıydı.
        // Ancak slice(0, 20) sadece ilk 20'yi döndürdüğü için, findedIndex'i ayrıca kontrol edeceğiz.
        
        return `\`${index + 1}.\` <@${m._id}>: \`${formattedTime}\` ${m._id == message.member.id ? `**(Siz)**` : ``}`;
    }).join('\n');

    // Kullanıcının sırası ilk 20'de değilse, kendi sırasını bulup ekle
    let userRankIndex = topStreamers.findIndex(x => x._id === message.member.id);
    if (userRankIndex !== -1 && userRankIndex >= 20) {
        const m = topStreamers[userRankIndex];
        const uyeToplam2 = calculateStreamingTime(m);
        const formattedTime = moment.duration(uyeToplam2).format('Y [yıl,] M [ay,] d [gün,] h [saat,] m [dakika] s [saniye]');
        
        findedIndex = `\n\`${userRankIndex + 1}.\` <@${m._id}>: \`${formattedTime}\` **(Siz)**`;
    }

    let description;
    
    if (topList.length > 0) {
        description = `Aşağı da **${message.guild.name}** sunucusunda en iyi yayın süresine sahip olan 20 üye aşağıda sıralandırılmaktadır.\n\n${topList}${findedIndex}`;
    } else {
        description = `${cevaplar.prefix} ${message.guild.name} Sunucusun da yayın süresi bulunan bir veya birden fazla üye bulunamadı.`;
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