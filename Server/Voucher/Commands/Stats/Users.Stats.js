const { 
  Client, 
  Message, 
  EmbedBuilder, 
  ActionRowBuilder, 
  AttachmentBuilder, 
  StringSelectMenuBuilder,
  ComponentType 
} = require("discord.js");
const moment = require('moment');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { join } = require("path");

const Stats = require('../../../../Global/Databases/Client.Users.Stats');
const Upstaff = require('../../../../Global/Databases/Client.Users.Staffs');
const Users = require('../../../../Global/Databases/Client.Users');
const Seens = require('../../../../Global/Databases/Guild.Users.Seens');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const tm = require('../../../../Global/Plugins/Time.Manager');
const ms = require('ms');
const Sorumluluk = require('../../../../Global/Databases/Guild.Responsibility');
require('moment-duration-format');
require('moment-timezone');
const table = require('table');
let ScreenData = new Map();

module.exports = {
    Isim: "stat",
    Komut: ["stat"],
    Kullanim: "stat <@andale/ID>",
    Aciklama: "Belirlenen üye veya kendinizin istatistik bilgilerine bakarsınız",
    Kategori: "stat",
    Extend: true,
    
  /**
   * @param {Client} client 
   */
  onLoad: function (client) {
    client.on("voiceStreamingStart", (member, voiceChannel) => {
      ScreenData.set(member.id, {
          channelId: voiceChannel.id,
          Start: Date.now(),
      });
    });

    client.on("voiceStreamingStop", async (member, voiceChannel) => {
      let data = ScreenData.get(member.id);
      if(data) {
        await Users.updateOne({_id: member.id}, {$push: {"Streaming": {
          id: voiceChannel.id,
          Start: data.Start,
          End: Date.now()
      }
      }}, {upsert: true});
      let logKanal = member.guild.kanalBul("streamer-log");
      let yayınSüresi = moment.duration(Date.now() - data.Start).format('Y [yıl,] M [ay,] d [gün,] h [saat,] m [dakika] s [saniye]');
      if(logKanal) {
        // v14 map/array uyumluluğu için cache kullanıldı
        const membersList = voiceChannel.members.size <= 8 
          ? voiceChannel.members.map(x => x.user.tag).join("\n") 
          : `${voiceChannel.members.map(x => x.user.tag).slice(0, 8).join("\n")} ve ${voiceChannel.members.size - 8} kişi daha.`;

        logKanal.send({
          embeds: [
            new EmbedBuilder()
              .setDescription(`${member} isimli üye ${voiceChannel} kanalında **${yayınSüresi}** boyunca yayın açtı.\n\n**Ses kanalında bulunan üyeler**:\n\`\`\`\n${membersList}\n\`\`\``)
              .setFooter({ text: `${member.user.tag} • ${voiceChannel.name} • ${yayınSüresi}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
          ]
        }).catch(err => {});
      }
     }
    });
    client.sureCevir = (duration) => {  
      let dr = moment.duration(duration).format('Y [yıl,] M [ay,] d [gün,] h [saat,] m [dk]');
      return dr + ".";
    };
  },

   /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */
  onRequest: async function (client, message, args) { 
    registerFont(`../../Assets/theboldfont.ttf`, { family: "Bold" });
    registerFont(`../../Assets/SketchMatch.ttf`, { family: "SketchMatch" });
    registerFont(`../../Assets/LuckiestGuy-Regular.ttf`, { family: "luckiest guy" });
    registerFont(`../../Assets/KeepCalm-Medium.ttf`,  { family: "KeepCalm"});
    registerFont(`../../Assets/Acar.otf`,  { family: "Abc"});
    registerFont(`../../Assets/Roboto.ttf`,  { family: "Roboto"});
    
    let embed = new EmbedBuilder();
    let embedcik = new EmbedBuilder();
    let kullArray = message.content.split(" ");
    let kullaniciId = kullArray.slice(1);
    
    let uye = message.mentions.members.first() || message.guild.members.cache.get(kullaniciId[0]) || message.guild.members.cache.find(x => x.user.username.toLowerCase() === kullaniciId.slice(0).join(" ") || x.user.username === kullaniciId[0]) || message.member;
    let load = await message.reply({content: `<a:andale_loading:1517536572017213450> | **${uye.user.tag}** isimli kullanıcının verileri yükleniyor. Lütfen bekleyin!`});
    let SonGörülme = await Seens.findOne({userID: uye.id});
    let data = await Stats.findOne({ guildID: message.guild.id, userID: uye.id });
    
    let avatar = await loadImage(uye.user.displayAvatarURL({ extension: "png" }));
    let background = await loadImage(`../../Assets/yatay_dg.png`);
    if(roller.erkekRolleri && roller.erkekRolleri.some(x => uye.roles.cache.has(x))) background = await loadImage(`../../Assets/yatay_erkek.png`);
    if(roller.kadınRolleri && roller.kadınRolleri.some(x => uye.roles.cache.has(x))) background = await loadImage(`../../Assets/yatay_kadin.png`);
    
    let Upstaffs = await Upstaff.findOne({_id: uye.id});
    let top = await Stats.find();
    let kullanicidata = await Users.findOne({_id: uye.id});
    
    if (!data) return load.edit({content: `Belirtilen ${uye} kullanıcının **${message.guild.name}** sunucusuna ait istatistik verisi bulunamadı. ${message.guild.emojiGöster(emojiler.Iptal)} `, ephemeral: true}),
    setTimeout(() => {
      load.delete().catch(err => {});
    }, 5000);
    
    let siralamagetir = top.filter(x => message.guild.members.cache.has(x.userID)).sort((a, b) => Number(b.lifeTotalVoiceStats) - Number(a.lifeTotalVoiceStats));
    let genelsiralama = siralamagetir.find(x => x.userID == uye.id) ? Number(siralamagetir.indexOf(siralamagetir.find(x => x.userID == uye.id))) + 1 : `SIRALAMADA BULUNMUYOR!`;

    let haftalikSesToplam = 0;
    let haftalikSesListe = '';
    let genelChatToplam = 0;
    let genelSesToplam = 0;
    let genelSesListe = '';
    let genelChatListe = '';
    let genelafk = 0;
    let haftalikafk = 0;
    let canvasSesListe = '';
    let canvasChatListe = '';
    let müzikToplam = 0;
    let streamer = 0;
    let public = 0;
    
    uye._views();
    if(data.lifeChatStats) {
      data.lifeChatStats.forEach(c => genelChatToplam += c);
      data.lifeChatStats.forEach((value, key) => {
        if(_statSystem.chatCategorys.find(x => x.id == key)) {
          let kategori = _statSystem.chatCategorys.find(x => x.id == key);
          let mesajkategoriismi = kategori.isim;
          genelChatListe += `${message.guild.emojiGöster("andale_arrow")} ${message.guild.channels.cache.has(key) ? mesajkategoriismi ? mesajkategoriismi : message.guild.channels.cache.get(key).name : '#Silinmiş'}: \` ${value} mesaj \`\n`;
        }
      });
    }
    
    let günlükses = 0, ikihaftalik = 0, aylıkses = 0, toplamses = 0;
    let günlükmesaj = 0, haftalıkmesaj = 0, aylıkmesaj = 0, toplammesaj = 0;
    let haftalık = {}, aylık = {}, günlük = [];
    let day = await tm.getDay(message.guild.id);
    let haftalıkm = {}, aylıkm = {}, günlükm = [];

    if(data.allMessage) {
      let days = Object.keys(data.allMessage);
      days.forEach(_day => {
          let sum = Object.values(data.allMessage[_day]).reduce((x, y) => x + y, 0);
          toplammesaj += sum;
          if (day == Number(_day)) {
              günlükmesaj += sum;
              günlükm = Object.keys(data.allMessage[_day]).map(e => Object.assign({ Channel: e, Value: data.allMessage[_day][e] }));
          }
          if (_day <= 7) {
              haftalıkmesaj += sum;
              let keys = Object.keys(data.allMessage[_day]);
              keys.forEach(key => {
                  if (haftalıkm[key]) haftalıkm[key] += data.allMessage[_day][key];
                  else haftalıkm[key] = data.allMessage[_day][key];
              });
          }
          if (_day <= 30) {
              aylıkmesaj += sum;
              let keys = Object.keys(data.allMessage[_day]);
              keys.forEach(key => {
                  if (aylıkm[key]) aylıkm[key] += data.allMessage[_day][key];
                  else aylıkm[key] = data.allMessage[_day][key];
              });
          }
      });
    }

    if(data.allVoice && data.allCategory) {
      let days = Object.keys(data.allVoice || {});
      days.forEach(_day => {
          let sum = Object.values(data.allVoice[_day]).reduce((x, y) => x + y, 0);
          toplamses += sum;
          if (day == Number(_day)) {
              günlükses += sum;
              günlük = Object.keys(data.allVoice[_day]).map(e => Object.assign({ Channel: e, Value: data.allVoice[_day][e] }));
          }
          if (_day <= 7) {
            ikihaftalik += sum;
              let keys = Object.keys(data.allVoice[_day]);
              keys.forEach(key => {
                  if (haftalık[key]) haftalık[key] += data.allVoice[_day][key];
                  else haftalık[key] = data.allVoice[_day][key];
              });
          }
          if (_day <= 30) {
              aylıkses += sum;
              let keys = Object.keys(data.allVoice[_day]);
              keys.forEach(key => {
                  if (aylık[key]) aylık[key] += data.allVoice[_day][key];
                  else aylık[key] = data.allVoice[_day][key];
              });
          }
      });
    } 

    if(data.lifeVoiceStats) {
      data.lifeVoiceStats.forEach(c => genelSesToplam += c);
      data.lifeVoiceStats.forEach((value, key) => {
            if(key == kanallar.publicKategorisi) public += value;
            if(key == kanallar.streamerKategorisi) streamer += value;
      });
      data.lifeVoiceStats.forEach((value, key) => {
        if(_statSystem.musicRooms.some(x => x === key)) müzikToplam += value;
      });
      data.lifeVoiceStats.forEach((value, key) => { 
      if(_statSystem.voiceCategorys.find(x => x.id == key)) {
        let kategori = _statSystem.voiceCategorys.find(x => x.id == key);
        if(ayarlar.sleepRoom && ayarlar.sleepRoom == key) genelafk = value;
        let kategoriismi = kategori.isim;
          genelSesListe += `${message.guild.emojiGöster("andale_arrow")} ${message.guild.channels.cache.has(key) ? kategoriismi ? kategoriismi : `Diğer Odalar` : '#Silinmiş'}: \` ${client.sureCevir(value)} \`\n`;
        }
      });
      if(müzikToplam > 0) genelSesListe += `${message.guild.emojiGöster("andale_arrow")} Müzik Odalar: \` ${client.sureCevir(müzikToplam)} \`\n`;
    }

    if(data.voiceStats) {
      data.voiceStats.forEach(c => haftalikSesToplam += c);
      data.voiceStats.forEach((value, key) => {
        if(_statSystem.musicRooms.some(x => x === key)) müzikToplam += value;
        if(ayarlar.sleepRoom && ayarlar.sleepRoom == key) haftalikafk = value;
      });
      data.voiceStats.forEach((value, key) => { 
      if(_statSystem.voiceCategorys.find(x => x.id == key)) {
        let kategori = _statSystem.voiceCategorys.find(x => x.id == key);
        let kategoriismi = kategori.isim;
           haftalikSesListe += `${message.guild.emojiGöster("andale_arrow")} ${message.guild.channels.cache.has(key) ? kategoriismi ? kategoriismi : `Diğer Odalar` : '#Silinmiş'}: \` ${client.sureCevir(value)} \`\n`;
           canvasSesListe += `${message.guild.channels.cache.has(key) ? kategoriismi ? kategoriismi : `Diğer Odalar` : '#Silinmiş'}: ${client.sureCevir(value)}\n`;
        }
      });
      if(müzikToplam > 0) {
        haftalikSesListe += `${message.guild.emojiGöster("andale_arrow")} Müzik Odalar: \` ${client.sureCevir(müzikToplam)} \``;
        canvasSesListe += `Müzik Odalar: ${client.sureCevir(müzikToplam)}`;
      }
    }
    
    let haftalikChatToplam = 0;
    data.chatStats.forEach(c => haftalikChatToplam += c);
    let haftalikChatListe = '';
    data.chatStats.forEach((value, key) => {
      if(_statSystem.chatCategorys.find(x => x.id == key)) {
        let kategori = _statSystem.chatCategorys.find(x => x.id == key);
        let mesajkategoriismi = kategori.isim;
        haftalikChatListe += `${message.guild.emojiGöster("andale_arrow")} ${message.guild.channels.cache.has(key) ? mesajkategoriismi ? mesajkategoriismi : message.guild.channels.cache.get(key).name : '#Silinmiş'}: \` ${value} mesaj \`\n`;
        canvasChatListe += `${message.guild.emojiGöster(emojiler.Terfi.miniicon)} ${message.guild.channels.cache.has(key) ? mesajkategoriismi ? mesajkategoriismi : message.guild.channels.cache.get(key).name : '#Silinmiş'}: ${value} mesaj\n`;
      }
    });

    if(ayarlar && ayarlar.statRozet) {
      let rozetbir = roller.statRozetOne;
      let rozetiki = roller.statRozetTwo;
      let rozetuc = roller.statRozetThree;
      let rozetdort = roller.statRozetFour;
      let rozetbes = roller.statRozetFive;
      if(parseInt(public) < ms("14h")) {
        uye.roles.remove(rozetbir).catch(err => {});
        uye.roles.remove(rozetiki).catch(err => {});
        uye.roles.remove(rozetuc).catch(err => {});
        uye.roles.remove(rozetdort).catch(err => {});
        uye.roles.remove(rozetbes).catch(err => {});
      }
      if(parseInt(public) < ms("15h")) embedcik.addFields({ name: "Ses Rozet Durumu", value: `Ah güzel dostum henüz bir rozete sahip değilsin. <@&${rozetbir}> rozetini elde etmek için sohbet kanallarıda  \`${getContent(ms("15h") - public)}\` geçirmen gerekiyor.`, inline: false });
      if(parseInt(public) > ms("15h") && parseInt(public) < ms("30h")) embedcik.addFields({ name: "Ses Rozet Durumu", value: `Tebrikler <@&${rozetbir}> rozetine sahipsin! Bir sonraki <@&${rozetiki}> rozetini elde etmek için sohbet kanallarıda  \`${getContent(ms("30h") - public)}\` geçirmen gerekiyor.`, inline: false });
      if(parseInt(public) > ms("30h") && parseInt(public) < ms("45h")) embedcik.addFields({ name: "Ses Rozet Durumu", value: `Tebrikler <@&${rozetiki}> rozetine sahipsin! Bir sonraki <@&${rozetuc}> rozetini elde etmek için sohbet kanallarıda  \`${getContent(ms("45h") - public)}\` geçirmen gerekiyor.`, inline: false });
      if(parseInt(public) > ms("45h") && parseInt(public) < ms("60h")) embedcik.addFields({ name: "Ses Rozet Durumu", value: `Tebrikler <@&${rozetuc}> rozetine sahipsin! Bir sonraki <@&${rozetdort}> rozetini elde etmek için sohbet kanallarıda  \`${getContent(ms("60h") - public)}\` geçirmen gerekiyor.`, inline: false });
      if(parseInt(public) > ms("60h") && parseInt(public) < ms("80h")) embedcik.addFields({ name: "Ses Rozet Durumu", value: `Tebrikler <@&${rozetdort}> rozetine sahipsin! Bir sonraki <@&${rozetbes}> rozetini elde etmek için sohbet kanallarıda  \`${getContent(ms("80h") - public)}\` geçirmen gerekiyor.`, inline: false });
      if(parseInt(public) > ms("80h")) embedcik.addFields({ name: "Ses Rozet Durumu", value: `İnanılmazsın! <@&${rozetbes}> rozetine sahipsin! Bu rozeti taşımak sana bir his vermeli!`, inline: false });
      
      if(parseInt(public) > ms("15h") && parseInt(public) < ms("30h") && !uye.roles.cache.has(rozetbir)) {
          uye.roles.add(rozetbir);
          embedcik.addFields({ name: "✨ Tebrikler, yeni rozet!", value: `Toplam sohbet odalarında süren 15 saati geçtiği için <@&${rozetbir}> rolünü kazandın! Bir sonraki <@&${rozetiki}> rolünü elde etmek için \`${getContent(ms("30h") - public)}\` geçirmen gerekiyor.`, inline: false });
      }
      if(parseInt(public) > ms("30h") && parseInt(public) < ms("45h") && !uye.roles.cache.has(rozetiki)) {
          uye.roles.remove(rozetbir).catch(err => {});
          uye.roles.add(rozetiki);
          embedcik.addFields({ name: "✨ Tebrikler, yeni rozet!", value: `Toplam sohbet odalarında süren 30 saati geçtiği için <@&${rozetiki}> rolünü kazandın! Bir sonraki <@&${rozetuc}> rolünü elde etmek için \`${getContent(ms("45h") - public)}\` geçirmen gerekiyor.`, inline: false });
      }
      if(parseInt(public) > ms("45h") && parseInt(public) < ms("60h") && !uye.roles.cache.has(rozetuc)) {
          uye.roles.remove(rozetiki).catch(err => {});
          uye.roles.add(rozetuc);
          embedcik.addFields({ name: "✨ Tebrikler, yeni rozet!", value: `Toplam sohbet odalarında süren 45 saati geçtiği için <@&${rozetuc}> rolünü kazandın! Bir sonraki <@&${rozetdort}> rolünü elde etmek için \`${getContent(ms("60h") - public)}\` geçirmen gerekiyor.`, inline: false });
      }
      if(parseInt(public) > ms("60h") && parseInt(public) < ms("80h") && !uye.roles.cache.has(rozetdort)) {
          uye.roles.remove(rozetuc).catch(err => {});
          uye.roles.add(rozetdort);
          embedcik.addFields({ name: "✨ Tebrikler, yeni rozet!", value: `Toplam sohbet odalarında süren 60 saati geçtiği için <@&${rozetdort}> rolünü kazandın! Bir sonraki <@&${rozetbes}> rolünü elde etmek için \`${getContent(ms("80h") - public)}\` geçirmen gerekiyor.`, inline: false });
      }
      if(parseInt(public) > ms("80h") && !uye.roles.cache.has(rozetbes)) {
          uye.roles.remove(rozetdort).catch(err => {});
          uye.roles.add(rozetbes);
          embedcik.addFields({ name: "✨ Tebrikler, yeni rozet!", value: `Toplam sohbet odalarında süren 80 saati geçtiği için <@&${rozetbes}> rolünü kazandın! Üstün aktifliğinden dolayı sana teşekkür ederiz.`, inline: false });
      }
    }
  
    let buttonGroup = [
      {label: "Genel İstatistikler", description: `Sunucuya ait ${day} günlük tüm verilerin detaylarını görüntülemektedir.`, emoji: "1517536572017213450", value: "genel"},
      {label: "Haftalık İstatistikler", description: "Haftalık istatistikleri barındıran detayları görüntülemektedir.", emoji: "1517536572017213450", value: "haftalik"}, 
      {label: "Genel Sıralama", description: `${message.guild.name} sunucusunun Top20 istatistik sıralaması gösterilmektedir.`, emoji: "1517536572017213450", value: "topstat"},
      {label: "Yayın İstatistikleri", description: `Yapılan yayın istatistik detayları gösterilmektedir.`, emoji: "1518570608814981200", value: "yayın"}
    ];

    if(SonGörülme) {
      buttonGroup.push({label: "Son Görülme Detayları", description: `${uye.user.tag} üyesinin son görülme bilgileri gösterilmektedir.`, emoji: "1517149709502779503", value: "songorulme"});
    }
    if(ayarlar.statRozet && uye.id == message.member.id) {
      buttonGroup.push({label: "Rozet Bilgisi", description: `${uye.user.tag} üyesinin haftalık rozet bilgisini göstermektedir.`, emoji: "1518571272651538542", value: "rozetcik"});
    }
    let sorumlu = await Sorumluluk.find({});
    sorumlu = sorumlu.filter(x => uye.roles.cache.has(x.role));
    if(sorumlu && sorumlu.length > 0) {
      buttonGroup.push({label: "Sorumluluk Detayları", description: `${uye.user.tag} üyesinin liderlik ve sorumluluk bilgileri belirtilmektedir.`, emoji: "1517142580020777145", value: "sorumluluklar"});
    }
    let meetingDedect = kullanicidata;
    if(meetingDedect && meetingDedect.Meetings && meetingDedect.Meetings.length > 0) {
      buttonGroup.push({label: "Toplantı Detayları", description: `${uye.user.tag} üyesinin son toplantı detayları belirtilmektedir.`, emoji: "1518571831634825308", value: "toplantı"});
    }
    if(roller.Yetkiler.some(x => uye.roles.cache.has(x)) && Upstaffs) {
       buttonGroup.push(
         {label: `${Upstaffs.Yönetim ? "Görevleri Görüntüle" : "Yetkili İstatistikleri"}`, description: `${uye.user.tag} üyesinin ${Upstaffs.Yönetim ? "görevlerini görüntülemektedir." : "yetkili(yükseltim) istatistiklerini görüntülemektedir."}`, emoji: `${Upstaffs.Yönetim ? "1518573274949226659" : "1518572773784555650"}`, value: "panelaç"},
         {label: "Yükseltim Paneli", description: `${uye.user.tag} üyesinin yetki(yükselt/düşür) kontrolünü sağlar.`, emoji: "1518574268743680131", value: "buttonpanel"},
         {label: "Kapat", description: "İstatistik panelini kapatır.", emoji: "1517138914572238859", value: "buttoniptal"}
       );
    } else {
       buttonGroup.push({label: "Kapat", description: "İstatistik panelini kapatır.", emoji: "1517138914572238859", value: "buttoniptal"});
    }

    let Rowcuk = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("listStats")
        .setPlaceholder(`${uye.user.tag}'ın detaylarını görüntüle`)
        .setOptions(buttonGroup)
    );

    let barSystem = [
      {id: "sari", baslamaBar: "baslamaBar", doluBar: "doluBar", doluBitisBar: "doluBitisBar"},
    ];
    function progressBar(value, maxValue, size, veri, renk = barSystem[0]) {
      const progress = Math.round(size * ((value / maxValue) > 1 ? 1 : (value / maxValue)));
      const emptyProgress = size - progress > 0 ? size - progress : 0;
      let progressStart;
      if(veri == 0) progressStart = `<:baslangicBar:1516450509869940912>`;
      if(veri > 0) progressStart = `<a:baslamaBar:1516450511744667866>`;
      const progressText = `<a:doluBar:1516450514018111678>`.repeat(progress);
      const emptyProgressText = `<:bosBar:1516450518602350592>`.repeat(emptyProgress);
      const bar = progressStart + progressText + emptyProgressText + `${emptyProgress == 0 ? `<a:doluBitisBar:1516450516220252381>` : `<:bosBitisBar:1516450520385060914>`}`;
      return bar;
    }

    // Canvas İşlemleri (Saf Canvas API'sine Çevrildi)
    const canvas = createCanvas(1190, 666);
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(background, 0, 0, 1190, 666);

    // Oval Profil Resmi Çizimi
    ctx.save();
    ctx.beginPath();
    let r = 27, x = 23, y = 15, w = 198, h = 198;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h - r);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, x, y, w, h);
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = `${String(uye.user.tag).length > 12 ? "38px" : "40px"} Bold`;
    let cleanTag = uye.user.tag.replace("ş","s").replace("Ş","S").replace("İ","I").replace("ı","i").replace("Ç","C").replace("ç","c").replace("Ğ","G").replace("ğ","g").replace("Ö","O").replace("ö","ö");
    let textX = String(uye.user.tag).length > 9 ? String(uye.user.tag).length > 12 ? 240 :  260 : 280;
    ctx.fillText(cleanTag, textX, 110);

    let baslangic = 315;
    let rozetler = [];
    if(uye.id == message.guild.ownerId) rozetler.push("guild_owner");
    if(uye.user.username == "acar") rozetler.push("staffscik", "dev","bughunter");
    if(roller.Yetkiler && roller.Yetkiler.some(x => uye.roles.cache.has(x))) rozetler.push("shield");
    if(ayarlar.type && uye.user.username.includes(ayarlar.tag)) rozetler.push(emojiler.Tag);
    if(roller.haftaninBirinciRolü && message.guild.roles.cache.has(roller.haftaninBirinciRolü) && uye.roles.cache.has(roller.haftaninBirinciRolü)) rozetler.push("a_top");
    if(roller.vipRolü && message.guild.roles.cache.has(roller.vipRolü) && uye.roles.cache.has(roller.vipRolü)) rozetler.push("a_vip");
    if(roller.boosterRolü && message.guild.roles.cache.has(roller.boosterRolü) && uye.roles.cache.has(roller.boosterRolü)) rozetler.push("a_booster");
    
    let begeni = kullanicidata ? kullanicidata.Likes ? kullanicidata.Likes.filter(x => message.guild.members.cache.get(x)).length : 0 : 0;
    let arkadaşş = kullanicidata ? kullanicidata.Friends ? kullanicidata.Friends.filter(x => message.guild.members.cache.get(x)).length : 0 : 0;
    let takipçi = kullanicidata ? kullanicidata.Follower ? kullanicidata.Follower.filter(x => message.guild.members.cache.get(x)).length : 0 : 0;
    let goruntulenme = kullanicidata ? kullanicidata.Views ? kullanicidata.Views : 0 : 0;
    let takipçiPuan = Number(takipçi * 3.5) + Number(arkadaşş * 2.5) + Number(begeni * 1) + Number(goruntulenme / 200);

    if(takipçiPuan > 2 && takipçiPuan < 18) rozetler.push("a_one");
    if(takipçiPuan > 17 && takipçiPuan < 35) rozetler.push("a_two");
    if(takipçiPuan > 34 && takipçiPuan < 60) rozetler.push("a_three");
    if(takipçiPuan > 60 && takipçiPuan < 100) rozetler.push("a_four");
    if(takipçiPuan > 100 && takipçiPuan < 200) rozetler.push("a_five");
    if(takipçiPuan > 200 && takipçiPuan < 400) rozetler.push("a_six");
    if(takipçiPuan > 400 && takipçiPuan < 800) rozetler.push("a_seven");
    if(takipçiPuan > 800 && takipçiPuan < 1600) rozetler.push("a_eight");
    if(takipçiPuan > 1600 && takipçiPuan < 3200) rozetler.push("a_nine");
    if(takipçiPuan > 3200) rozetler.push("a_ten");
     
    for (let i = 0; i < rozetler.slice(0, 5).length; i++) {
        let rozet = client.emojis.cache.find(x => x.name == String(rozetler[i]));
        if(rozet && rozet.url) {
         let rozet_resim = await loadImage(rozet.url.replace("webp", "png"));
         ctx.drawImage(rozet_resim, baslangic, 133, 22.5, 22.5);
         baslangic += 35;
        }
    }

    let toplamyayinbilgisi = 0;
    if(kullanicidata && kullanicidata.Streaming) {
     kullanicidata.Streaming.map(stream => {
         toplamyayinbilgisi += Number(stream.End - stream.Start);
     });
    }

    ctx.font = "20px Bold";
    ctx.fillText(`${global.tarihHesapla(uye.joinedAt)}`, 675, 80);
    ctx.fillText(`${SonGörülme ? SonGörülme.lastSeen ? `${global.tarihHesapla(new Date(SonGörülme.lastSeen))}` : `Belirtilmedi!` : `Belirtilmedi!`}`, 675, 143);
    ctx.fillText(`${begeni} BEGENI`, 955, 80);
    ctx.fillText(`${takipçi} TAKIPCI`, 955, 143);

    ctx.fillText(`${genelChatToplam} MESAJ`, 80, 345);
    ctx.fillText(`${moment.duration(toplamyayinbilgisi).format('Y [yıl,] M [ay,] d [gün,] h [saat,] m [dk]')}.`, 80, 410);
    ctx.fillText(`${client.sureCevir(genelSesToplam)}`, 80 * 4 + 45, 345);
    ctx.fillText(`${client.sureCevir(genelafk)} AFK`, 80 * 4 + 45, 410);
    ctx.fillText(`${haftalikChatToplam} MESAJ`, 670, 345);
    ctx.fillText(`${moment.duration(toplamyayinbilgisi).format('Y [yıl,] M [ay,] d [gün,] h [saat,] m [dk]')}.`, 670, 410);
    ctx.fillText(`${client.sureCevir(haftalikSesToplam)}`, 955, 345);
    ctx.fillText(`${client.sureCevir(haftalikafk)} AFK`, 955, 410);
    ctx.fillText(`KATILIM: ${(message.guild.members.cache.filter(a => a.joinedTimestamp <= uye.joinedTimestamp).size).toLocaleString()}/${(message.guild.memberCount).toLocaleString()}`, 670, 567);
    ctx.fillText(`Genelde ${genelsiralama}. Oldu!`, 670, 632);
    
    ctx.fillText(`${Object.keys(aylık).length > 0 ? message.guild.channels.cache.get(Object.keys(aylık).sort((x, y) => aylık[y] - aylık[x])[0]) ? `#${message.guild.channels.cache.get(Object.keys(aylık).sort((x, y) => aylık[y] - aylık[x])[0]).name}` : "Kanal Bulunamadi!" : "Kanal Bulunamadi!"}`, 955, 567);
    ctx.fillText(`${Object.keys(aylıkm).length > 0 ? message.guild.channels.cache.get(Object.keys(aylıkm).sort((x, y) => aylıkm[y] - aylıkm[x])[0]) ? `#${message.guild.channels.cache.get(Object.keys(aylıkm).sort((x, y) => aylıkm[y] - aylıkm[x])[0]).name}` : "Kanal Bulunamadi!" : "Kanal Bulunamadi!"}`, 955, 632);
    
    ctx.fillText(`${SonGörülme ? SonGörülme.lastMessage ? `${tarihsel(SonGörülme.lastMessage)}` : `Belirtilmedi!` : `Belirtilmedi!`}`, 80, 345 + 222);
    ctx.fillText(`${SonGörülme ? SonGörülme.lastVoice ? `${tarihsel(SonGörülme.lastVoice)}` : `Belirtilmedi!` : `Belirtilmedi!`}`, 80, 410 + 223);
    ctx.fillText(`${SonGörülme ? SonGörülme.lastSeen ? `${tarihsel(SonGörülme.lastSeen)}` : `Belirtilmedi!` : `Belirtilmedi!`}`, 80 * 4 + 45, 345 + 222);
    ctx.fillText(`Tip: ${SonGörülme ? SonGörülme.last ? SonGörülme.last.type ? SonGörülme.last.type : `Bulunamadı!` : `Bulunamadı!` : "Bulunamadı!"}`, 80 * 4 + 45, 410 + 223);
 
    let attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "acar-stat.png" });

    // Embed İçeriğini Ayarlama
    embed
      .setImage("attachment://acar-stat.png")
      .setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({ dynamic: true, size: 2048 }) })
      .setThumbnail(uye.user.avatarURL({ dynamic: true, size: 2048 }))
      .setDescription(`${uye} (${uye.roles.highest}) kullanıcısının \`${message.guild.name}\` sunucusunda ${day} gün boyunca yaptığı ses ve mesaj bilgileri aşağıda belirtilmiştir.\n
**Periyodik Ses Toplamları**
Toplam: \` ${client.sureCevir(genelSesToplam)} \`
Günlük: \` ${client.sureCevir(günlükses)} \`
Haftalık: \` ${client.sureCevir(haftalikSesToplam)} \`
Aylık: \` ${client.sureCevir(aylıkses)} \`${ayarlar.seviyeSistemi ? `\nSeviye: \` ${data.voiceLevel} Sv. \`
\` %${Math.floor((data.voiceXP ? data.voiceXP.toFixed(1) : 0)/((data.voiceLevel + 1) * 447)*100)} \` ${progressBar(data.voiceXP ? data.voiceXP.toFixed(1) : 0, (data.voiceLevel + 1) * 447, 5, data.voiceXP ? data.voiceXP.toFixed(1) : 0)} \`${data.voiceXP.toFixed(1)} / ${(data.voiceLevel + 1) * 447}\`` : ``}

**Periyodik Mesaj Toplamları**
Toplam: \` ${genelChatToplam} mesaj \`
Günlük: \` ${günlükmesaj} mesaj \`
Haftalık: \` ${haftalikChatToplam} mesaj \`
Aylık: \` ${aylıkmesaj} mesaj \`${ayarlar.seviyeSistemi ? `\nSeviye: \` ${data.messageLevel} Sv. \`
\` %${Math.floor((data.messageXP ? data.messageXP.toFixed(1) : 0)/((data.messageLevel + 1) * 647)*100)} \` ${progressBar(data.messageXP ? data.messageXP.toFixed(1) : 0, (data.messageLevel + 1) * 647, 5, data.messageXP ? data.messageXP.toFixed(1) : 0)} \`${data.messageXP.toFixed(1)} / ${(data.messageLevel + 1) * 647}\`` : ``}

**Aylık En İyi 5 Ses Kanalları**
${Object.keys(aylık).length > 0 ? Object.keys(aylık).sort((x, y) => aylık[y] - aylık[x]).splice(0, 5).map((data, index) => {
  let channel = message.guild.channels.cache.get(data);
  return `\`${index + 1}.\` ${channel ? channel : "#deleted-channel"}: \`${client.sureCevir(aylık[data])}\``;
}).join("\n") : "Daha önce bir ses kanalına katılmamış!"}

**Aylık En İyi 5 Mesaj Kanalları**
${Object.keys(aylıkm).length > 0 ? Object.keys(aylıkm).sort((x, y) => aylıkm[y] - aylıkm[x]).splice(0, 5).map((data, index) => {
  let channel = message.guild.channels.cache.get(data);
  return `\`${index + 1}.\` ${channel ? channel : "#deleted-channel"}: \`${aylıkm[data]} mesaj\``;
}).join("\n") : "Daha önce bir mesaj kanalına katılmamış!"}

**Kategorilendirilmiş Genel Ses Listesi**
${genelSesListe ? genelSesListe : `Daha önce bir listelenmiş ses istatistiği bulunamadı!`}
**Kategorilendirilmiş Genel Mesaj Listesi**
${genelChatListe ? genelChatListe : `Daha önce bir listelenmiş mesaj istatistiği bulunamadı!`}`);
    
    load.edit({ content: null, components: [Rowcuk], files: [attachment], embeds: [embed] }).then(async (msg) => {
          const filter = i => i.user.id === message.member.id;
          const collector = msg.createMessageComponentCollector({ filter, componentType: ComponentType.StringSelect, time: 60000 });
          
          collector.on('collect', async (i) => {
            if(i.values[0] == "yayın") {
              let datastream = kullanicidata;
              let totalStreaming = 0;
              let listedStreaming = '';
              if(datastream && !datastream.Streaming) {
                  listedStreaming = `Daha önce yayın bilgisi bulunamadı. ${cevaplar.prefix}`;
              } else {
                datastream.Streaming.map(stream => {
                  totalStreaming += Number(stream.End - stream.Start);
                }); 
                listedStreaming = datastream.Streaming.slice(0, 20).sort((a, b) => b.End - a.End).map((stream, index)=> {
                    let yayınKanalı = message.guild.channels.cache.get(stream.id);
                    let yayınSüresi = moment.duration(stream.End - stream.Start).format('Y [yıl,] M [ay,] d [gün,] h [saat,] m [dakika] s [saniye]');
                    return `${yayınKanalı ? yayınKanalı : "**Kanal Bulunamadı!**"}: \`${yayınSüresi}\``;
                }).join("\n");
              }
              let toplamYayın = moment.duration(totalStreaming).format('Y [yıl,] M [ay,] d [gün,] h [saat,] m [dakika] s [saniye]');
              
              let streamEmbed = new EmbedBuilder()
                .setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({ dynamic: true, size: 2048 }) })
                .setThumbnail(uye.user.avatarURL({ dynamic: true, size: 2048 }))
                .setDescription(`${uye} (${uye.roles.highest}) üyesinin \`${message.guild.name}\` sunucusunda yapılan yayın bilgileri aşağıda belirtilmiştir.\n\n${message.guild.emojiGöster("963721287040118784")} Toplam Yayın: **\` ${datastream.Streaming ? datastream.Streaming.length : 0} Adet \`**\n${message.guild.emojiGöster("948684327959547965")} Toplam Yayın Süresi: **\` ${toplamYayın} \`**`)
                .addFields({ name: `Son 20 Yayın Bilgisi  ${message.guild.emojiGöster("streamEmoji")}`, value: `${listedStreaming || "Bulunamadı"}` });

              await msg.edit({ embeds: [streamEmbed], components: [Rowcuk] }).catch(err => {});
              await i.deferUpdate().catch(err => {});
            }
            if(i.values[0] == "levelcik") {
              let lvlEmbed = new EmbedBuilder()
                .setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({ dynamic: true, size: 2048 }) })
                .setDescription(`${uye} (${uye.roles.highest}) üyesinin \`${message.guild.name}\` sunucusunda ses ve mesaj aktifliğine göre seviye bilgileri aşağıda belirtilmiştir.`)
                .addFields(
                  { name: `Sesli Sohbet Seviye Bilgisi`, value: `Şuan ki seviye: \` ${data.voiceLevel} Sv. \` \n \` %${Math.floor((data.voiceXP ? data.voiceXP.toFixed(1) : 0)/((data.voiceLevel + 1) * 447)*100)} \` ${progressBar(data.voiceXP ? data.voiceXP.toFixed(1) : 0, (data.voiceLevel + 1) * 447, 6, data.voiceXP ? data.voiceXP.toFixed(1) : 0)} \`${data.voiceXP ? data.voiceXP.toFixed(1) : 0} / ${(data.voiceLevel + 1) * 447}\`` },
                  { name: `Sohbet Seviye Bilgisi`, value: `Şuan ki seviye: \` ${data.messageLevel} Sv. \`` }
                );

              await msg.edit({ embeds: [lvlEmbed], components: [Rowcuk] }).catch(err => {});
              await i.deferUpdate().catch(err => {});
            }
            if(i.values[0] == "rozetcik") {
              embedcik.setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({ dynamic: true, size: 2048 }) })
                .setDescription(`${uye} (${uye.roles.highest}) üyesinin \`${message.guild.name}\` sunucusunda yaptığı haftalık aktifliğe göre uygun rozet bilgileri aşağıda belirtilmiştir.`);
              await msg.edit({ embeds: [embedcik], components: [Rowcuk] }).catch(err => {});
              await i.deferUpdate().catch(err => {});
            }
            if(i.values[0] == "sorumluluklar") {
              let sorumlu = await Sorumluluk.find({});
              let Datacik = kullanicidata;
              sorumlu = sorumlu.filter(x => uye.roles.cache.has(x.role));

              let liderlikler = sorumlu.filter(x => x.name.includes("Lider") || x.name.includes("lider"));
              let sorumluluklar = sorumlu.filter(x => x.name.includes("Sorumlu") || x.name.includes("sorumlu") || x.name.includes("Sorumlusu") || x.name.includes("sorumlusu"));
              let diğerler = sorumlu.filter(x => !x.name.includes("Sorumlu") && !x.name.includes("sorumlu") && !x.name.includes("Sorumlusu") && !x.name.includes("sorumlusu") && !x.name.includes("Lider") && !x.name.includes("lider"));

              let respEmbed = new EmbedBuilder()
                .setThumbnail(uye.user.avatarURL({ dynamic: true, size: 2048 }))
                .setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({ dynamic: true, size: 2048 }) })
                .setDescription(`${uye} (${uye.roles.highest}) üyesinin ${message.guild.name} sunucusunda liderlik ve sorumluluk bilgileri aşağı da yer almaktadır.\n\n${message.guild.emojiGöster("acar_resp")} Bulunduğu Liderlikler (**${liderlikler.length || 0}**):\n${liderlikler.length > 0 ? liderlikler.map(x => `${x.name} (${message.guild.roles.cache.get(x.role)}) [\`${Datacik.Responsibilitys ? Datacik.Responsibilitys[x.role] ? `${Datacik.Responsibilitys[x.role].toFixed(2)} Puan` : `Puan Kazanılmamış!` : `Puan Kazanılmamış!`}\`]`).join("\n") : `Liderliği bulunduğu liderlik bulunamadı.`}\n\n${message.guild.emojiGöster("acar_resp")} Bulunduğu Sorumluluklar (**${sorumluluklar.length || 0}**):\n${sorumluluklar.length > 0 ? sorumluluklar.map(x => `${x.name} (${message.guild.roles.cache.get(x.role)})  [\`${Datacik.Responsibilitys ? Datacik.Responsibilitys[x.role] ? `${Datacik.Responsibilitys[x.role].toFixed(2)} Puan` : `Puan Kazanılmamış!` : `Puan Kazanılmamış!`}\`]`).join("\n") : `Sorumlu olduğu sorumluluk bulunamadı.`}\n\n${message.guild.emojiGöster("acar_resp")} Diğer (**${diğerler.length || 0}**):\n${diğerler.length > 0 ? diğerler.map(x => `${x.name} (${message.guild.roles.cache.get(x.role)})  [\`${Datacik.Responsibilitys ? Datacik.Responsibilitys[x.role] ? `${Datacik.Responsibilitys[x.role].toFixed(2)} Puan` : `Puan Kazanılmamış!` : `Puan Kazanılmamış!`}\`]`).join("\n") : `Üzerinde bulunan diğer liderlik veya sorumluluk bulunamadı.`}\n`)
                .setFooter({ text: `Yukarıda bulunan liderlik veya sorumluluklara ait görevler yapılmadığında bot tarafından otomatik olarak üzerinden alınır.` });

              await msg.edit({ embeds: [respEmbed], components: [Rowcuk] });
              await i.deferUpdate().catch(err => {});
            }
            if(i.values[0] == "genel") {
              await msg.edit({ embeds: [embed], components: [Rowcuk] }).catch(err => {});
              await i.deferUpdate().catch(err => {});
            }
            if(i.values[0] == "toplantı") {
              let dataMeeting = kullanicidata;
              let genelKatilim = dataMeeting.Meetings.sort((a, b) => b.Date - a.Date).filter(x => x.Status && x.Status == "KATILDI");
              let genelMazeretli = dataMeeting.Meetings.sort((a, b) => b.Date - a.Date).filter(x => x.Status && x.Status == "MAZERETLİ");
              let genelKatılmadı = dataMeeting.Meetings.sort((a, b) => b.Date - a.Date).filter(x => x.Status && x.Status == "KATILMADI");
              let Katilim = dataMeeting.Meetings.sort((a, b) => b.Date - a.Date).slice(0,3).filter(x => x.Status && x.Status == "KATILDI");
              let Katılmadı = dataMeeting.Meetings.sort((a, b) => b.Date - a.Date).slice(0,3).filter(x => x.Status && x.Status == "KATILMADI");
              let mazeretliAmk = dataMeeting.Meetings.sort((a, b) => b.Date - a.Date).slice(0,3).filter(x => x.Status && x.Status == "MAZERETLİ");
              let bireyselAmk = dataMeeting.Meetings.filter(x => x.Meeting == "BİREYSEL");
              
              let meetEmbed = new EmbedBuilder()
                .setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({ dynamic: true, size: 2048 }) })
                .setDescription(`${uye} (${uye.roles.highest}) üyesinin ${message.guild.name} sunucusunda katıldığı veya katılmadığı tüm toplantı bilgileri aşağıda belirtilmiştir.\n\n**Toplantı Durumu**:\nToplamda ${dataMeeting.Meetings ? dataMeeting.Meetings.length : 0} toplantı gerçekleşti. Bu toplantılardan ${bireyselAmk ? bireyselAmk.length : 0} tanesi bireysel toplantı'dır. Bu toplantılardan son yapılan 3 tanesi göz önünde bulundurulur. ${Upstaffs ? `${Number(Katilim ? Katilim.length : 0) < Number(Katılmadı ? Katılmadı.length : 0) ? `Bu durum senin katılım azlığından dolayı yetki yükseltiminde seni olumsuz etkileycektir.` : `Bu toplantılardan olumsuz olarak etkilenmeyeceksiniz.`}` : `Bu toplantılardan olumsuz olarak etkilenmeyeceksiniz.`}\n\n**Geçerli Katılım Bilgisi**:\nGeçerli Toplantı Katılım: \` +${Katilim ? Katilim.length : 0} Geçerli Katılım \` (Katılmadı: \` -${Katılmadı ? Katılmadı.length : 0} \`)\nGeçerli Bireysel Toplantı Katılım: \` +${dataMeeting.Meetings ? dataMeeting.Meetings.slice(0, 3).filter(x => x.Meeting == "BİREYSEL" && x.Status && x.Status == "KATILDI").length : 0} \` (Katılmadı: \` -${dataMeeting.Meetings ? dataMeeting.Meetings.slice(0, 3).filter(x => x.Meeting == "BİREYSEL" && x.Status && x.Status == "KATILMADI").length : 0} \`) \nGeçerli Mazeretli/İzinli: \` ${mazeretliAmk ? mazeretliAmk.length : 0} \` \n\n**Genel Katılım Bilgisi**:\nGenel Toplantı Katılım: \` +${genelKatilim ? genelKatilim.length : 0} Katılım \` (Katılmadı: \` -${genelKatılmadı ? genelKatılmadı.length : 0} \`)\nGenel Bireysel Toplantı Katılım: \` +${dataMeeting.Meetings ? dataMeeting.Meetings.filter(x => x.Meeting == "BİREYSEL" && x.Status && x.Status == "KATILDI").length : 0} \` (Katılmadı: \` -${dataMeeting.Meetings ? dataMeeting.Meetings.filter(x => x.Meeting == "BİREYSEL" && x.Status && x.Status == "KATILMADI").length : 0} \`) \nGenel Mazeretli/İzinli: \` ${genelMazeretli ? genelMazeretli.length : 0} \` \n\n**Son 5 Toplantı Detayı**:\n${dataMeeting.Meetings.sort((a, b) => b.Date - a.Date).slice(0,5).map(x => `\` ${x.Meeting} \` ${message.guild.channels.cache.get(x.Channel) || "#deleted-channel"} <t:${String(x.Date).slice(0, 10)}:R> [**${x.Status}**]`).join("\n")}`);
                
              await msg.edit({ embeds: [meetEmbed], components: [Rowcuk] }).catch(err => {});
              await i.deferUpdate().catch(err => {});
            }
            if(i.values[0] == "songorulme") {
              let platform = { web: 'İnternet Tarayıcısı', desktop: 'PC (App)', mobile: 'Mobil' };
              let bilgi = (uye.presence && uye.presence.status !== 'offline') ? `${platform[Object.keys(uye.presence.clientStatus)[0]]}` : `Çevrim-Dışı!`;

              let sonAktif = SonGörülme.lastOnline;
              let sonDeAktif = SonGörülme.lastOffline;
              let sonMesaj = SonGörülme.lastMessage;
              let sonSes = SonGörülme.lastVoice;
              let sonResim = SonGörülme.lastAvatar;
              let sonKullanıcıAdı = SonGörülme.lastUsername;
              let sonEtiket = SonGörülme.lastDiscriminator;
              let txt = '';
           
              if(SonGörülme.last) {
                let type = SonGörülme.last.type;
                if(type == "ONLINE") txt = `${message.guild.emojiGöster("andale_arrow")} En son <t:${String(sonAktif).slice(0, 10)}:R> çevrim-içi oldu veya cihaz değiştirdi.`;
                if(type == "OFFLINE") txt = `${message.guild.emojiGöster("andale_arrow")} En son <t:${String(sonDeAktif).slice(0, 10)}:R> çevrim-dışı oldu.`;
                if(type == "VOICE") txt = `${message.guild.emojiGöster("andale_arrow")} En son <t:${String(sonSes).slice(0, 10)}:R> <#${SonGörülme.last.channel}> isimli ses kanalında görüldü.`;
                if(type == "MESSAGE") txt = `${message.guild.emojiGöster("andale_arrow")} Son etkinliği <t:${String(sonMesaj).slice(0, 10)}:R> <#${SonGörülme.last.channel}> isimli kanala \`${SonGörülme.last.text}\` mesajını gönderdi.`;
                if(type == "AVATAR") txt = `${message.guild.emojiGöster("andale_arrow")} Son etkinliği <t:${String(sonResim).slice(0, 10)}:R> profil resmini değiştirdi.`;
                if(type == "USERNAME") txt = `${message.guild.emojiGöster("andale_arrow")} Son etkinliği <t:${String(sonKullanıcıAdı).slice(0, 10)}:R> ${SonGörülme.last.old} olan kullanıcı adını ${SonGörülme.last.new} olarak değiştirdi.`;
                if(type == "DISCRIMINATOR") txt = `${message.guild.emojiGöster("andale_arrow")} Son etkinliği <t:${String(sonEtiket).slice(0, 10)}:R> #${SonGörülme.last.old} olan etiketini #${SonGörülme.last.new} olarak değiştirdi.`;
              }
             
              let seenEmbed = new EmbedBuilder()
                .setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({ dynamic: true, size: 2048 }) })
                .setDescription(`${uye} (${uye.roles.highest}) üyesinin en son bilgileri ve görülme bilgileri detaylı bir şekilde aşağıda belirtilmiştir.\n\n${message.guild.emojiGöster("andale_arrow")} Son Görülme: <t:${String(SonGörülme.lastSeen).slice(0, 10)}:R> (\`${SonGörülme.last.type}\`)\n${sonAktif ? `${message.guild.emojiGöster("andale_arrow")} Çevrim-İçi: <t:${String(sonAktif).slice(0, 10)}:R>` : `${message.guild.emojiGöster("andale_arrow")} Çevrim-İçi: ~`}\n${sonDeAktif ? `${message.guild.emojiGöster("andale_arrow")} Çevrim-Dışı: <t:${String(sonDeAktif).slice(0, 10)}:R>` : `${message.guild.emojiGöster("andale_arrow")} Çevrim-Dışı: ~`}\n${sonMesaj ? `${message.guild.emojiGöster("andale_arrow")} Sohbetde Görülme: <t:${String(sonMesaj).slice(0, 10)}:R>` : `${message.guild.emojiGöster("andale_arrow")} Sohbetde Görülme: ~`}\n${sonSes ? `${message.guild.emojiGöster("andale_arrow")} Seste Görülme: <t:${String(sonSes).slice(0, 10)}:R>` : `${message.guild.emojiGöster("andale_arrow")} Seste Görülme: ~`}\n${sonResim ? `${message.guild.emojiGöster("andale_arrow")} Resim Güncelleme: <t:${String(sonResim).slice(0, 10)}:R>` : `${message.guild.emojiGöster("andale_arrow")} Resim Güncelleme: ~`}\n${sonKullanıcıAdı ? `${message.guild.emojiGöster("andale_arrow")} Kullanıcı Adı Güncelleme: <t:${String(sonKullanıcıAdı).slice(0, 10)}:R>` : `${message.guild.emojiGöster("andale_arrow")} Kullanıcı Adı Güncelleme: ~`}\n${sonEtiket ? `${message.guild.emojiGöster("andale_arrow")} Etiket Güncelleme: <t:${String(sonEtiket).slice(0, 10)}:R>` : `${message.guild.emojiGöster("andale_arrow")} Etiket Güncelleme: ~`}\n${txt ? txt : ''}`)
                .setThumbnail(uye.user.avatarURL({ dynamic: true, size: 2048 }));

              await msg.edit({ embeds: [seenEmbed], components: [Rowcuk] }).catch(err => {});
              await i.deferUpdate().catch(err => {});
            }
            if(i.values[0] == "haftalik") {
              let weeklyEmbed = new EmbedBuilder()
                .setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({ dynamic: true, size: 2048 }) })
                .setThumbnail(uye.user.avatarURL({ dynamic: true, size: 2048 }))
                .setDescription(`${uye} (${uye.roles.highest}) üyesinin \`${message.guild.name}\` sunucusunda bu haftanın ses ve mesaj bilgileri aşağıda belirtilmiştir.\n\n**Periyodik Toplamlar**\nSes: \` ${client.sureCevir(haftalikSesToplam)} \` Mesaj \` ${haftalikChatToplam} mesaj \` \n\n**Haftalık En İyi 5 Ses Kanalları**\n${Object.keys(haftalık).length > 0 ? Object.keys(haftalık).sort((x, y) => haftalık[y] - haftalık[x]).splice(0, 5).map((data, index) => {
                  let channel = message.guild.channels.cache.get(data);
                  return `\`${index + 1}.\` ${channel ? channel : "#deleted-channel"}: \`${client.sureCevir(haftalık[data])}\``;
                }).join("\n") : "Daha önce bir ses kanalına katılmamış!"}\n\n**Haftalık En İyi 5 Mesaj Kanalları**\n${Object.keys(haftalıkm).length > 0 ? Object.keys(haftalıkm).sort((x, y) => haftalıkm[y] - haftalıkm[x]).splice(0, 5).map((data, index) => {
                  let channel = message.guild.channels.cache.get(data);
                  return `\`${index + 1}.\` ${channel ? channel : "#deleted-channel"}: \`${haftalıkm[data]} mesaj\``;
                }).join("\n") : "Daha önce bir mesaj kanalına katılmamış!"}\n\n**Kategorilendirilmiş Haftalık Ses Listesi**\n${haftalikSesListe ? haftalikSesListe : `Daha önce kategorilendirilmiş haftalık ses istatistiği bulunamadı!`}\n\n**Kategorilendirilmiş Haftalık Mesaj Listesi**\n${haftalikChatListe ? haftalikChatListe : `Daha önce kategorilendirilmiş haftalık mesaj istatistiği bulunamadı!`}`);
                
              await msg.edit({ embeds: [weeklyEmbed], components: [Rowcuk] }).catch(err => {});
              await i.deferUpdate().catch(err => {});
            }
            if(i.values[0] == "topstat") {
              await msg.delete().catch(err => {});
              let kom = client.commands.find(x => x.Isim == "top");
              kom.onRequest(client, message, args);
              message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined);
              await i.deferUpdate().catch(err => {});
            }
            if(i.values[0] == "panelaç") {
              await msg.delete().catch(err => {});
              let kom = client.commands.find(x => x.Isim == "terfi");
              kom.onRequest(client, message, args);
              message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined);
              await i.deferUpdate().catch(err => {});
            }
            if(i.values[0] == "buttonpanel") {
              await msg.delete().catch(err => {});
              let kom = client.commands.find(x => x.Isim == "yetki");
              kom.onRequest(client, message, args);
              message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined);
              await i.deferUpdate().catch(err => {});
            }
            if(i.values[0] == "buttoniptal") {
              await msg.delete().catch(err => {});
              message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined);
              await i.deferUpdate().catch(err => {});
            }
          });

        collector.on('end', async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        StringSelectMenuBuilder.from(Rowcuk.components[0]).setDisabled(true)
      );
      await msg.edit({ components: [disabledRow] }).catch(err => {});
    });
    });
  }
};

function capitalizeIt(str) {
  if (str && typeof (str) === "string") {
    str = str.split(" ");
    for (var i = 0, x = str.length; i < x; i++) {
      if (str[i]) {
        str[i] = str[i][0].toUpperCase() + str[i].substr(1);
      }
    }
    return str.join(" ");
  } else {
    return str;
  }
}

function getContent(duration) {
  let arr = [];
  if (duration / 3600000 > 1) {
    let val = parseInt(duration / 3600000);
    let durationn = parseInt((duration - (val * 3600000)) / 60000);
    arr.push(`${val} saat`);
    arr.push(`${durationn} dk.`);
  } else {
    let durationn = parseInt(duration / 60000);
    arr.push(`${durationn} dk.`);
  }
  return arr.join(", ");
}