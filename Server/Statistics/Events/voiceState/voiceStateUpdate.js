const { VoiceState, AttachmentBuilder, Collection, ChannelType } = require("discord.js");
const Stats = require("../../../../Global/Databases/Client.Users.Stats");
const Upstaffs = require("../../../../Global/Databases/Client.Users.Staffs");
const Tasks = require('../../../../Global/Databases/Client.Users.Tasks');
const GUILD_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings') 
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const mscik = require('ms')
const statRecods = new Collection();
const moment = require('moment')
const Voices = new Collection();
const Seens = require('../../../../Global/Databases/Guild.Users.Seens');
let tm = require('../../../../Global/Plugins/Time.Manager');

// Global nesnelerin çökme yaratmaması için emniyet kontrolü
const sistem = global.sistem || {};
const kanallar = global.kanallar || {};
const roller = global.roller || {};
const ayarlar = global.ayarlar || {};
const emojiler = global.emojiler || {};
const _statSystem = global._statSystem || {};
const uPConf = global.uPConf || { points: { tasks: 1 } };

client.on("ready", async () => {
  client.logger.log("İstatistik, davet, yetki sistemi verileri güncellendi.", "stat")
  
  const guild = client.guilds.cache.get(sistem.SERVER.ID);
  if (!guild) return;

  // Ses kanallarını filtreleme (v14 uyumlu ChannelType.GuildVoice)
  guild.channels.cache.filter(e => (e.type === ChannelType.GuildVoice || e.type === 2) && e.members.size > 0).forEach(channel => {
    channel.members.filter(member => !member.user.bot).forEach(member => {
      Voices.set(member.id, {
        ChannelID: channel.id,
        Time: Date.now()
      });

      if(kanallar.ayrıkKanallar && kanallar.ayrıkKanallar.some(x => channel.id == x)) {
        statRecods.set(member.id, {
          channel: channel.id,
          duration: Date.now()
        });
      } else {
        statRecods.set(member.id, {
          channel: channel.parentId || channel.id,
          duration: Date.now()
        });
      }
    });
  });

  // ÇÖZÜM: 3 saniyelik yoğun döngü 30 saniyeye çekildi ve sıralı asenkron hale getirildi.
  setInterval(async () => {
    try {
      const now = Date.now();
      
      for (const [key, value] of Voices.entries()) {
        const duration = now - value.Time;
        Voices.set(key, { ChannelID: value.ChannelID, Time: now });
        await dayStatsUpdate(key, value.ChannelID, duration);
      }

      for (const [key, value] of statRecods.entries()) {
        const duration = now - value.duration;
        await voiceInit(key, value.channel, duration);
        statRecods.set(key, {
          channel: value.channel,
          duration: now
        });
      }
    } catch (err) {
      console.error("Interval İstatistik Döngü Hatası:", err);
    }
  }, 30000); 
});

