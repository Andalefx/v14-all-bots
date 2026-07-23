const { Client, Message, EmbedBuilder } = require("discord.js"); // V14: MessageEmbed yerine EmbedBuilder
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Kullanici = require('../../../../Global/Databases/Client.Users')

// NOT: 'cevaplar' değişkeninin Settings dosyasından geldiği varsayılmıştır.


module.exports = {
    Isim: "topteyit",
    Komut: ["Topteyit"],
    Kullanim: "topteyit",
    Aciklama: "Sunucu genelindeki teyit sıralamasını gösterir.",
    Kategori: "teyit",
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
    let load = await message.reply({content: `${message.guild.name} sunucusuna ait teyit sıralaması yükleniyor. Lütfen bekleyin!`})
    
    // Tüm kullanıcı verilerini çek
    const all = await Kullanici.find();
    
    let findedIndex = '';
    
    // Yalnızca kayıt verisi olanları filtrele ve sırala
    let sortedRecords = all.filter(m => m.Records && m.Records.length > 0)
        .sort((uye1, uye2) => uye2.Records.length - uye1.Records.length);
    
    // İlk 20 kullanıcıyı listeleme
    let teyitList = sortedRecords.slice(0, 20)
        .map((value, index) => {
            const totalRecords = value.Records.filter(v => v.Gender === "Erkek").length + value.Records.filter(v => v.Gender === "Kadın").length;
            const memberTag = message.guild.members.cache.has(value._id) ? message.guild.members.cache.get(value._id).toString() : `<@${value._id}>`;
            const isAuthor = value._id === message.member.id ? `**(Siz)**` : ``;

            return `\`${index + 1}.\` ${memberTag} toplam **${totalRecords}** üye kayıt etti. (${value.Records.filter(v => v.Gender === "Erkek").length || 0} Erkek, ${value.Records.filter(v => v.Gender === "Kadın").length || 0} Kadın) ${isAuthor}`;
        }).join("\n");

    // Kullanıcının sırası ilk 20'de değilse, kendi sırasını bulup ekle
    let userRankIndex = sortedRecords.findIndex(x => x._id === message.member.id);
    
    if (userRankIndex !== -1 && userRankIndex >= 20) {
        const value = sortedRecords[userRankIndex];
        const totalRecords = value.Records.filter(v => v.Gender === "Erkek").length + value.Records.filter(v => v.Gender === "Kadın").length;
        const memberTag = message.guild.members.cache.has(value._id) ? message.guild.members.cache.get(value._id).toString() : `<@${value._id}>`;

        findedIndex = `\n\`${userRankIndex + 1}.\` ${memberTag} toplam **${totalRecords}** üye kayıt etti. (${value.Records.filter(v => v.Gender === "Erkek").length || 0} Erkek, ${value.Records.filter(v => v.Gender === "Kadın").length || 0} Kadın) **(Siz)**`;
    }

    let description;
    
    if (teyitList.length > 0) {
        description = `Aşağı da **${message.guild.name}** sunucusunun en iyi kayıt yapanların sıralaması belirtilmiştir.\n\n${teyitList}${findedIndex}`;
    } else {
        description = `${cevaplar.prefix} ${message.guild.name} Sunucusun da teyit bilgileri bulunamadı.`;
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