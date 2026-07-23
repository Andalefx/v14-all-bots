const { VoiceState, MessageEmbed } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Users = require('../../../../Global/Databases/Client.Users');

 /**
  * @param {VoiceState} oldState
  * @param {VoiceState} newState 
  */

 module.exports = async (oldState, newState) => {
    // Client'a erişim için newState.client veya oldState.client kullanıldı
    const client = newState.client || oldState.client; 
    
    // Log kanalını bulma
    let logKanali = newState.guild.kanalBul("ses-log")
    if(!logKanali) return;
    
    // Üye bilgisini alma
    let uye = oldState.member || newState.member;
    if(!uye) return;
    
    // Sadece botun kendi ses durumu güncellemelerini yoksay
    if(uye.id === client.user.id) return;

    // Unix zaman damgası (saniye cinsinden)
    const timestamp = String(Date.now()).slice(0, 10);
    
    // 1. Durum: Ses Kanalına Katıldı (old: null, new: channel)
    if (!oldState.channelId && newState.channelId) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "KATILDI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`${newState.member} üyesi **<t:${timestamp}:R>** ${newState.channel} adlı sesli kanala **katıldı!**`)]}).catch(() => {});
    }
    
    // 2. Durum: Ses Kanalından Ayrıldı (old: channel, new: null)
    if (oldState.channelId && !newState.channelId) {
        await Users.updateOne({_id: oldState.id}, {$push: {"Voices": {
            channel: oldState.channelId,
            date: Date.now(),
            state: "AYRILDI"
        }}}, {upsert: true})
      return logKanali.send({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`${oldState.member} üyesi **<t:${timestamp}:R>** \`${oldState.guild.channels.cache.get(oldState.channelId).name}\` adlı sesli kanaldan **ayrıldı!**`)]}).catch(() => {});
    }
    
    // 3. Durum: Ses Kanalı Değiştirdi (old: channel, new: different channel)
    if(oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        let entry = await newState.guild.fetchAuditLogs({ type: 24, limit: 1 }).then(audit => audit.entries.first()); // AuditLogEntryType.MemberMove = 24
        
        // Taşıma işlemi bot veya başka bir yönetici tarafından yapıldıysa (MEMBER_MOVE)
        if(entry && entry.targetId === newState.id && entry.executor.id !== newState.id && entry.executor.id !== client.user.id && entry.createdTimestamp > (Date.now() - 5000)) {
            await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
                channel: newState.channelId,
                date: Date.now(),
                entry: entry.executor.id,
                state: "TAŞINDI"
            }}}, {upsert: true})
            return logKanali.send({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`:arrow_up_down: ${newState.member} üyesi ${newState.guild.members.cache.get(entry.executor.id)} tarafından **<t:${timestamp}:R>** ${oldState.channel} adlı ses kanalından ${newState.channel} adlı ses kanalına **taşındı!**`)]})
        }
        
        // Üye Kendi Kanalını Değiştirdi
        if(!entry || entry.executor.id === newState.id || entry.executor.id === client.user.id || entry.createdTimestamp < (Date.now() - 5000)) {
            await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
                channel: newState.channelId,
                date: Date.now(),
                state: "DEĞİŞTİ"
            }}}, {upsert: true})
            return logKanali.send({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`${newState.member} üyesi **<t:${timestamp}:R>** ses kanalını **değiştirdi!** (\`${newState.guild.channels.cache.get(oldState.channelId).name}\` => ${newState.channel})`)]}).catch(() => {});
        }
    }
    
    // 4. Durum: Mikrofon Açıldı (selfMute: true -> false)
    if (oldState.channelId && oldState.selfMute && !newState.selfMute) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "MİKROFON AÇILDI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`${newState.member} üyesi **<t:${timestamp}:R>** ${newState.channel} adlı sesli kanalda kendi susturmasını **kaldırdı!**`)]}).catch(() => {});
    }
    
    // 5. Durum: Mikrofon Kapatıldı (selfMute: false -> true)
    if (oldState.channelId && !oldState.selfMute && newState.selfMute) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "MİKROFON KAPATTI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`${newState.member} üyesi **<t:${timestamp}:R>** ${newState.channel} adlı sesli kanalda kendini **susturdu!**`)]}).catch(() => {});
    }
    
    // 6. Durum: Sağırlaştırma Kaldırıldı (selfDeaf: true -> false)
    if (oldState.channelId && oldState.selfDeaf && !newState.selfDeaf) {
        return logKanali.send({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`${newState.member} üyesi **<t:${timestamp}:R>** ${newState.channel} adlı sesli kanalda kendi sağırlaştırmasını **kaldırdı!**`)]}).catch(() => {});
    }
    
    // 7. Durum: Sağırlaştırıldı (selfDeaf: false -> true)
    if (oldState.channelId && !oldState.selfDeaf && newState.selfDeaf) {
        return logKanali.send({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`${newState.member} üyesi **<t:${timestamp}:R>** ${newState.channel} adlı sesli kanalda kendini **sağırlaştırdı!**`)]}).catch(() => {});
    }
    
    // 8. Durum: Yayın Açtı (streaming: false -> true)
    if(oldState.channelId && !oldState.streaming && newState.channelId && newState.streaming) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "YAYIN AÇTI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`:desktop: ${newState.member} üyesi **<t:${timestamp}:R>** ${newState.channel} adlı ses kanalında **yayın açtı!**`)]});
    }
    
    // 9. Durum: Yayın Kapattı (streaming: true -> false)
    if(oldState.channelId && oldState.streaming && newState.channelId && !newState.streaming) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "YAYIN KAPATTI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`:desktop: ${newState.member} üyesi **<t:${timestamp}:R>** ${newState.channel} adlı ses kanalında **yayını kapattı!**`)]});
    }
    
    // 10. Durum: Kamera Açtı (selfVideo: false -> true)
    if(oldState.channelId && !oldState.selfVideo && newState.channelId && newState.selfVideo) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "KAMERA AÇTI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`:desktop: ${newState.member} üyesi **<t:${timestamp}:R>** ${newState.channel} adlı ses kanalında **kamerasını açtı!**`)]});
    }
    
    // 11. Durum: Kamera Kapattı (selfVideo: true -> false)
    if(oldState.channelId && oldState.selfVideo && newState.channelId && !newState.selfVideo) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "KAMERA KAPATTI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`:desktop: ${newState.member} üyesi **<t:${timestamp}:R>** ${newState.channel} adlı ses kanalında **kamerasını kapattı!**`)]})
    } 
 }
 
 module.exports.config = {
     Event: "voiceStateUpdate"
 }