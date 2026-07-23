const { 
    Client, 
    Message, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionsBitField
} = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed"); // V14: genEmbed'in EmbedBuilder döndürdüğünü varsayıyorum
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');
const MEETING_INFO = require('../../../../Global/Databases/Client.Guilds.Meetings');
const Users = require('../../../../Global/Databases/Client.Users');
const Upstaffs = require('../../../../Global/Databases/Client.Users.Staffs');

// Global değişkenler yerine yerel require'ları kullanmak daha güvenlidir.
// Eğer botunuz bu verileri global'e yüklüyorsa, bu satırları silebilirsiniz.
const roller = require("../../../../Global/Settings/Roles.json")
const cevaplar = require("../../../../Global/Settings/Reply")
const emojiler = require("../../../../Global/Settings/Emoji.json")
const ayarlar = require("../../../../Global/Settings/System.json")
const kanallar = require("../../../../Global/Settings/Channels.json")

// Varsayım: global.tarihsel ve global.meetingTime fonksiyonlarının dışarıdan erişilebilir olması gerekiyor.

// Toplantı Süresi Hesaplama Fonksiyonu (Local olarak tutmak daha iyidir)
function meetingTime(duration) { 
    let arr = [];
    if (duration / 3600000 > 1) {
        let val = parseInt(duration / 3600000);
        let durationn = parseInt((duration - (val * 3600000)) / 60000);
        arr.push(`${val} saat`);
        arr.push(`${durationn} dakika`);
    } else {
        let durationn = parseInt(duration / 60000);
        arr.push(`${durationn} dakika`);
    }
    return arr.join(", ");
};

