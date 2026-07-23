const { Client, Message, EmbedBuilder } = require("discord.js"); // V14: MessageEmbed yerine EmbedBuilder
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Users = require('../../../../Global/Databases/Client.Users');

// NOT: 'ayarlar', 'roller' ve 'cevaplar' değişkenlerinin Settings dosyasından geldiği varsayılmıştır.


module.exports = {
    Isim: "toptaglı",
    Komut: ["toptaglılar"],
    Kullanim: "toptaglı",
    Aciklama: "Sunucu genelindeki en çok taglı üye çekenleri listeler.",
    Kategori: "stat",
    Extend: ayarlar.type,
    
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
    
    // Yorum satırı olan yetki kontrolü bloğu:
    /*
    if(!roller.teyitciRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.Yetkiler.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.Yetkiler.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has('ADMINISTRATOR')) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
    */
    
   // V14 UYUMU: message.reply() obje formatında
   let load = await message.reply({content: `${message.guild.name} sunucusuna ait taglı çekme sıralaması yükleniyor. Lütfen bekleyin!`})
   let findedIndex = ''
   let data = await Users.find()
      
    // Taggeds verisi olanları filtrele ve uzunluğuna göre sırala
    let topTagli = data.filter(x => x.Taggeds && x.Taggeds.length > 0)
        .sort((uye1, uye2) => uye2.Taggeds.length - uye1.Taggeds.length);

    // İlk 20'yi listeleme
    let topList = topTagli.slice(0, 20).map((m, index) => {
        let uyeToplam2 = m.Taggeds.length
        
        return `\`${index + 1}.\` <@${m._id}>: \` ${uyeToplam2} Taglı \` ${m._id == message.member.id ? `**(Siz)**` : ``}`;
    }).join('\n');
    
    // Kullanıcının sırası ilk 20'de değilse, kendi sırasını bul ve ekle
    let userRankIndex = topTagli.findIndex(x => x._id === message.member.id);
    if (userRankIndex !== -1 && userRankIndex >= 20) {
        const m = topTagli[userRankIndex];
        const uyeToplam2 = m.Taggeds.length;
        findedIndex = `\n\`${userRankIndex + 1}.\` <@${m._id}>: \` ${uyeToplam2} Taglı \` **(Siz)**`;
    }

    let description;
    
    if (topList.length > 0) {
        description = `Aşağı da \`${message.guild.name}\` sunucusunun en iyi taglı çekenlerin sıralaması belirtilmiştir.\n\n${topList}${findedIndex}`;
    } else {
        // Hata mesajı için dinamik kontrol
        description = `\`${message.guild.name}\` sunucusun da taglı bilgileri bulunamadı.`;
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