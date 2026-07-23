const { VoiceState, EmbedBuilder, AuditLogEvent } = require("discord.js"); // MessageEmbed yerine EmbedBuilder kullanıldı
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Users = require('../../../../Global/Databases/Client.Users');
// client'a erişim için aşağıdaki fonksiyonun "client" parametresiyle çağrıldığı varsayılmıştır.

/**
 * @param {VoiceState} oldState
 * @param {VoiceState} newState 
 */
module.exports = async (oldState, newState) => {
    
    // newState.guild'den client'a erişim
    const client = newState.client;
    
    // kanalBul fonksiyonunun guild üzerinde tanımlı olduğu varsayılmıştır.
    let logKanali = newState.guild.kanalBul("ses-log");
    if(!logKanali) return;
    
    let uye = oldState.member || newState.member;
    if(!uye) return;
    
    // ----------------------------------------------------
    // KANALA KATILDI
    // ----------------------------------------------------
    if (!oldState.channelId && newState.channelId) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "KATILDI"
        }}}, {upsert: true})
        
        // newState.member.user.tag yerine newState.member.user.username kullanılır.
        return logKanali.send({embeds: [new genEmbed().setAuthor({name: uye.user.username, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`${newState.member} üyesi **<t:${String(Date.now()).slice(0, 10)}:R>** ${newState.channel} adlı sesli kanala **katıldı!**`)]}).catch();
    }
    
    // ----------------------------------------------------
    // KANALDAN AYRILDI
    // ----------------------------------------------------
    if (oldState.channelId && !newState.channelId) {
        await Users.updateOne({_id: oldState.id}, {$push: {"Voices": {
            channel: oldState.channelId,
            date: Date.now(),
            state: "AYRILDI"
        }}}, {upsert: true})
        
        return logKanali.send({embeds: [new genEmbed().setAuthor({name: uye.user.username, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`${oldState.member} üyesi **<t:${String(Date.now()).slice(0, 10)}:R>** \`${oldState.channel.name}\` adlı sesli kanaldan **ayrıldı!**`)]}).catch();
    }
    
    // ----------------------------------------------------
    // KANAL DEĞİŞTİ/TAŞINDI
    // ----------------------------------------------------
    if(oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        
        // AuditLogEvent.MemberMove (MEMBER_MOVE)
        let entry = await newState.guild.fetchAuditLogs({ type: AuditLogEvent.MemberMove, limit: 1 }).then(audit => audit.entries.first());
        
        // Taşınma: Başkası tarafından (Taşınan kişi *değil* ve bot *değil*)
        if(entry && entry.targetId === newState.id && entry.executor.id !== newState.id && entry.executor.id !== client.user.id && (Date.now() - entry.createdTimestamp) < 5000) {
            await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
                channel: newState.channelId,
                date: Date.now(),
                entry: entry.executor.id,
                state: "TAŞINDI"
            }}}, {upsert: true})
            
            return logKanali.send({embeds: [new genEmbed().setAuthor({name: uye.user.username, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`:arrow_up_down: ${newState.member} üyesi ${entry.executor} tarafından **<t:${String(Date.now()).slice(0, 10)}:R>** ${oldState.channel} adlı ses kanalından ${newState.channel} adlı ses kanalına **taşındı!**`)]}).catch();
        }
        
        // Kanal Değiştirdi (Kendi isteğiyle)
        // Eğer Audit Log yoksa VEYA logdaki kişi bot ise (ki bu durumda log kaydı oluşmaz)
        // Ya da log kaydının oluşması ile olayın gerçekleşmesi arasında 5 saniyeden fazla zaman geçmişse (taşınma değil, kendi çıkışı)
        if(!entry || entry.executor.id !== client.user.id || (Date.now() - entry.createdTimestamp) > 5000) { 
            await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
                channel: newState.channelId,
                date: Date.now(),
                state: "DEĞİŞTİ"
            }}}, {upsert: true})
            
            return logKanali.send({embeds: [new genEmbed().setAuthor({name: uye.user.username, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`${newState.member} üyesi **<t:${String(Date.now()).slice(0, 10)}:R>** ses kanalını **değiştirdi!** (\`${oldState.channel.name}\` => ${newState.channel})`)]}).catch();
        }
    }
    
    // ----------------------------------------------------
    // KENDİ SUSTURMASI (Mute)
    // ----------------------------------------------------
    if (oldState.channelId && oldState.selfMute && !newState.selfMute) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "MİKROFON AÇILDI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({name: uye.user.username, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`${newState.member} üyesi **<t:${String(Date.now()).slice(0, 10)}:R>** ${newState.channel} adlı sesli kanalda kendi susturmasını **kaldırdı!**`)]}).catch();
    }
    if (oldState.channelId && !oldState.selfMute && newState.selfMute) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "MİKROFON KAPATTI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({name: uye.user.username, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`${newState.member} üyesi **<t:${String(Date.now()).slice(0, 10)}:R>** ${newState.channel} adlı sesli kanalda kendini **susturdu!**`)]}).catch();
    }
    
    // ----------------------------------------------------
    // KENDİ SAĞIRLAŞTIRMASI (Deaf)
    // ----------------------------------------------------
    if (oldState.channelId && oldState.selfDeaf && !newState.selfDeaf) {
        return logKanali.send({embeds: [new genEmbed().setAuthor({name: uye.user.username, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`${newState.member} üyesi **<t:${String(Date.now()).slice(0, 10)}:R>** ${newState.channel} adlı sesli kanalda kendi sağırlaştırmasını **kaldırdı!**`)]}).catch();
    }
    if (oldState.channelId && !oldState.selfDeaf && newState.selfDeaf) {
        return logKanali.send({embeds: [new genEmbed().setAuthor({name: uye.user.username, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`${newState.member} üyesi **<t:${String(Date.now()).slice(0, 10)}:R>** ${newState.channel} adlı sesli kanalda kendini **sağırlaştırdı!**`)]}).catch();
    }
    
    // ----------------------------------------------------
    // YAYIN (Streaming)
    // ----------------------------------------------------
    if(oldState.channelId && !oldState.streaming && newState.channelId && newState.streaming) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "YAYIN AÇTI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({name: uye.user.username, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`:desktop: ${newState.member} üyesi **<t:${String(Date.now()).slice(0, 10)}:R>** ${newState.channel} adlı ses kanalında **yayın açtı!**`)]});
    }
    
    if(oldState.channelId && oldState.streaming && newState.channelId && !newState.streaming) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "YAYIN KAPATTI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({name: uye.user.username, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`:desktop: ${newState.member} üyesi **<t:${String(Date.now()).slice(0, 10)}:R>** ${newState.channel} adlı ses kanalında **yayını kapattı!**`)]});
    }
    
    // ----------------------------------------------------
    // KAMERA (Video)
    // ----------------------------------------------------
    if(oldState.channelId && !oldState.selfVideo && newState.channelId && newState.selfVideo) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "KAMERA AÇTI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({name: uye.user.username, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`:camera: ${newState.member} üyesi **<t:${String(Date.now()).slice(0, 10)}:R>** ${newState.channel} adlı ses kanalında **kamerasını açtı!**`)]});
    }
    
    if(oldState.channelId && oldState.selfVideo && newState.channelId && !newState.selfVideo) {
        await Users.updateOne({_id: newState.id}, {$push: {"Voices": {
            channel: newState.channelId,
            date: Date.now(),
            state: "KAMERA KAPATTI"
        }}}, {upsert: true})
        return logKanali.send({embeds: [new genEmbed().setAuthor({name: uye.user.username, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`:camera: ${newState.member} üyesi **<t:${String(Date.now()).slice(0, 10)}:R>** ${newState.channel} adlı ses kanalında **kamerasını kapattı!**`)]})
    }
}

module.exports.config = {
    Event: "voiceStateUpdate"
}