module.exports = async (oldState, newState) => {
  try {
    if ((oldState.member && oldState.member.user.bot) || (newState.member && newState.member.user.bot)) return;

    const memberId = oldState.id || newState.id;
    const now = Date.now();

    if (!oldState.channelId && newState.channelId) {
        Voices.set(memberId, {
            Time: now,
            ChannelID: newState.channelId
        });
        if(kanallar.ayrıkKanallar && kanallar.ayrıkKanallar.some(x => newState.channelId == x)) {
          statRecods.set(memberId, {
            channel: newState.channelId,
            duration: now
          });  
        } else {
          const channelObj = newState.guild.channels.cache.get(newState.channelId);
          statRecods.set(memberId, {
            channel: channelObj ? (channelObj.parentId || newState.channelId) : newState.channelId,
            duration: now
          });
        }
    }

    if(!Voices.has(memberId) && (oldState.channelId || newState.channelId)) {
      Voices.set(memberId, {
        Time: now,
        ChannelID: (oldState.channelId || newState.channelId)
      });
    }

    if (!statRecods.has(memberId) && (oldState.channelId || newState.channelId)) {
      const currentCh = newState.channelId || oldState.channelId;
      if(kanallar.ayrıkKanallar && kanallar.ayrıkKanallar.some(x => currentCh == x)) {
          statRecods.set(memberId, {
            channel: currentCh,
            duration: now
          });
      } else {
        const guildObj = newState.guild || oldState.guild;
        const channelObj = guildObj?.channels.cache.get(currentCh);
        statRecods.set(memberId, {
          channel: channelObj ? (channelObj.parentId || currentCh) : currentCh,
          duration: now
        });
      }
    }

    let data = statRecods.get(memberId);
    let duration = data ? (now - data.duration) : 0;
      
    if (oldState.channelId && !newState.channelId) {
      let datacik = Voices.get(memberId);
      if(datacik) {
        Voices.delete(memberId);
        let durationtwo = now - datacik.Time;
        await dayStatsUpdate(memberId, datacik.ChannelID, durationtwo, "VOICE", true);
      }

      if (data && duration > 0) await voiceInit(memberId, data.channel, duration);
      statRecods.delete(memberId);
    } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      let datacik = Voices.get(memberId);
      if(datacik) {
          Voices.set(memberId, {
            Time: now,
            ChannelID: newState.channelId
        });
        let durationtwo = now - datacik.Time;
        await dayStatsUpdate(memberId, datacik.ChannelID, durationtwo, "VOICE")
      }
      if (data && duration > 0) await voiceInit(memberId, data.channel, duration);
      
      if(kanallar.ayrıkKanallar && kanallar.ayrıkKanallar.some(x => newState.channelId == x)) {
        statRecods.set(memberId, {
          channel: newState.channelId,
          duration: now
        });
      } else {
        const channelObj = newState.guild.channels.cache.get(newState.channelId);
        statRecods.set(memberId, {
          channel: channelObj ? (channelObj.parentId || newState.channelId) : newState.channelId,
          duration: now
        });
      }
    }
  } catch (err) {
    console.error("Event Hatası:", err);
  }
}

module.exports.config = {
    Event: "voiceStateUpdate"
} 

client.kylockzSaatYap = (date) => { return moment.duration(date).format('H'); };

async function voiceInit(memberID, categoryID, duraction) {
  if (duraction <= 0) return;
  try {
    // ÇÖZÜM: Sorun çıkaran eski Mongoose callback yapısı kaldırıldı, temiz await getirildi.
    let data = await Stats.findOne({guildID: sistem.SERVER.ID, userID: memberID});
    
    if (!data) {
      let voiceMap = new Map();
      let chatMap = new Map();
      voiceMap.set(categoryID, duraction);
      let newMember = new Stats({
        guildID: sistem.SERVER.ID,
        userID: memberID,
        voiceStats: voiceMap,
        messageLevel: 1, messageXP: 0, voiceLevel: 1, voiceXP: 0,
        taskVoiceStats: voiceMap, upstaffVoiceStats: voiceMap,
        voiceCameraStats: new Map(), voiceStreamingStats:  new Map(),       
        totalVoiceStats: duraction, lifeVoiceStats: voiceMap, lifeTotalVoiceStats: duraction,
        lifeChatStats: chatMap, lifeTotalChatStats: 0, allVoice: {}, allMessage:{}, allCategory: {},
        chatStats: chatMap, upstaffChatStats: chatMap, totalChatStats: 0,
      });
      await newMember.save();
    } else {
      let lastUserData = data.voiceStats.get(categoryID) || 0;
      let lastLifeData = data.lifeVoiceStats.get(categoryID) || 0;
      let lastTaskData = data.taskVoiceStats.get(categoryID) || 0;
      let lastStaffData = data.upstaffVoiceStats.get(categoryID) || 0;
      
      data.voiceStats.set(categoryID, Number(lastUserData)+duraction);
      data.lifeVoiceStats.set(categoryID, Number(lastLifeData)+duraction);
      
      let guild = client.guilds.cache.get(sistem.SERVER.ID);
      let uye = guild ? guild.members.cache.get(memberID) : null;
      
      if(uye) {
        let datacikcik = await GUILD_SETTINGS.findOne({guildID: sistem.SERVER.ID})
        let guildData = datacikcik ? datacikcik.Ayarlar : null;
        if(guildData && guildData.seviyeSistemi) await voiceXP(uye.id, duraction / 1000, uye.voice ? uye.voice.channel : null)
        
        if(_statSystem.system) {
          if(_statSystem.staffs && _statSystem.staffs.some(x => uye.roles.cache.has(x.rol))) {
            data.upstaffVoiceStats.set(categoryID,  Number(lastStaffData)+duraction)
            if(guildData && guildData.Etkinlik == true && (guildData.etkinlikIzinliler && guildData.etkinlikIzinliler.some(x => x == categoryID))) {
              if (client.Upstaffs && typeof client.Upstaffs.addPoint === 'function') {
                await client.Upstaffs.addPoint(uye.id, guildData.etkinlikPuan ? guildData.etkinlikPuan : "0.001", "Etkinlik")
              }
            }
          }
          let data2 = await Upstaffs.findOne({_id: uye.id})
          if(data2 && data2.Mission) {
            data.taskVoiceStats.set(categoryID, Number(lastTaskData)+duraction);
            await checkTasks(uye, data2);
          }
        };
      }
      data.totalVoiceStats = Number(data.totalVoiceStats)+duraction;
      data.lifeTotalVoiceStats = Number(data.lifeTotalVoiceStats)+duraction
      await data.save();
    }
  } catch (err) {
    console.error("voiceInit Hatası:", err);
  }
}

