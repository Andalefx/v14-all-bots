const { Client, Message, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const Stats = require('../../../../Global/Databases/Client.Users.Stats')
const moment = require('moment');
require('moment-duration-format');
require('moment-timezone');
const { genEmbed } = require("../../../../Global/İnit/Embed");

// NOT: ayarlar, kanallar, emojiler ve tarihsel fonksiyonunun 
// projenizin Configs veya Init dosyalarından geldiği varsayılmıştır.



module.exports = {
    Isim: "top",
    Komut: ["topmesaj","topstat","topses"],
    Kullanim: "top",
    Aciklama: "Belirlenen üye veya kullanan üye eğer ki yetkiliyse onun yetki atlama bilgilerini gösterir.",
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
     const embed = new genEmbed()
    
    // V14 UYUMU: message.reply() obje formatında
     let load = await message.reply({content: `${message.guild.name} sunucusuna ait veri sıralaması yükleniyor. Lütfen bekleyin!`})

    // Veri çekme ve filtreleme (Aşağıdaki sıralamalar için ortak veri kaynağı)
    let data = await Stats.find({guildID: message.guild.id})
    data = data.filter(m => message.guild.members.cache.has(m.userID));
    
    // --- Sıralamalar için Birincileri ve Kullanıcının Sırasını Tutacak Değişkenler ---
    let genelsesbirinci;
    let publicbirinci;
    let mesajbirinci;
    let streamerbirinci;
    let registerbirinci;
    let genelmesajbirinci;
    let genelseseniyi;
    
    // Haftalık Kategori Ses Sıralamaları (Public, Streamer, Register)
    let genelPublic = ``, genelStreamer = ``, genelRegister = ``
    let PublicListele = data.sort((uye1, uye2) => {
        let uye2Toplam = 0;
        if(uye2.voiceStats) uye2.voiceStats.forEach((x, key) => { if(key == kanallar.publicKategorisi) uye2Toplam += x });
        let uye1Toplam = 0;
        if(uye1.voiceStats) uye1.voiceStats.forEach((x, key) => { if(key == kanallar.publicKategorisi) uye1Toplam += x });
        return uye2Toplam-uye1Toplam;
    }).map((m, index) => {
        let uyeToplam = 0;
        if(index == 0) publicbirinci = `<@${m.userID}>`
        m.voiceStats.forEach((x, key) => { if(key == kanallar.publicKategorisi) uyeToplam += x });

        if(m.userID === message.member.id) {
            if((index + 1) > 20) genelPublic = `\n\`${index + 1}.\` <@${m.userID}> \`${client.sureCevir(uyeToplam)}\` **(Siz)**`
        }
        return `\`${index + 1}.\` <@${m.userID}> \`${client.sureCevir(uyeToplam)}\` ${m.userID == message.member.id ? `**(Siz)**` : ``}`;
    }).slice(0, 20).join('\n');
    
    let streamerListele = data.sort((uye1, uye2) => {
        let uye2Toplam = 0;
        if(uye2.voiceStats) uye2.voiceStats.forEach((x, key) => { if(key == kanallar.streamerKategorisi) uye2Toplam += x });
        let uye1Toplam = 0;
        if(uye1.voiceStats) uye1.voiceStats.forEach((x, key) => { if(key == kanallar.streamerKategorisi) uye1Toplam += x });
        return uye2Toplam-uye1Toplam;
    }).map((m, index) => {
        let uyeToplam = 0;
        if(index == 0) streamerbirinci = `<@${m.userID}>`
        m.voiceStats.forEach((x, key) => { if(key == kanallar.streamerKategorisi) uyeToplam += x });
        if(m.userID === message.member.id) {
            if((index + 1) > 20) genelStreamer = `\n\`${index + 1}.\` <@${m.userID}> \`${client.sureCevir(uyeToplam)}\` **(Siz)**`
        }
        return `\`${index + 1}.\` <@${m.userID}> \`${client.sureCevir(uyeToplam)}\` ${m.userID == message.member.id ? `**(Siz)**` : ``}`;
    }).slice(0, 20).join('\n');

    let registerListele = data.sort((uye1, uye2) => {
        let uye2Toplam = 0;
        if(uye2.voiceStats) uye2.voiceStats.forEach((x, key) => { if(key == kanallar.registerKategorisi) uye2Toplam += x });
        let uye1Toplam = 0;
        if(uye1.voiceStats) uye1.voiceStats.forEach((x, key) => { if(key == kanallar.registerKategorisi) uye1Toplam += x });
        return uye2Toplam-uye1Toplam;
    }).map((m, index) => {
        let uyeToplam = 0;
        if(index == 0) registerbirinci = `<@${m.userID}>`
        m.voiceStats.forEach((x, key) => { if(key == kanallar.registerKategorisi) uyeToplam += x });
        if(m.userID === message.member.id) {
            if((index + 1) > 20) genelRegister = `\n\`${index + 1}.\` <@${m.userID}> \`${client.sureCevir(uyeToplam)}\` **(Siz)**`
        }
        return `\`${index + 1}.\` <@${m.userID}> \`${client.sureCevir(uyeToplam)}\` ${m.userID == message.member.id ? `**(Siz)**` : ``}`;
    }).slice(0, 20).join('\n');
    
    // Haftalık Genel Ses Sıralaması
    let genelSes = ``;
    let sesSıralaması = data.sort((uye1, uye2) => {
        let uye2Toplam2 = 0;
        if(uye2.voiceStats) uye2.voiceStats.forEach(x => uye2Toplam2 += x);
        let uye1Toplam2 = 0;
        if(uye1.voiceStats) uye1.voiceStats.forEach(x => uye1Toplam2 += x);
        return uye2Toplam2-uye1Toplam2;
    }).map((m, index) => {
        let uyeToplam2 = 0;
        if(index == 0) genelsesbirinci = `<@${m.userID}>`
        if(m.voiceStats) m.voiceStats.forEach(x => uyeToplam2 += x);
        if(m.userID === message.member.id) {
            if((index + 1) > 20) genelSes = `\n\`${index + 1}.\` <@${m.userID}> \`${client.sureCevir(uyeToplam2)}\` **(Siz)**`
        }
        return `\`${index + 1}.\` <@${m.userID}> \`${client.sureCevir(uyeToplam2)}\` ${m.userID == message.member.id ? `**(Siz)**` : ``}`;
    }).slice(0, 20).join('\n');
    
    // Haftalık Genel Mesaj Sıralaması
    let genelMesaj = ``
    let mesajSıralaması = data.sort((uye1, uye2) => {
        let uye2Toplam = 0;
        if(uye2.chatStats) uye2.chatStats.forEach(x => uye2Toplam += x);
        let uye1Toplam = 0;
        if(uye1.chatStats) uye1.chatStats.forEach(x => uye1Toplam += x);
        return uye2Toplam-uye1Toplam;
    }).map((m, index) => {
        let uyeToplam = 0;
        if(m.chatStats) m.chatStats.forEach(x => uyeToplam += x);
        if(index == 0) mesajbirinci = `<@${m.userID}>`
        if(m.userID === message.member.id) {
            if((index + 1) > 20) genelMesaj = `\n\`${index + 1}.\` <@${m.userID}> \`${uyeToplam} mesaj\` **(Siz)**`
        }
        return `\`${index + 1}.\` <@${m.userID}> \`${Number(uyeToplam)} mesaj\` ${m.userID == message.member.id ? `**(Siz)**` : ``}`;
    }).slice(0, 20).join('\n');
    
    // Tüm Zamanların Genel Ses Sıralaması
    let genelToplamSes = ``;
    let genelsesSıralaması = data.sort((uye1, uye2) => {
         let uye2Toplam2 = 0;
         if(uye2.lifeVoiceStats) uye2.lifeVoiceStats.forEach(x => uye2Toplam2 += x);
         let uye1Toplam2 = 0;
         if(uye1.lifeVoiceStats) uye1.lifeVoiceStats.forEach(x => uye1Toplam2 += x);
         return uye2Toplam2-uye1Toplam2;
     }).map((m, index) => {
         let uyeToplam2 = 0;
         if(index == 0) genelseseniyi = `<@${m.userID}>`
         if(m.lifeVoiceStats) m.lifeVoiceStats.forEach(x => uyeToplam2 += x);
         if(m.userID === message.member.id) {
            if((index + 1) > 20) genelToplamSes = `\n\`${index + 1}.\` <@${m.userID}> \`${client.sureCevir(uyeToplam2)}\` **(Siz)**`
        }
         return `\`${index + 1}.\` <@${m.userID}> \`${client.sureCevir(uyeToplam2)}\` ${m.userID == message.member.id ? `**(Siz)**` : ``}`;
     }).slice(0, 20).join('\n');
    
    // Tüm Zamanların Genel Mesaj Sıralaması
    let genelToplamMesaj = ``
    let genelmesajSıralaması = data.sort((uye1, uye2) => {
         let uye2Toplam = 0;
         if(uye2.lifeChatStats) uye2.lifeChatStats.forEach(x => uye2Toplam += x);
         let uye1Toplam = 0;
         if(uye1.lifeChatStats) uye1.lifeChatStats.forEach(x => uye1Toplam += x);
         return uye2Toplam-uye1Toplam;
     }).map((m, index) => {
         let uyeToplam = 0;
         if(m.lifeChatStats) m.lifeChatStats.forEach(x => uyeToplam += x);
         if(index == 0) genelmesajbirinci = `<@${m.userID}>`
         if(m.userID === message.member.id) {
            if((index + 1) > 20) genelToplamMesaj = `\n\`${index + 1}.\` <@${m.userID}> \`${uyeToplam} mesaj\` **(Siz)**`
        }
         return `\`${index + 1}.\` <@${m.userID}> \`${Number(uyeToplam)} mesaj\` ${m.userID == message.member.id ? `**(Siz)**` : ``}`;
     }).slice(0, 20).join('\n');


    // --- Seçenekleri Oluşturma ---
        embed.setThumbnail(message.guild.iconURL({dynamic: true}))
        let opt = [
                {label: "🏆 Tüm Zamanların En İyileri",description: "Tüm zamanların en iyi istatistiğine sahip üyeleri", value: "geneleniyi"},
                {label: "🏆 Bu Haftanın En İyileri", description: "Bu haftanın en iyi istatistiğine sahip üyeleri", value: "evamk"},
                {label: "🎧 Genel Ses Sıralaması", description: "Tüm zamanların 20 genel ses sıralaması", value: "genelcik"},
                {label: "🎧 Haftalık Ses Sıralaması", description: "Bu haftanın 20 ses sıralaması", value: "geneltop"},
                {label: "🎧 Haftalık Public Sıralaması",description: "Bu haftanın 20 public odaları sıralaması", value: "orospuçocukları"},
                {label: "🎧 Haftalık Teyit Sıralaması",description: "Bu haftanın 20 teyit odaları sıralaması", value: "teyitcioç"},
                {label: "🎧 Haftalık Streamer Sıralaması",description: "Bu haftanın 20 streamer odaları sıralaması", value: "kamerayıgötünesokuyum"},
                {label: "🎥 Genel Yayın Sıralaması",description: "En çok 20 yayın açanların sıralaması", value: "yayınaçıyorlaramk"},
                {label: "📝 Genel Mesaj Sıralaması",description: "Tüm zamanların 20 genel mesaj sıralaması", value: "genelcikcik"},
                {label: "📝 Haftalık Mesaj Sıralaması",description: "Bu haftanın 20 mesaj sıralaması", value: "amınakodumunmesajı"},
                {label: "🔑 Genel Yetkili Sıralaması",description: "Tüm zamanların yetkili sıralaması", value: "yetkili"},
                {label: "💰 Genel Zengin Sıralaması",description: "Tüm zamanların zengin sıralaması", value: "zengin"},
                {label: "📋 Genel Görev Sıralaması",description: "Tüm zamanların görev sıralaması", value: "görev"},
                {label: "📩 Genel Davet Sıralaması",description: "Tüm zamanların davet sıralaması", value: "davet"},
                {label: "👍 Genel Kayıt Sıralaması",description: "Tüm zamanların kayıt sıralaması", value: "kayıt"},
        ]
        if(ayarlar.type) opt.push({label: "🎉 Genel Taglı Sıralaması",description: "Tüm zamanların taglı sıralaması", value: "taglı"})
        if(ayarlar.seviyeSistemi) opt.push({label: "👾 Genel Seviye Sıralaması",description: "Tüm zamanların seviye sıralaması", value: "seviye"})
        opt.push({label: "💎 Genel Takipçi Sıralaması" ,description: "Tüm zamanların en fazla takipçisine sahip üyeler", value: "takipçiler"})
        
    // V14 UYUMU: MessageSelectMenu yerine SelectMenuBuilder ve MessageActionRow yerine ActionRowBuilder
        let listele = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
            .setCustomId("acar_topcuk")
            .setPlaceholder("Sıralama kategorisi seçimi yapın!")
            .setOptions(opt)
        )
    
    // İlk mesajı düzenle
        load.edit({content: null, embeds: [new genEmbed().setDescription(`Aşağıda ki menüden **${ayarlar.serverName}** sunucusunun, tüm zamanlar veya haftalık istatistik verilerinin sıralamasını listeleyebilirsiniz.`)], components: [listele]}).then(async (msg) => {
    
    // V14 UYUMU: Collector oluşturma
            const filter = i => i.user.id === message.member.id && i.customId == "acar_topcuk";
            const collector = await msg.createMessageComponentCollector({ filter, time: 120000 });
  
            collector.on('collect', async (i) => {
                
                // V14 UYUMU: `message.guild.emojiGöster` kullanımı
                const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay) || undefined;

                if(i.values[0] == "seviye") {
                    msg.delete().catch(err => {})
                    message.react(onayEmoji).catch(err => {})
                    let kom = client.commands.find(x => x.Isim == "toplevel")
                    kom.onRequest(client, message, args)
                    i.deferUpdate().catch(err => {});
                }
                if(i.values[0] == "takipçiler") {
                    msg.delete().catch(err => {})
                    message.react(onayEmoji).catch(err => {})
                    let kom = client.commands.find(x => x.Isim == "toptakipçi")
                    kom.onRequest(client, message, args)
                    i.deferUpdate().catch(err => {});
                }
                if(i.values[0] == "yayınaçıyorlaramk") {
                    msg.delete().catch(err => {})
                    message.react(onayEmoji).catch(err => {})
                    let kom = client.commands.find(x => x.Isim == "topstreaming")
                    kom.onRequest(client, message, args)
                    i.deferUpdate().catch(err => {});
                }
                if(i.values[0] == "yetkili") {
                    msg.delete().catch(err => {})
                    message.react(onayEmoji).catch(err => {})
                    let kom = client.commands.find(x => x.Isim == "topyetkili")
                    kom.onRequest(client, message, args)
                    i.deferUpdate().catch(err => {});
                }
                if(i.values[0] == "zengin") {
                    msg.delete().catch(err => {})
                    message.react(onayEmoji).catch(err => {})
                    let kom = client.commands.find(x => x.Isim == "zenginler")
                    kom.onRequest(client, message, args)
                    i.deferUpdate().catch(err => {});
                }
                if(i.values[0] == "görev") {
                    msg.delete().catch(err => {})
                    message.react(onayEmoji).catch(err => {})
                    let kom = client.commands.find(x => x.Isim == "topgörev")
                    kom.onRequest(client, message, args)
                    i.deferUpdate().catch(err => {});
                }
                if(i.values[0] == "davet") {
                    msg.delete().catch(err => {})
                    message.react(onayEmoji).catch(err => {})
                    let kom = client.commands.find(x => x.Isim == "topdavet")
                    kom.onRequest(client, message, args)
                    i.deferUpdate().catch(err => {});
                }
                if(i.values[0] == "taglı") {
                    msg.delete().catch(err => {})
                    message.react(onayEmoji).catch(err => {})
                    let kom = client.commands.find(x => x.Isim == "toptaglı")
                    kom.onRequest(client, message, args)
                    i.deferUpdate().catch(err => {});
                }
                if(i.values[0] == "kayıt") {
                    msg.delete().catch(err => {})
                    message.react(onayEmoji).catch(err => {})
                    let kom = client.commands.find(x => x.Isim == "topteyit")
                    kom.onRequest(client, message, args)
                    i.deferUpdate().catch(err => {});
                }
                
                // --- Embed/Content Düzenleme İşlemleri (Tüm Zamanlar ve Haftalık En İyiler) ---
                if(i.values[0] == "geneleniyi") {
                    await msg.edit({
                        content: null,
                        embeds: [embed.setDescription(`:tada: Aşağı da **${message.guild.name}** sunucusunun tüm zamanların en iyileri sıralanmaktadır.

\` 👑 En İyi Ses \` ${genelseseniyi.id == message.member.id ? genelseseniyi + " **(Siz)**" : genelseseniyi}
\` 👑 En İyi Mesaj \` ${genelmesajbirinci.id == message.member.id ? genelmesajbirinci + " **(Siz)**" : genelmesajbirinci}
                        
Tüm zamanların iyileri \`${tarihsel(Date.now())}\` tarihinde otomatik olarak güncellenmiştir.`)], 
                        components: [listele]
                    }).catch(err => {});
                    i.deferUpdate().catch(err => {});
                }

                // Tüm Zamanların Genel Ses Sıralaması
                if(i.values[0] == "genelcik") {
                    const voiceEmoji = message.guild.emojis.cache.get(emojiler.voiceDeaf) || '';
                    await msg.edit({
                        content: null, 
                        embeds: [embed.setDescription(`${voiceEmoji} Aşağı da **${message.guild.name}** sunucusunun genel ses sıralaması (**Tüm zamanlar**) listelenmektedir.
        
${genelsesSıralaması ? genelsesSıralaması + `${genelToplamSes}` : "`Bu sunucuda genel ses aktifliği bulunamadı."}`)], 
                        components: [listele]
                    }).catch(err => {});
                    i.deferUpdate().catch(err => {});
                }

                // Tüm Zamanların Genel Mesaj Sıralaması
                if(i.values[0] == "genelcikcik") {
                    const chatEmoji = message.guild.emojis.cache.get(emojiler.chatMuteKaldırıldı) || '';
                    await msg.edit({
                        content: null,
                        embeds: [ embed.setDescription(`${chatEmoji} Aşağı da **${message.guild.name}** sunucusunun tüm zamanların sohbet(\` mesaj \`) sıralaması listelenmektedir.
        
${genelmesajSıralaması ? genelmesajSıralaması + `${genelToplamMesaj}` : "`Bu sunucuda mesaj aktifliği bulunamadı."}`)], 
                        components: [listele]
                    }).catch(err => {});
                    i.deferUpdate().catch(err => {});
                }
                
                // Haftalık En İyiler
                if(i.values[0] == "evamk") {
                    await msg.edit({
                        content: null,
                        embeds: [embed.setDescription(`:tada: Aşağı da **${message.guild.name}** sunucusunun bu haftanın en iyileri sıralanmaktadır.

\` 👑 Public Odalar \` ${publicbirinci.id == message.member.id ? publicbirinci + " **(Siz)**" : publicbirinci}
\` 👑 Teyit Odalar \` ${registerbirinci.id == message.member.id ? registerbirinci + " **(Siz)**" : registerbirinci}
\` 👑 Streamer Odalar \` ${streamerbirinci.id == message.member.id ? streamerbirinci + " **(Siz)**" : streamerbirinci}
\` 👑 Haftalık Ses Sıralama \` ${genelsesbirinci.id == message.member.id ? genelsesbirinci + " **(Siz)**" : genelsesbirinci}
\` 👑 Haftalık Mesaj Sıralaması \` ${mesajbirinci.id == message.member.id ? mesajbirinci + " **(Siz)**" : mesajbirinci}
        
Bu haftanın en iyileri \`${tarihsel(Date.now())}\` tarihinde otomatik olarak güncellenmiştir.
        `)], 
                        components: [listele]
                    }).catch(err => {});
                    i.deferUpdate().catch(err => {});
                }
                
                // Haftalık Genel Ses Sıralaması
                if(i.values[0] == "geneltop") {
                    const voiceEmoji = message.guild.emojis.cache.get(emojiler.voiceDeaf) || '';
                    await msg.edit({
                        content: null, 
                        embeds: [embed.setDescription(`${voiceEmoji} Aşağı da **${message.guild.name}** sunucusunun bu haftanın ses sıralaması listelenmektedir.
        
${sesSıralaması ? sesSıralaması + `${genelSes}` : "`Bu sunucuda genel ses aktifliği bulunamadı."}`)], 
                        components: [listele]
                    }).catch(err => {});
                    i.deferUpdate().catch(err => {});
                }

                // Haftalık Public Sıralaması
                if(i.values[0] == "orospuçocukları") {
                    const voiceEmoji = message.guild.emojis.cache.get(emojiler.voiceDeaf) || '';
                    const channelName = message.guild.channels.cache.get(kanallar.publicKategorisi) || "public ses";
                    await msg.edit({
                        content: null,
                        embeds: [embed.setDescription(`${voiceEmoji} Aşağı da **${message.guild.name}** sunucusunun bu haftanın ${channelName} sıralaması listelenmektedir.
        
${PublicListele ? PublicListele + `${genelPublic}` : "`Bu sunucuda public ses aktifliği bulunamadı."}`)], 
                        components: [listele]
                    }).catch(err => {});
                    i.deferUpdate().catch(err => {});
                }

                // Haftalık Teyit (Register) Sıralaması
                if(i.values[0] == "teyitcioç") {
                    const voiceEmoji = message.guild.emojis.cache.get(emojiler.voiceDeaf) || '';
                    const channelName = message.guild.channels.cache.get(kanallar.registerKategorisi) || "teyit ses";
                    await msg.edit({
                        content: null,
                        embeds: [embed.setDescription(`${voiceEmoji} Aşağı da **${message.guild.name}** sunucusunun bu haftanın ${channelName} sıralaması listelenmektedir.
        
${registerListele ? registerListele + `${genelRegister}` : "`Bu sunucuda teyit ses aktifliği bulunamadı."}`)], 
                        components: [listele]
                    }).catch(err => {});
                    i.deferUpdate().catch(err => {});
                }

                // Haftalık Streamer Sıralaması
                if(i.values[0] == "kamerayıgötünesokuyum") {
                    const voiceEmoji = message.guild.emojis.cache.get(emojiler.sesMuteKaldırıldı) || '';
                    const channelName = message.guild.channels.cache.get(kanallar.streamerKategorisi) || "streamer ses";
                    await msg.edit({
                        content: null,
                        embeds: [embed.setDescription(`${voiceEmoji} Aşağı da **${message.guild.name}** sunucusunun bu haftanın ${channelName} sıralaması listelenmektedir.
        
${streamerListele ? streamerListele + `${genelStreamer}` : "`Bu sunucuda streamer ses aktifliği bulunamadı."}`)], 
                        components: [listele]
                    }).catch(err => {});
                    i.deferUpdate().catch(err => {});
                }

                // Haftalık Mesaj Sıralaması
                if(i.values[0] == "amınakodumunmesajı") {
                    const chatEmoji = message.guild.emojis.cache.get(emojiler.chatMuteKaldırıldı) || '';
                    await msg.edit({
                        content: null,
                        embeds: [ embed.setDescription(`${chatEmoji} Aşağı da **${message.guild.name}** sunucusunun bu haftanın sohbet(\` mesaj \`) sıralaması listelenmektedir.
        
${mesajSıralaması ? mesajSıralaması + `${genelMesaj}` : "`Bu sunucuda mesaj aktifliği bulunamadı."}`)], 
                        components: [listele]
                    }).catch(err => {});
                    i.deferUpdate().catch(err => {});
                }
           })
           collector.on('end', i => {
               msg.delete().catch(err => {})
           })
        })           
  }
};