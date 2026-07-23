const { Client, Message, Util, EmbedBuilder } = require("discord.js"); // Util, splitMessage için eklendi
// NOT: roller, cevaplar, kanallar ve emojiler değişkenlerinin 
// projenizin Configs veya Init dosyalarından geldiği varsayılmıştır.

const Stats = require('../../../../Global/Databases/Client.Users.Stats')
const InviteData = require('../../../../Global/Databases/Global.Guild.Invites');
const Users = require('../../../../Global/Databases/Client.Users');
const Upstaffs = require('../../../../Global/Databases/Client.Users.Staffs');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const moment = require('moment');
require('moment-duration-format');
require('moment-timezone');

module.exports = {
    Isim: "public",
    Komut: ["public","publicodalar"],
    Kullanim: "public <@rol/ID>",
    Aciklama: "Belirlenen role sahip üyelerin public, register ve genel ses denetimini sağlar.",
    Kategori: "stat",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) {
    // client.sureCevir fonksiyonunun başka bir dosyada tanımlandığı varsayılmıştır.
  },

   /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */
  
  onRequest: async function (client, message, args) { 
    let embed = new genEmbed()

    // Yetki Kontrolü (V14'e uygun reply formatı)
    if(!roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has('Administrator')) return message.reply({content: cevaplar.noyt, ephemeral: true}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
    
    const rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    if (!rol) return message.reply({content: `${cevaplar.prefix} Denetleyebilmem için lütfen bir rol belirtiniz.`, ephemeral: true });
    
    // Rolde üye yoksa
    if (rol.members.size === 0) {
        message.react(message.guild.emojis.cache.get(emojiler.Iptal) ? message.guild.emojis.cache.get(emojiler.Iptal) : undefined).catch(err => {});
        return message.reply({content: `${cevaplar.prefix} Belirtilen rolde üye bulunamadığından işlem iptal edildi.`, ephemeral: true });
    }

    let Sesdenetim =  await Stats.find({guildID: message.guild.id});
    Sesdenetim = Sesdenetim.filter(s => message.guild.members.cache.has(s.userID) && message.guild.members.cache.get(s.userID).roles.cache.has(rol.id));
    
    let veriler = []
    
    let PublicListele = Sesdenetim.sort((uye1, uye2) => {
        let uye2Toplam = 0;
        uye2.voiceStats.forEach((x, key) => {
            if(key == kanallar.publicKategorisi) uye2Toplam += x
        });
        let uye1Toplam = 0;
        uye1.voiceStats.forEach((x, key) => {
            if(key == kanallar.publicKategorisi) uye1Toplam += x
        });
        return uye2Toplam-uye1Toplam;
    }).map((m, index) => {
        let uyeToplam = 0;
        m.voiceStats.forEach((x, key) => { if(key == kanallar.publicKategorisi) uyeToplam += x });
        veriler.push(m.userID)
        // V14: Üye etiketleme işlemi
        return `\` ${index+1}. \` ${message.guild.members.cache.get(m.userID).toString()} \`${client.sureCevir(uyeToplam)}\``;
    }).join('\n');
    
    // Verisi bulunmayan üyeler
    let verisizler = rol.members.filter(x => !veriler.includes(x.id))
    
    let text = `Aşağı da **${rol.name}** (\`${rol.id}\`) rolüne ait haftalık **Public (Genel Ses Odaları)** kategori istatistikleri listelendirilmiştir.
──────────────────────
${PublicListele}${verisizler.size > 0 ? `
──────────────────────
**${rol.name}** rolüne ait **Public (Genel Ses Odaları)** kategorisine ait verileri bulunmayan kullanıcılar şunlardır:
${verisizler.map(x => x.toString()).join(", ")}
──────────────────────` : ``}`
    
    // V14 UYUMU: Metin 2000 karakterden büyükse bölme işlemi (Util.splitMessage kullanıldı)
    if (text.length > 2000) {
        const arr = Util.splitMessage(`${text}`, { maxLength: 1950, char: "\n" });
        arr.forEach(element => {
           message.channel.send({content: `${element}`}).catch(err => {});
        });
    } else {
        message.reply({content: `${text}`}).catch(err => {  
            // Hata durumunda tekrar deneme veya loglama
        });
    }
  }
};