module.exports = {
    Isim: "toplantı",
    Komut: ["toplanti", "yoklama","bireysel"],
    Kullanim: "toplantı <[Bireysel: toplantı <@andale/ID>]>",
    Aciklama: "Belirtilen üyenin profil resmini büyültür.",
    Kategori: "kurucu",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: async function (client) {
    client._cached = new Map();

  },

   /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */

  onRequest: async function (client, message, args) {
        // Gerekli ayarların kontrolü
        // Global yerine require edilen değişkenleri kullanmaya başladık.
        const gRoller = global.roller || roller; // Global varsa onu kullan, yoksa yerel require'ı kullan.
        const gCevaplar = global.cevaplar || cevaplar;
        const gAyarlar = global.ayarlar || ayarlar;
        const gEmojiler = global.emojiler || emojiler;
        
        if(!gRoller || !gRoller.Katıldı || !gRoller.üstYönetimRolleri || !gRoller.yönetimRolleri || !gRoller.kurucuRolleri || !gRoller.altYönetimRolleri) return message.reply(gCevaplar.notSetup);
        
        // Yetki Kontrolü
        if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && !gRoller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) {
            return message.reply(gCevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        let embed = new EmbedBuilder();
        let Data = await GUILDS_SETTINGS.findOne({ _id: 1 });
        let MeetingData = await MEETING_INFO.findOne({ guildID: message.guild.id });
        let meetingStatus = Data?.Ayarlar?.Toplantı || false; // Null check eklendi
        const toplantiKanal = message.member.voice.channel;
        
        // Ses kanalı kontrolü
        if(!toplantiKanal) return message.reply(`Toplantı sistemi için herhangi bir ses kanalında bulunmalısınız. ${gCevaplar.prefix}`).then(x => setTimeout(() => {
            x.delete().catch(err => {})
        }, 7500));
        
        // BİREYSEL TOPLANTI YÖNETİMİ
        if(message.mentions.members.first() || args[0]) {
            let uye = message.guild.members.cache.get(args[0]) || message.mentions.members.first();
            if(!uye) return message.react(message.guild.emojiGöster(gEmojiler.Iptal) ? message.guild.emojiGöster(gEmojiler.Iptal).id : undefined);
        
            let _getBireysel = client._cached.get(uye.id);

            let buttons = [
                new ButtonBuilder()
                .setLabel(`Bireysel ${_getBireysel ? "Katıldı Olarak Bitir!" : "Başlat!"}`)
                .setCustomId(_getBireysel ? "b_end" : "b_start")
                // Emoji ID'leri string olarak kalacak
                .setEmoji(_getBireysel ? "943265806547038310" : "943265806341513287") 
                .setStyle(ButtonStyle.Success),
            ];

            if(_getBireysel && _getBireysel.state == "START") {
                 buttons.push(
                    new ButtonBuilder()
                    .setLabel("İzinli/Mazeretli Olarak Bitir!")
                    .setCustomId("b_izinli")
                    .setStyle(ButtonStyle.Primary), 
                    new ButtonBuilder()
                    .setLabel("Katılmadı Olarak Bitir!")
                    .setCustomId("b_katilmadi")
                    .setStyle(ButtonStyle.Danger),
                );
            }
            
            let _row = new ActionRowBuilder().addComponents(buttons);
            
            let bmsg = await message.reply({content: `Bireysel toplantı ${uye.user.tag} için yükleniyor...`});

            await bmsg.edit({
                content: null, 
                embeds: [new genEmbed().setDescription(`Belirtilen ${uye} isimli üye için bireysel toplantı yönetimi aşağıda bulunan düğmeler ile yönetilebilir.`)], 
                components: [_row]
            });

            var filter = (i) => i.user.id == message.author.id;
            let _collector = bmsg.createMessageComponentCollector({filter: filter, time: 30000});

            _collector.on('collect', async (i) => {
                const now = Date.now();
                
                try {
                    // İşlemlerin hepsi i.deferUpdate() veya i.reply() ile başlanmalı.
                    if(i.customId == "b_katilmadi" || i.customId == "b_izinli" || i.customId == "b_end") {
                         await i.deferUpdate(); // Cevabı hemen gönderiyoruz
                    } else if (i.customId == "b_start") {
                        // b_start içinde i.reply kullanıldığı için deferUpdate'e gerek yok
                    }
                    
                    if(i.customId == "b_katilmadi") {
                        client._cached.delete(uye.id);
                        await Users.updateOne({_id: uye.id}, {$push: {
                            "Meetings": {
                                Meeting: "BİREYSEL",
                                Channel: message.member.voice.channel.id,
                                Date: now,
                                Status: "KATILMADI"
                            }
                        }}, {upsert: true});
                        
                        bmsg.edit({content: null, components: [], embeds: [new genEmbed().setDescription(`${uye} isimli üyenin bireysel toplantısı katılmadı olarak kaydedildi.`)]});
                        // deferUpdate kullanıldığı için i.reply yerine i.followUp kullanılmalı, ancak deferUpdate kullanıldığı için direkt edit yaptık.
                        message.channel.send({content: `Başarıyla ${uye} isimli üyenin toplantısı katılmadı olarak kaydedildi.`, ephemeral: true}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
                        _collector.stop();
                        setTimeout(() => { bmsg.delete().catch(err => {}) }, 5000);
                    }
                    
                    if(i.customId == "b_izinli") {
                        client._cached.delete(uye.id);
                        await Users.updateOne({_id: uye.id}, {$push: {
                            "Meetings": {
                                Meeting: "BİREYSEL",
                                Channel: message.member.voice.channel.id,
                                Date: now,
                                Status: "MAZERETLİ"
                            }
                        }}, {upsert: true});
                        
                        bmsg.edit({content: null, components: [], embeds: [new genEmbed().setDescription(`${uye} isimli üyenin bireysel toplantısı mazeretli olarak kaydedildi.`)]});
                        message.channel.send({content: `Başarıyla ${uye} isimli üyenin toplantısı mazeretli olarak kaydedildi.`, ephemeral: true}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
                        _collector.stop();
                        setTimeout(() => { bmsg.delete().catch(err => {}) }, 5000);
                    }
                    
                    if(i.customId == "b_start") {
                        // bmsg.delete() yerine içeriği hemen düzenleyip collector'u durduralım.
                        
                        let _get = client._cached.get(uye.id);
                        
                        if(_get && _get.state == "START") return i.reply({content: `Belirtilen ${uye} isimli üyenin aktif bireysel toplantısı bulunmaktadır.`, ephemeral: true});
                        
                        client._cached.set(uye.id, {
                            state: "START",
                            date: now,
                            channel: toplantiKanal.id,
                            author: message.author.id,
                        });
                        
                        let replyContent = `Başarıyla ${uye} isimli üye ile bireysel toplantıyı başlattın.`;

                        if(uye.voice && !uye.voice.channel) {
                            uye.send({content: `Merhaba! **${uye.user.tag}**
Şuan da ${toplantiKanal} kanalında bireysel toplantınız başladı. 
Lütfen sese katılın aksi taktirde sizin yetkinize yaptırım olacaktır.`}).catch(err => {
                                replyContent = `Başarıyla ${uye} isimli üyenin bireysel toplantısı başladı fakat **DM** kutusu kapalı olduğundan bildiremedim. Benim yerime sen bildirir misin?`;
                            });
                            i.reply({content: replyContent, ephemeral :true });
                        } else {
                            uye.send({content: `Merhaba! **${uye.user.tag}**
Şuan da ${toplantiKanal} kanalında bireysel toplantınız başladı.`}).catch(err => {});
                            i.reply({content: `Başarıyla ${uye} isimli üyenin bireysel toplantısı başlattın. Belirtilen üye ${uye.voice?.channel || "bir kanalda bulunmuyor."} kanalında seste bulunuyor.`, ephemeral :true });
                        }
                        
                        bmsg.delete().catch(err => {}); // Başlatıldıktan sonra mesajı sil
                        _collector.stop(); // Kolektörü durdur
                    }
                    
                    if(i.customId == "b_end") {
                        let _get = client._cached.get(uye.id);
                        if(!_get) return message.channel.send({content: `Belirtilen ${uye} isimli üyenin aktif bireysel toplantısı bulunmamaktadır.`, ephemeral: true}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
                        
                        await Users.updateOne({_id: uye.id}, {$inc: {
                            "Gold": 2
                        },$push: {
                            "Meetings": {
                                Meeting: "BİREYSEL",
                                Channel: message.member.voice.channel.id,
                                Date: now,
                                Status: "KATILDI"
                            },
                            "Transfers": { 
                                Uye: uye.id, 
                                Tutar: 2, 
                                Tarih: now,
                                Islem: "Altın (Bireysel Toplantı Bahşişi)"
                            }
                        }}, {upsert: true});
                        
                        let staffCheck = await Users.findOne({_id: uye.id});
                        let Upstaff = await Upstaffs.findOne({_id: uye.id});
                        if(staffCheck?.Staff && Upstaff) await client.Upstaffs.addPoint(uye.id, 50, "Toplantı");
                        
                        // Mesajı güncelle ve sonra sil
                        bmsg.edit({content: null, embeds: [
                            new genEmbed().setDescription(`**Bireysel Toplantı Kapatıldı!**

${uye} isimli kişisinin toplantısı ${meetingTime(now - _get.date)} sürmüş.
Toplantı verileri yetkisine yansıyacak şekilde kaydedildi ve ${message.member} tarafından sonlandırıldı.`)
                        ], components: []});

                        i.message.channel.send({content: `Başarıyla ${uye} isimli üyenin toplantısı katıldı olarak kaydedildi.`, ephemeral: true}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
                        
                        client._cached.delete(uye.id);
                        _collector.stop();
                        setTimeout(() => { bmsg.delete().catch(err => {}) }, 5000); // 5 saniye sonra sil

                    }
                } catch (error) {
                    console.error("Bireysel Toplantı Veritabanı Hatası:", error);
                    i.reply({content: "Veritabanı işleminde bir hata oluştu.", ephemeral: true}).catch(e => {});
                }
            });
            
            _collector.on('end', async (i, reason) => {
                if(reason == "time" && bmsg) {
                    bmsg.edit({content: "İşlem süresi dolduğu için bireysel toplantı yönetimi kapatıldı.", components: [], embeds: []}).catch(err => {});
                    setTimeout(() => { bmsg.delete().catch(err => {}) }, 5000);
                }
            });

            return;
        }

        // GENEL TOPLANTI YÖNETİMİ
        if(toplantiKanal && toplantiKanal.members.size < 1) return message.reply(`Toplantı sistemi için ses kanalınızda en az bir kişi olmalı. ${gCevaplar.prefix}`).then(x => setTimeout(() => {
            x.delete().catch(err => {})
        }, 7500));

        if(MeetingData?.authorId && MeetingData?.channelId && meetingStatus && message.guild.channels.cache.get(MeetingData.channelId) && message.member.voice.channel.id != MeetingData.channelId) {
             return message.reply(`Şuan da aktif bir toplantı var. ${message.guild.channels.cache.get(MeetingData.channelId) ? message.guild.channels.cache.get(MeetingData.channelId) : "#silinen-kanal"} kanalına girerek toplantıyı yönetebilirsin. ${gCevaplar.prefix}`).then(x => setTimeout(() => {
                x.delete().catch(err => {})
             }, 7500));
        }
        
        let Row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId("toplantıAç")
            .setLabel(`Toplantı ${meetingStatus ? "Bitir" : "Başlat"}`)
            .setStyle(meetingStatus ? ButtonStyle.Danger : ButtonStyle.Success),
            new ButtonBuilder()
            .setCustomId("Yoklama")
            .setLabel("Yoklama")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(meetingStatus ? false : true)
        );
        
        if(MeetingData?.Joining && MeetingData?.Leaving && MeetingData?.endDate && MeetingData?.Date) { // Null check eklendi
            embed.addFields({ 
                name: `Son Toplantı Bilgisi ${message.guild.emojiGöster("943286130357444608") || "📊"}`, 
                value: `
> Toplantıya **\`${MeetingData.Joining.length}\`** yetkili katılmış ${message.guild.emojiGöster(gEmojiler.Onay) || "✅"}
> Toplantıya **\`${MeetingData.Leaving.length}\`** yetkili katılmamış ${message.guild.emojiGöster(gEmojiler.Iptal) || "❌"}
> Toplantıya **\`${MeetingData.Leaving.length + MeetingData.Joining.length}\`** yetkili katılması beklendi.
> Yetkililerin **\`%${((MeetingData.Joining.length/(MeetingData.Leaving.length + MeetingData.Joining.length)) * 100 || 0).toFixed(1)}\`** katılmış. **\`%${((MeetingData.Leaving.length/(MeetingData.Leaving.length + MeetingData.Joining.length)) * 100 || 0).toFixed(1)}\`** katılmamış. 
> Toplantı ${message.guild.channels.cache.get(MeetingData.channelId) ? message.guild.channels.cache.get(MeetingData.channelId) : "#silinen-kanal"} kanalında gerçekleşmiş.
> Toplantı **\`${global.tarihsel ? global.tarihsel(MeetingData.Date) : new Date(MeetingData.Date).toLocaleDateString()}\`** tarihinde <@${MeetingData.authorId}> tarafından başlatılmış.
> Toplantı **\`${global.tarihsel ? global.tarihsel(MeetingData.endDate) : new Date(MeetingData.endDate).toLocaleDateString()}\`** tarihinde <@${MeetingData.endAuthorId}> tarafından bitirilmiş.
> Toplantı **\`${meetingTime(MeetingData.endDate - MeetingData.Date)}\`** sürmüş.
`
            });
        }
        
        message.reply({components: [Row], embeds: [embed
            .setDescription(`**Merhaba** ${message.member.user.tag}
**${gAyarlar.serverName}** sunucusunda şuan da toplantı durumu: **${meetingStatus ? "Aktif" : "Devre-dışı"}** ${meetingStatus ? message.guild.emojiGöster(gEmojiler.Onay) : message.guild.emojiGöster(gEmojiler.Iptal)}`)
        ]}).then(async (msg) => {
            var filter = (i) => i.user.id == message.member.id;
            let collector = msg.createMessageComponentCollector({filter: filter, time: 120000});

            collector.on('collect', async (i) => {
                const now = Date.now();
                
                await i.deferUpdate().catch(err => {}); // İşlem süresince butonu disabled yap.
                
                if(i.customId == "toplantıAç") {
                    Data = await GUILDS_SETTINGS.findOne({ _id: 1 });
                    let currentStatus = Data?.Ayarlar?.Toplantı || false;
                    
                    if(currentStatus) { // Toplantıyı Bitir
                        await GUILDS_SETTINGS.updateOne({_id: 1}, {$set: {"Ayarlar.Toplantı": false}}, {upsert: true});
                        await MEETING_INFO.updateOne({guildID: message.guild.id}, {$set: {
                            "endDate": now,
                            "endAuthorId": i.user.id,
                        }}, {upsert: true});
                        
                        let KatilimData = await MEETING_INFO.findOne({guildID: message.guild.id}) || {Joining: [],Leaving: [], Date: now, endDate: now};
                        
                        await msg.delete().catch(err => {});
                        collector.stop();
                        
                        // Toplantı Bitirme Mesajı
                        let totalExpected = KatilimData.Joining.length + KatilimData.Leaving.length;
                        await message.channel.send({embeds: [new genEmbed().setDescription(`Başarıyla ${message.member.voice.channel} kanalında bulunan toplandı bitirildi.
Son olarak katılım sağlayan tüm yetkililere ${message.guild.roles.cache.has(gRoller.Katıldı) ? message.guild.roles.cache.get(gRoller.Katıldı) : "@Silinen Rol"} rolü dağıtılmaya başlandı.\n
**Bitirilen Toplantı Bilgisi** ${message.guild.emojiGöster("943286130357444608") || "📊"}
> Bu toplantıda katılması beklenen: **(\`${totalExpected} yetkili\`)**
> Bu toplantıda katılım sağlayan: **(\`${KatilimData.Joining.length} yetkili\`)** ${message.guild.emojiGöster(gEmojiler.Onay) || "✅"}
> Bu toplantıda katılım sağlamayan: **(\`${KatilimData.Leaving.length} yetkili\`)** ${message.guild.emojiGöster(gEmojiler.Iptal) || "❌"}
> Bu toplantı  **\`${meetingTime(KatilimData.endDate - KatilimData.Date)}\`** sürmüş.`)]});
                        
                        // Katılanlara Rol ve Puan Ekleme
                        if(KatilimData && KatilimData.Joining.length > 0) {
                            KatilimData.Joining.forEach(async (id) => {
                                let uye = message.guild.members.cache.get(id);
                                if(uye) {
                                    uye.roles.add(gRoller.Katıldı).catch(err => {}); 
                                    await Users.updateOne({_id: uye.id}, {$inc: {
                                        "Gold": 1
                                    },$push: {
                                        "Meetings": {
                                            Meeting: "GENEL",
                                            Channel: KatilimData.channelId, // Toplantı kanal ID'sini MeetingData'dan aldık
                                            Date: now, // Bitiş tarihi kullanılmalı
                                            Status: "KATILDI"
                                        },
                                        "Transfers": { 
                                            Uye: uye.id, 
                                            Tutar: 1, 
                                            Tarih: now,
                                            Islem: "Altın (Toplantı Bahşişi)"
                                        }
                                    }}, {upsert: true});
                                    
                                    let staffCheck = await Users.findOne({_id: uye.id});
                                    let Upstaff = await Upstaffs.findOne({_id: uye.id});
                                    if(staffCheck?.Staff && Upstaff) await client.Upstaffs.addPoint(uye.id, 75, "Toplantı");
                                }
                            });
                        }
                        
                        // Katılmayanlara Durum Kaydetme
                        if(KatilimData && KatilimData.Leaving.length > 0) {
                            KatilimData.Leaving.forEach(async (id) => {
                                let uye = message.guild.members.cache.get(id);
                                if (uye) {
                                    let status = (gRoller.mazeretliRolü && uye.roles.cache.has(gRoller.mazeretliRolü)) ? "MAZERETLİ" : "KATILMADI";
                                    
                                    await Users.updateOne({_id: id}, {$push: {"Meetings": 
                                        {
                                            Meeting: "GENEL",
                                            Channel: KatilimData.channelId, // Toplantı kanal ID'sini MeetingData'dan aldık
                                            Date: now, // Bitiş tarihi kullanılmalı
                                            Status: status
                                        }
                                    }}, {upsert: true});
                                }
                            });
                        }
                        
                    } else { // Toplantıyı Başlat
                        await msg.delete().catch(err => {});
                        collector.stop();

                        let katildiRolü = message.guild.roles.cache.get(gRoller.Katıldı);
                        if(katildiRolü) {
                            // Roldeki üyelerden rolü kaldır
                            katildiRolü.members.map(x => {
                                x.roles.remove(katildiRolü.id).catch(err => {})
                            });
                        }
                        
                        await message.channel.send({embeds: [new genEmbed().setDescription(`Başarıyla ${message.member.voice.channel} kanalında toplantı başladı.`)]});
                        
                        await GUILDS_SETTINGS.updateOne({_id: 1}, {$set: {"Ayarlar.Toplantı": true}}, {upsert: true});
                        await MEETING_INFO.deleteMany({guildID: message.guild.id});
                        await MEETING_INFO.updateOne({guildID: message.guild.id}, {$set: {
                            "Date": now,
                            "authorId": i.user.id,
                            "channelId": message.member.voice.channel.id,
                            "Joining": [], // Sıfırlama için eklendi
                            "Leaving": []  // Sıfırlama için eklendi
                        }}, {upsert: true});
                    }
                }
                
                if(i.customId == "Yoklama") {
                    let KatilimData = await MEETING_INFO.findOne({guildID: message.guild.id}) || {Joining: [],Leaving: []};
                    let enAltYetkiliRolü = message.guild.roles.cache.get(gRoller.altilkyetki);
                    
                    if(!enAltYetkiliRolü) {
                        return message.channel.send({content: `${gRoller.altilkyetki} ID'li en alt yetkili rolü bulunamadı.`}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
                    }

                    await msg.edit({embeds: [new genEmbed().setDescription(`Şuan da ${message.member.voice.channel} toplantı kanalında, yoklama alınmaya başlandı.`)]});
                    
                    let uyeler = message.guild.members.cache; 
                    // En alt yetkili rolünden daha yüksek veya eşit pozisyonda olan yetkilileri filtrele.
                    let filteruye = uyeler.filter(uye => 
                        !uye.user.bot && 
                        uye.roles.highest.position >= enAltYetkiliRolü.position
                    );
                    
                    let sestekiYetkililer = filteruye.filter(uye => uye.voice.channel && uye.voice.channel.id == KatilimData.channelId);
                    let sesteOlmayanYetkililer = filteruye.filter(uye => !uye.voice.channel || uye.voice.channel.id != KatilimData.channelId); // Toplantı kanalında olmayanlar

                    // Seste Olanları İşle
                    sestekiYetkililer.forEach(async (uye) => {
                        // Zaten katılmışsa veya ayrılanlar listesindeyse güncelle
                        if (!KatilimData.Joining.includes(uye.id)) {
                            let updateQuery = {$push: {Joining: uye.id}};
                            if(KatilimData.Leaving.includes(uye.id)) {
                                updateQuery.$pull = {Leaving: uye.id};
                            }
                            await MEETING_INFO.updateOne({guildID: message.guild.id}, updateQuery, {upsert: true});
                        }
                    });

                    // Seste Olmayanları İşle
                    sesteOlmayanYetkililer.forEach(async (uye) => {
                        // Zaten ayrılanlar listesindeyse veya katılanlar listesindeyse güncelle
                        if (!KatilimData.Leaving.includes(uye.id)) {
                             let updateQuery = {$push: {Leaving: uye.id}};
                            if(KatilimData.Joining.includes(uye.id)) {
                                updateQuery.$pull = {Joining: uye.id};
                            }
                            await MEETING_INFO.updateOne({guildID: message.guild.id}, updateQuery, {upsert: true});
                        }
                    });
                    
                    await msg.edit({embeds: [new genEmbed().setDescription(`Başarıyla ${message.member.voice.channel} toplantı kanalında, yoklama alındı. ${message.guild.emojiGöster(gEmojiler.Onay) || "✅"}`)]});
                }
            });
            
            collector.on('end', async (i, reason) => {
                if (reason === 'time' && msg) {
                    msg.delete().catch(err => {});
                }
            });
        });

        // Fonksiyon dışına alındı (Zaten en üstte tanımlanmış)
    }
};