const { Client, Message, EmbedBuilder } = require("discord.js"); // V14: MessageEmbed yerine EmbedBuilder
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Kullanici = require('../../../../Global/Databases/Client.Users')

// NOT: 'cevaplar' değişkeninin Settings dosyasından geldiği varsayılmıştır.


module.exports = {
    Isim: "toptakipçi",
    Komut: ["toptakip","topfollow"],
    Kullanim: "toptakip",
    Aciklama: "Sunucu genelindeki teyit sıralamasını gösterir.",
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
    let load = await message.reply({content: `${message.guild.name} sunucusuna ait takipçi sıralaması yükleniyor. Lütfen bekleyin!`})
    
    // Tüm kullanıcı verilerini çek
    const all = await Kullanici.find(); 
    
    // Yalnızca takipçi verisi olanları filtrele ve sırala
    let sortedFollowers = all.filter(m => 
        message.guild.members.cache.has(m._id) && m.Follower && m.Follower.length > 0
    ).sort((uye1, uye2) => uye2.Follower.length - uye1.Follower.length);

    let findedIndex = '';

    // İlk 20 kullanıcıyı listeleme
    let topList = sortedFollowers.slice(0, 20).map((value, index) => {
        const member = message.guild.members.cache.get(value._id);
        const memberTag = member ? member.toString() : `<@${value._id}>`;
        
        // Kullanıcı kendi sıralamasını bulmak için
        if (value._id === message.member.id && index >= 20) {
             findedIndex = `\n\` ${index + 1} \` ${memberTag} (takipçi \`${value.Follower ? value.Follower.length : 0}\`, arkadaş \`${value.Friends ? value.Friends.length : 0}\`, beğeni \`${value.Likes ? value.Likes.length : 0}\`, görüntülenme \`${value.Views || 0}\`) **(Siz)**`
        }
        
        return `\` ${index === 0 ? `👑` : index + 1} \` ${memberTag} (takipçi \`${value.Follower ? value.Follower.length : 0}\`, arkadaş \`${value.Friends ? value.Friends.length : 0}\`, beğeni \`${value.Likes ? value.Likes.length : 0}\`, görüntülenme \`${value.Views || 0}\`) ${value._id === message.member.id ? `**(Siz)**` : ``}`
    }).join("\n");
    
    // Kullanıcının sırası ilk 20'de değilse ve verisi varsa findedIndex'i ayarla
    let userRankIndex = sortedFollowers.findIndex(x => x._id === message.member.id);
    if (userRankIndex !== -1 && userRankIndex >= 20) {
        const value = sortedFollowers[userRankIndex];
        const member = message.guild.members.cache.get(value._id);
        const memberTag = member ? member.toString() : `<@${value._id}>`;
        findedIndex = `\n\` ${userRankIndex + 1} \` ${memberTag} (takipçi \`${value.Follower ? value.Follower.length : 0}\`, arkadaş \`${value.Friends ? value.Friends.length : 0}\`, beğeni \`${value.Likes ? value.Likes.length : 0}\`, görüntülenme \`${value.Views || 0}\`) **(Siz)**`;
    }

    let description;
    if (topList.length > 0) {
        description = `Aşağı da **${message.guild.name}** sunucusunun en fazla takipçiye sahip üyeler listelenmektedir.\n\n${topList}${findedIndex}`;
    } else {
        description = `${cevaplar.prefix} ${message.guild.name} Sunucusun da takipçi bilgileri bulunamadı.`;
    }

    // V14 UYUMU: load.edit() ve EmbedBuilder
    load.edit({
        content: null,
        embeds: [new genEmbed().setDescription(description)]
    }).then(x => {
        // V14 UYUMU: Message.delete() promise tabanlıdır
        setTimeout(() => {
          x.delete().catch(err => {})
        }, 20000);
    });
  }
};