async function dayStatsUpdate (id, channel, value, type, ver) {
  if (value <= 0) return;
  try {
    let days = await tm.getDay(global.sistem.SERVER.ID)
    let kategori = client.channels.cache.get(channel)
    
    if(ver && kategori) {
      let uye = kategori.guild.members.cache.get(id)
      if(uye && typeof uye.Leaders === 'function') {
        let multiply = (uye.voice && (uye.voice.selfMute || uye.voice.selfDeaf)) ? 2 : 10;
        let calculatedValue = (value / 1000 / 60 / 2) * multiply;

        if(kanallar.publicKategorisi && kanallar.publicKategorisi == kategori.parentId) uye.Leaders("pub", calculatedValue, {type: "VOICE", channel: kategori})
        if(kanallar.registerKategorisi && kanallar.registerKategorisi == kategori.parentId) {
          uye.Leaders("reg", calculatedValue, {type: "VOICE", channel: kategori})
          uye.Leaders("teyit", calculatedValue, {type: "VOICE", channel: kategori})
          uye.Leaders("kayıt", calculatedValue, {type: "VOICE", channel: kategori})
        }
        if(kanallar.streamerKategorisi && kanallar.streamerKategorisi == kategori.parentId) {
          uye.Leaders("stream", calculatedValue, {type: "VOICE", channel: kategori})
          uye.Leaders("cam", calculatedValue, {type: "VOICE", channel: kategori})
          uye.Leaders("yayın", calculatedValue, {type: "VOICE", channel: kategori})
        }
        if(kanallar.sorunCozmeKategorisi && kanallar.sorunCozmeKategorisi == kategori.parentId) {
          uye.Leaders("sorun", calculatedValue, {type: "VOICE", channel: kategori})
          uye.Leaders("criminal", calculatedValue, {type: "VOICE", channel: kategori})
          uye.Leaders("ceza", calculatedValue, {type: "VOICE", channel: kategori})
        }

        let kategoriget = client.channels.cache.get(kategori.parentId || "123")
        if(kategoriget && (kategoriget.name.toLowerCase().includes("etkinlik"))) uye.Leaders("etkinlik", calculatedValue, {type: "VOICE", channel: kategori})
        if(kategoriget && (kategoriget.name.toLowerCase().includes("oyun"))) uye.Leaders("oyun", calculatedValue, {type: "VOICE", channel: kategori})
      }
    }
    
    if(kategori && kategori.parentId) {
      await Stats.updateOne({ userID: id, guildID: global.sistem.SERVER.ID }, { $inc: { [`allVoice.${days}.${channel}`]: value, [`allCategory.${days}.${kategori.parentId}`]: value } }, { upsert: true })
    } else {
      await Stats.updateOne({ userID: id, guildID: global.sistem.SERVER.ID }, { $inc: { [`allVoice.${days}.${channel}`]: value} }, { upsert: true })
    }
  } catch (err) {
    console.error("dayStatsUpdate Hatası:", err);
  }
}

