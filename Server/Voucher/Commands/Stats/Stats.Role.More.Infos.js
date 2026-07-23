const { Client, Message, Util } = require("discord.js"); // Util, splitMessage için eklendi
const util = require("util")
// NOT: roller, cevaplar, ayarlar ve _statSystem değişkenlerinin 
// projenizin Configs veya Init dosyalarından geldiği varsayılmıştır.


const Stats = require('../../../../Global/Databases/Client.Users.Stats');
const InviteData = require('../../../../Global/Databases/Global.Guild.Invites');
const Users = require('../../../../Global/Databases/Client.Users');
const Upstaffs = require('../../../../Global/Databases/Client.Users.Staffs');

module.exports = {
  Isim: "detaydenetim",
  Komut: ["textdenetim","yazıdenetim"],
  Kullanim: "detaydenetim <@rol/ID>",
  Aciklama: "Belirlenen role sahip üyelerin tüm ses ve mesaj detaylarını gösterir.",
  Kategori: "stat",
  Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) {
    client.sureCevir = (duration) => {  
      let arr = []
      if (duration / 3600000 > 1) {
        let val = parseInt(duration / 3600000)
        let durationn = parseInt((duration - (val * 3600000)) / 60000)
        arr.push(`${val} saat`)
        arr.push(`${durationn} dk.`)
      } else {
        let durationn = parseInt(duration / 60000)
        arr.push(`${durationn} dk.`)
      }
      return arr.join(", ") };
  },

   /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */

  onRequest: async function (client, message, args) {
    // Yetki Kontrolü
    if(!roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))&& !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has('Administrator')) return message.reply({content: cevaplar.noyt, ephemeral: true}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
    
    const rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    
    if (!rol) return message.reply({content: `${cevaplar.prefix} Denetleyebilmem için lütfen bir rol belirtiniz.`, ephemeral: true }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
    
    if(rol.members.size <= 0) return message.reply({content: `Belirtilen **${rol.name}** isimli rolde üye bulunamadığından işlem iptal edildi. ${cevaplar.prefix}`, ephemeral: true})
    
    let Data = await Stats.find({guildID: message.guild.id})
    if(!Data) return message.reply({content: `Bu sunucuya ait herhangi bir istatistik verisine ulaşılamadı.`, ephemeral: true});
    
    let genelChatKanalı = message.guild.channels.cache.get(ayarlar.chatKanalı)
    
    Data = Data.filter(data => {
      let uye = message.guild.members.cache.get(data.userID)
      return uye && uye.roles.cache.has(rol.id)
    });


    let veriler = []
    let vericikler = []

    Data.sort((a, b) => {
      let kul1 = Number(a.totalVoiceStats);
      let kul2 = Number(b.totalVoiceStats);

      return kul2 - kul1
    }).map((data, index) => {
    let uye = message.guild.members.cache.get(data.userID);

    let _stat = {
      kullanıcı: uye,
      genelToplam: data.lifeTotalVoiceStats || 0,
      haftalıktoplam: data.totalVoiceStats || 0,
      toplamchat: 0,
      genelchat: 0,
      haftalikListe: []
    }

    if(data.voiceStats) data.voiceStats.forEach((value, key) => { 
      if(_statSystem.voiceCategorys.find(x => x.id == key)) {
        let kategori = _statSystem.voiceCategorys.find(x => x.id == key);
        let kategoriismi = kategori.isim 
        if(_statSystem.fullPointChannels.some(x => x == key)) {
          _stat.haftalikListe.push(`\` • \` **${message.guild.channels.cache.has(key) ? kategoriismi ? kategoriismi : `Diğer Odalar` : '#Silinmiş'}** : \`${client.sureCevir(value)}\``)
        } else {
          _stat.haftalikListe.push(`\` • \` ${message.guild.channels.cache.has(key) ? kategoriismi ? kategoriismi : `Diğer Odalar` : '#Silinmiş'}: \`${client.sureCevir(value)}\``)
        }
      }
    })
    if(data.chatStats) {
      data.chatStats.forEach(c => _stat.toplamchat += c);
      data.chatStats.forEach((value, key) => { if(key == _statSystem.generalChatCategory) _stat.genelchat = value });
    }

    if(data.voiceStats) {
      if(data.totalVoiceStats > 0 || _stat.genelchat > 10) {
        veriler.push(data.userID)
        vericikler.push(_stat)
      }
    } else {

    }

    })
    
    let verisizler = rol.members.filter(x => !veriler.includes(x.id))

    let text = `Aşağı da **${rol.name}** rolündeki üyelerin, haftalık ses ve mesaj verileri sıralandırılmıştır. Sıralandırma şekli haftalık en iyi olarak şeklinde sıralandırılmıştır.  
${vericikler.sort((a, b) => b.haftalıktoplam - a.haftalıktoplam).map((x, index) => `──────────────────────
${index == 0 ? `👑` : `**${index+1}.**`} ${x.kullanıcı.toString()} Üyesinin ses ve genel chat istatistik bilgileri aşağıda detaylı bir şekilde sıralandırılmıştır,
Tüm zaman boyunca \`${client.sureCevir(x.genelToplam)}\` seste kalmış.
Tüm zaman boyunca toplam da \`${x.toplamchat}\` mesaj atmış.
Bu hafta boyunca \`${client.sureCevir(x.haftalıktoplam)}\` seste kalmış.
Bu hafta boyunca toplam da ${genelChatKanalı ? genelChatKanalı : `#deleted-channel`} kanalına \`${x.genelchat}\` mesaj atmış.
${x.haftalikListe.length > 0 ? `Bu hafta vakit geçirdiği kanal(lar) şunlardır:
${x.haftalikListe.join("\n")}` : `Bu hafta kategorilendirilmiş ses kanallarında bulunamamış.`}`).join("\n")}
${verisizler.size > 0 ? `──────────────────────
**${rol.name}** rolünde bulunan **${verisizler.size}** üyenin verisi bulunamadı veya gereğinden çok yetersiz. Bu üyeler şunlardır:
${verisizler.map(x => x).join(", ")}
──────────────────────` : ``}`
    
    // V14 UYUMU: Metin 2000 karakterden büyükse bölme işlemi
    if (text.length > 2000) {
      const arr = Util.splitMessage(`${text}`, { maxLength: 1950, char: "\n" });
      arr.forEach(element => {
         message.channel.send({content: `${element}`});
      });
    } else {
      message.reply({content: `${text}`}).catch(err => {
        // Hata durumunda tekrar deneme veya loglama
      });
    }
  }
};