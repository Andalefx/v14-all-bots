const { Client, Message, ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const Users = require('../../../../Global/Databases/Client.Users');
// NOT: genEmbed yerine EmbedBuilder kullanmak daha doğru olur, ancak mevcut kod yapısına uyması için aşağıdaki varsayımlar yapılmıştır.
// const { genEmbed } = require("../../../../Global/Init/Embed"); 
// `ayarlar`, `cevaplar` ve `emojiler` değişkenlerinin import edildiği varsayılmıştır.
const ayarlar = require("../../../../Global/Settings/System.json") 
const cevaplar = require("../../../../Global/Settings/Reply") 
const emojiler = require("../../../../Global/Settings/Emoji.json") 


module.exports = {
  Isim: "envanter",
  Komut: ["sonalımlar","sonsatınalımlar","satınalımlar","satınalınanlar"],
  Kullanim: "envanter <@andale/ID>",
  Aciklama: "Belirlenen veya komutu kullanan kişi belirlediği taglı sayısını ve en son belirlediği taglı sayısını gösterir.",
  Kategori: "eco",
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
    let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]) || message.member;
    if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
    uye = message.guild.members.cache.get(uye.id)
    
    // V14: ButtonBuilder ve ButtonStyle kullanımı
    const button1 = new ButtonBuilder()
                .setCustomId('geri')
                .setLabel('◀ Geri')
                .setStyle(ButtonStyle.Primary);
    
    const buttonkapat = new ButtonBuilder()
                .setCustomId('kapat')
                .setEmoji("929001437466357800") 
                .setStyle(ButtonStyle.Danger);
                
    const button2 = new ButtonBuilder()
                .setCustomId('ileri')
                .setLabel('İleri ▶')
                .setStyle(ButtonStyle.Primary);
    
    // V14: Mongoose sorgusu async/await ile yapıldı
    const res = await Users.findOne({_id: uye.id }).catch(err => {
        console.error("Mongoose FindOne Hatası:", err);
        return null;
    });

    // Veri kontrolü
    if (!res || !res.Inventory || res.Inventory.length === 0) {
        // `genEmbed` yerine `EmbedBuilder` kullanıldı ve V14 formatına uyarlandı
        return message.channel.send({embeds: [new EmbedBuilder().setAuthor({name: uye.user.tag, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`${uye} isimli üyenin satın alımı bilgisi bulunamadı.`)]}).then(x => setTimeout(() => {x.delete().catch(err => {})}, 7500))
    }

    // Sayfalama işlemleri
    let pages = res.Inventory.sort((a, b) => b.Tarih - a.Tarih).chunk(20);
    var currentPage = 1
    
    if (!pages || pages.length === 0 || !pages[currentPage - 1]) return message.channel.send({embeds: [new EmbedBuilder().setAuthor({name: uye.user.tag, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`${uye} isimli üyenin satın alımı bilgisi bulunamadı.`)]}).then(x => setTimeout(() => {x.delete().catch(err => {})}, 7500))
    
    // V14: EmbedBuilder kullanımı
    let embed = new EmbedBuilder()
        .setColor("White")
        .setAuthor({name: uye.user.tag, iconURL: uye.user.displayAvatarURL({dynamic: true})})
        .setFooter({text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, iconURL: message.guild.iconURL({dynamic: true})})
    
    // V14: ActionRowBuilder kullanımı
    const row = new ActionRowBuilder().addComponents(button1, buttonkapat, button2);
    
    // Sayfa içeriğini oluşturma ve Coin formatlaması
    const updatePage = (pageIndex) => {
        return `${uye} isimli üyesinin toplamda \`${res.Inventory.length || 0}\` adet satın alımı mevcut.

${pages[pageIndex].map((value) => {
    // Para birimlerini doğru formatlama ve birleştirme
    // HATA ÇÖZÜMÜ: priceText'in daha güvenli hesaplanması
    const coinText = value.Coin > 0 ? `${value.Coin.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} ${ayarlar.serverName} Parası` : '';
    const goldText = value.Gold > 0 ? `${value.Gold} Altın` : '';
    const separator = (value.Coin > 0 && value.Gold > 0) ? " ve " : "";
    const priceText = coinText + separator + goldText;

    return `\` ••❯ \` **${value.Name}** isimli ürünü **${priceText}** fiyatına satın aldı.`;
}).join("\n")}`
    }

    // `message.deferReply()` interaction komutlarında kullanılır. Message komutlarında direkt gönderme/edit daha yaygındır.
    // Orijinal koddaki `if (message.deferred == false){ await message.deferReply() };` kısmı Message komutlarında hataya neden olabileceği için kaldırıldı.

    const curPage = await message.channel.send({
        embeds: [embed.setDescription(`${uye}, üyesin satın alımı bilgisi yükleniyor... Lütfen bekleyin...`)],
        components: [row], 
        fetchReply: true,
    }).catch(err => {
        console.error("İlk mesaj gönderilirken hata oluştu:", err);
        return null;
    });
    
    // HATA ÇÖZÜMÜ: curPage null ise işlemi durdur.
    if (!curPage) return;

    // İlk mesajı düzeltme (Envanter verileriyle doldurma)
    await curPage.edit({embeds: [embed.setDescription(updatePage(currentPage - 1))]}).catch(err => {})

    const filter = (i) => i.user.id == message.member.id

    const collector = curPage.createMessageComponentCollector({
        filter,
        time: 30000,
    });

    collector.on("collect", async (i) => {
        let next = false; // Sayfa değişimi oldu mu kontrolü
        switch (i.customId) {
          case "ileri":
            if (currentPage == pages.length) break;
            currentPage++;
            next = true;
            break;
          case "geri":
            if (currentPage == 1) break;
            currentPage--;
            next = true;
            break;
          case "kapat": 
            i.deferUpdate().catch(err => {});
            curPage.delete().catch(err => {})
            // message.react, .catch ile daha güvenli hale getirildi
            return message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
          default:
            break;
        }
        
        // Sadece sayfa değiştiyse düzenle
        if(next) {
            await i.deferUpdate(); // Değişim butonuna basıldığını hemen Discord'a bildir
            await curPage.edit({
                embeds: [embed.setFooter({text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length} `, iconURL: message.guild.iconURL({dynamic: true})}).setDescription(updatePage(currentPage - 1))]
            }).catch(err => {});
            collector.resetTimer();
        }
      });
    
      collector.on("end", () => {
        if(curPage) curPage.edit({
          embeds: [embed.setFooter({text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name}`, iconURL: message.guild.iconURL({dynamic: true})}).setDescription(`${uye} isimli üyesinin toplamda \`${res.Inventory.length || 0}\` adet satın alımı mevcut.`)],
          components: [], // Süre bitince butonları kaldır
        }).catch(err => {});
      })
  }
};