async function checkTasks (uye, data2) {
  try {
    let data = await Stats.findOne({guildID: sistem.SERVER.ID, userID: uye.id})
    if (!data) return;

    let logEmbed = new genEmbed().setThumbnail("https://preview.redd.it/qlne8pqzf0301.png?auto=webp&s=70da263d61a6d13378ff2b4aaab10e0bfa233fcf")
    let exRoleYetki = _statSystem.staffs ? _statSystem.staffs.find(x => x.No == data2.staffExNo) : null;
    let MissionData = await Tasks.findOne({roleID: exRoleYetki ? exRoleYetki.rol : 0, Active: true}) || await Tasks.findOne({ roleID: uye.roles.hoist ? uye.roles.hoist.id : 0 }) || await Tasks.findOne({ roleID: uye.roles.highest ? uye.roles.highest.id : 0 }) || await Tasks.findOne({ Users: uye.id })
    
    if(!MissionData || !MissionData.Active) return;
    if(typeof uye.guild.kanalBul !== 'function') return;
    let görevLog = uye.guild.kanalBul("görev-tamamlayan")
    
    if(MissionData.Active && MissionData.Time && MissionData.Time > 0 && Date.now() >= MissionData.Time) {
      let amınakodumunKanalı = uye.guild.kanalBul("görev-bilgi")
      let tamamlayanlar = MissionData.Completed || []
      let tamamlamayanlar = []
      let rolGetir = uye.guild.roles.cache.get(MissionData.roleID)
      if(rolGetir) {
        rolGetir.members.forEach(x => {
          if(!MissionData.Completed.includes(x.id)) tamamlamayanlar.push(x.id)
        })
        if(amınakodumunKanalı) {
          amınakodumunKanalı.send({
            content: `${rolGetir}`, 
            embeds: [new genEmbed()
              .setAuthor({ name: rolGetir.name, iconURL: "https://cdn.discordapp.com/emojis/943285259733184592.png?size=96&quality=lossless" })
              .setDescription(`Görev tamamlama zamanınız <t:${String(Date.now()).slice(0, 10)}:R> doldu!\n\n**İlk görevi tamamlayan**: ${uye.guild.members.cache.get(tamamlayanlar[0]) ? `${uye.guild.members.cache.get(tamamlayanlar[0])}` : `\` Tespit Edilmedi! \``}\n**Görevi tamamlayan**: \` ${tamamlayanlar.length} Kişi \`\n**Görevi tamamlamayanlar**: \` ${tamamlamayanlar.length} Kişi \`\n\nGörevi tamamlamayanlar yönetici onayı ile otomatik olarak düşürülecektir.\nGörevi tamamlayanlar ise yönetici onayı ile otomatik olarak yükseltilecektir veya yeni göreve tabi tutulacaktır.`)
              .setFooter({ text: `Anlık güncelleme ile "${rolGetir.name}" rolüne ait görev tamamiyle bitmiştir.` })]
          })
        }
      }
      await Tasks.updateOne({roleID: MissionData.roleID}, {$set: {"Active": false}}, {upsert: true});
      return;
    }

    let public = 0;
    let genelses = 0;
    
    data.taskVoiceStats.forEach(c => genelses += Number(c));
    if(roller.teyitciRolleri && roller.teyitciRolleri.some(x => uye.roles.cache.has(x))) {
      data.taskVoiceStats.forEach((value, key) => {
        if(key == kanallar.registerKategorisi) public += Number(value)  
      })
    } else {
      data.taskVoiceStats.forEach((value, key) => {
          if(key == kanallar.publicKategorisi || key == kanallar.streamerKategorisi) public += Number(value)  
      });
    }
    
    const rewardPoints = MissionData.Reward ? MissionData.Reward : uPConf.points.tasks;

    if(!data2.Mission.CompletedAllVoice && Number(client.kylockzSaatYap(genelses)) >= MissionData.AllVoice) {
      if(MissionData.AllVoice <= 0) return; 
      if(görevLog) görevLog.send({embeds: [logEmbed.setDescription(`${uye} isimli görev sahibi, **Genel Ses** görevini <t:${String(Date.now()).slice(0, 10)}:R> tamamlayarak \`${rewardPoints} Görev Puanı\` kazandı.`)]})
      await Users.updateOne({_id: uye.id}, {$inc: {"Coin": rewardPoints}}, {upsert: true})
      await Upstaffs.updateOne({_id: uye.id}, {$set: {"Mission.CompletedAllVoice": true}, $inc: { "Mission.completedMission": 1, "Point": rewardPoints, "ToplamPuan": rewardPoints, "Görev": rewardPoints }}, {upsert: true})
      if (client.Economy && typeof client.Economy.updateBalance === 'function') await client.Economy.updateBalance(uye.id, Number(MissionData.Reward), "add", 1) 
      return;
    }

    if(!data2.Mission.CompletedPublicVoice && Number(client.kylockzSaatYap(public)) >= MissionData.publicVoice) {
      if(MissionData.publicVoice <= 0) return; 
      if(görevLog) görevLog.send({embeds: [logEmbed.setDescription(`${uye} isimli görev sahibi, Ses **(**\`Sohbet, Streamer ve Kayıt\`**)** görevini <t:${String(Date.now()).slice(0, 10)}:R> tamamlayarak \`${rewardPoints} Görev Puanı\` kazandı.`)]})
      await Users.updateOne({_id: uye.id}, {$inc: {"Coin": rewardPoints}}, {upsert: true})
      await Upstaffs.updateOne({_id: uye.id}, {$set: {"Mission.CompletedPublicVoice": true}, $inc: { "Mission.completedMission": 1, "Point": rewardPoints, "ToplamPuan": rewardPoints, "Görev": rewardPoints }}, {upsert: true})
      if (client.Economy && typeof client.Economy.updateBalance === 'function') await client.Economy.updateBalance(uye.id, Number(MissionData.Reward), "add", 1) 
      return;
    }
    
    if(MissionData.countTasks && Number(MissionData.countTasks) > 0 && Number(data2.Mission.completedMission) >= 1) {
      if(Number(data2.Mission.completedMission) >= Number(MissionData.countTasks)) {
        if(MissionData.Completed && MissionData.Completed.includes(uye.id)) return;
        if(görevLog) {
          görevLog.send({content:`${uye}`, embeds: [new genEmbed()
            .setThumbnail("https://cdn.discordapp.com/attachments/985356878034911313/985361738813808700/unknown.png")
            .setDescription(`${uye} (\`${uye.id}\`) isimli görev sahibi, görev gereksinimlerini başarıyla <t:${String(Date.now()).slice(0, 10)}:R> tamamladı. ${uye.guild.emojiGöster ? uye.guild.emojiGöster(emojiler.Onay) : '✅'}\n${MissionData.Completed.length > 0 ? `Onunla beraber <@&${MissionData.roleID}> rolünün görevini **${MissionData.Completed.filter(x => x != uye.id).length}** kişi tamamladı.` : `Tebrik Ederim İlk <@&${MissionData.roleID}> Rolünün Görevini Tamamladı!`}`)]
          })
        }
        await Tasks.updateOne({roleID: MissionData.roleID}, {$push: {"Completed": uye.id}}, {upsert: true})
      }
    }
  } catch (err) {
    console.error("checkTasks Hatası:", err);
  }
}

async function voiceXP(id, xp, channel) {
  try {
    let voiceXPVal = ((Math.random() * 0.025) + 0.001).toFixed(3);
    await Stats.updateOne({guildID: sistem.SERVER.ID, userID: id}, {$inc: {"voiceXP": xp * voiceXPVal}}, {upsert: true})
    let _getStat = await Stats.findOne({guildID: sistem.SERVER.ID, userID: id})
    
    if(_getStat) {
      let yeniLevel = _getStat.voiceLevel * 447;
      if (yeniLevel <= _getStat.voiceXP) {
        await Stats.updateOne({guildID: sistem.SERVER.ID, userID: id}, {$inc: {"voiceLevel": 1, "voiceXP": 0}}, {upsert: true})
        
        const { Canvas } = require('canvas-constructor');
        const { loadImage } = require('canvas');

        let guild = client.guilds.cache.get(sistem.SERVER.ID)
        if(!guild) return;
        let uye = guild.members.cache.get(id)
        if(!uye) return;
        
        const avatar = await loadImage(uye.user.displayAvatarURL({ extension: "png" }));
        const background = await loadImage(`../../Assets/img/seviye.png`).catch(() => null);      
        if (!background) return;

        let xpStr = `${(_getStat.voiceLevel+1) * 447}`
        const image = new Canvas(740, 128)
          .printRoundedImage(background, 0, 0, 740, 128, 25)
          .printRoundedImage(avatar, 621, 12, 105.5, 105.5, 10)
          .setTextFont('14px Arial Black')
          .setColor("#fff")
          .printText(`+${2500*(_getStat.voiceLevel+1)} ${ayarlar.serverName || ''} Parası`, 350, 70, 350)
          .setTextFont('14px Arial Black')
          .setColor("#fff")
          .printText(`+1 Değerli Altın`, 350, 105, 350)

        if(xpStr.toString().length > 4) { 
            image.setTextFont('16px Arial Black').setColor("#fff").printText(`${xpStr} XP`, 112, 115,350)
        } else {
            image.setTextFont('16px Arial Black').setColor("#fff").printText(`${xpStr} XP`, 118, 115,350)
        }

        if ((_getStat.voiceLevel).toString().length == 1) {
            image.setTextFont('38px Arial Black').setColor("#fff").printText(`${_getStat.voiceLevel}`, 53,77,350)
        } else {
            image.setTextFont('38px Arial Black').setColor("#fff").printText(`${_getStat.voiceLevel}`, 40,77,350)
        }

        if ((_getStat.voiceLevel+1).toString().length == 1) {
            image.setTextFont('38px Arial Black').setColor("#fff").printText(`${_getStat.voiceLevel+1}`, 233 , 77 ,350)
        } else {
            image.setTextFont('38px Arial Black').setColor("#fff").printText(`${_getStat.voiceLevel+1}`, 220, 77,350)
        }
        
        // djs v14 için MessageAttachment -> AttachmentBuilder uyarlaması
        let attach = new AttachmentBuilder(image.toBuffer(), { name: "kylockz-seviye.png" });
        let kanal = client.channels.cache.get(channel ? channel.id : undefined)
        if(!kanal) return;

        kanal.send({
          content: `**Tebrikler!** ${uye}\nSesli sohbet seviyeniz yükseldi ve ödülleri kaptınız. (**\` ${_getStat.voiceLevel} -> ${_getStat.voiceLevel+1} \`**)`, 
          files: [attach]
        }).then(async (msg) => {
          if (client.Economy && typeof client.Economy.updateBalance === 'function') {
            await client.Economy.updateBalance(uye.id, Number(2500*(_getStat.voiceLevel+1)), "add", 1)
            await client.Economy.updateBalance(uye.id, Number(1), "add", 0)  
          }
          msg.react("998213747535523861").catch(() => {})
          setTimeout(() => { msg.delete().catch(() => {}) }, 30000)
        }).catch(err => console.error(err));
      }
    }
  } catch (err) {
    console.error("voiceXP Hatası:", err);
  }
}