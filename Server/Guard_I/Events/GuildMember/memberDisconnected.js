const { MessageEmbed, VoiceState, AuditLogEvent, ChannelType } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

// Not: client, ayarlar, kanallar ve ayarlar.özelOda gibi global objelerin erişilebilir olduğu varsayılmıştır.

// -------------------------------------------------------------------------------- //
// voiceStateUpdate Olayı (Bağlantı Kesme/Disconnect Koruması)
// -------------------------------------------------------------------------------- //
module.exports = async (oldState, newState) => {
    const client = oldState.client;
    
    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: oldState.guild.id})
    if(Data && !Data.disconnectGuard) return;
    
    let embed = new genEmbed().setTitle("Sunucuda Bağlantı Kesildi!")
    let kanalcık = newState.channel
    
    // Özel Oda veya Kayıt Kategorisi İstisnaları
    if(global.ayarlar && global.ayarlar.özelOda) {
        let guild = newState.guild 
        if(guild) {
            // Kanalın Register, Streamer veya Sorun Çözme kategorisinde olup olmadığını kontrol et
            // (oldState.channelId'nin null olması durumunda newState.channel'ı kontrol et, aksi halde oldState.channel'ı kullan)
            let olur = guild.channels.cache.get(global.kanallar.registerKategorisi)
            const parentId = oldState.channel?.parentId || newState.channel?.parentId;
            
            if(olur && parentId && (parentId == global.kanallar.registerKategorisi || parentId == global.kanallar.streamerKategorisi || parentId == global.kanallar.sorunCozmeKategorisi)) return;

            let kanalgetir = guild.channels.cache.get(global.kanallar.özelOdaOluştur)
            if(kanalgetir && parentId && kanalgetir.id && parentId == kanalgetir.id) return;
        }
    } 
    
    // Bağlantı kesme işlemi (oldState.channel mevcutken newState.channel'ın null olması durumu)
    if (oldState.channelId && !newState.channelId) {
        
        // V14 GÜNCELLEMESİ: AuditLogEvent.MemberDisconnect (27) kullanıldı.
        let entry = await oldState.guild.fetchAuditLogs({type: AuditLogEvent.MemberDisconnect, limit: 1}).then(audit => audit.entries.first());
        
        if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "member" ,"Sunucuda Bağlantı Kesme!")) return;
        
            client.punitivesAdd(entry.executor.id, "jail")
            // client.allPermissionClose() // Bu işlem, kritik bir koruma işlemi olmadığı için kapatıldı.
        
            embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından ${oldState.member} üyesinin bağlantısı kesildi. Bu işlemi yapan kişi sunucudan **cezalandırıldı.**`);
        
            let loged = oldState.guild.kanalBul("guard-log");
            if(loged) await loged.send({embeds: [embed]});
        
            const owner = await oldState.guild.fetchOwner();
            if(owner) owner.send({embeds: [embed]}).catch(err => {})
        
            client.processGuard({
                type: "Sağ-tık Bağlantı Kesme!",
                target: oldState.member.id,
                member: entry.executor.id,
            })
    }
}

module.exports.config = {
    Event: "voiceStateUpdate"
}

// -------------------------------------------------------------------------------- //
// voiceChannelMute Olayı (Sağ Tık Susturma/Server Mute Koruması)
// Not: Bu event discord-logs kütüphanesinden gelmektedir. Yapısı V14'te de aynıdır.
// -------------------------------------------------------------------------------- //
client.on("voiceChannelMute", async (member, muteType) => {
    if (!member.voice.channelId) return; // Ses kanalında değilse kontrol etme
    const client = member.client;

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: member.guild.id})
    if(Data && !Data.muteGuard) return;
    
    let embed = new genEmbed().setTitle("Sağ-Tık Susturma İşlemi!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.MemberUpdate (24) kullanıldı.
    let entry = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberUpdate // Ses susturma bu olay tipine girer
    }).then(audit => audit.entries.first());
    
    let checkChannel = member.guild.channels.cache.get(member.voice.channelId)
    
    // Loglama İstisnası: Kayıt, Streamer veya Sorun Çözme kategorilerindeki susturmalar loglanır.
    if(entry && entry.executor && !entry.executor.bot && checkChannel && checkChannel.parentId) {
        if(checkChannel.parentId == global.kanallar.registerKategorisi || checkChannel.parentId == global.kanallar.streamerKategorisi || checkChannel.parentId == global.kanallar.sorunCozmeKategorisi) {
            embed.setDescription(`${member} (__${member.id}__) üyesine ${entry.executor} (__${entry.executor.id}__) tarafından ${checkChannel} kanalında **Sağ-tık susturma** işlemi yapıldı!`);
            let muted = member.guild.kanalBul("sesmute-log");
            if(muted) return muted.send({embeds: [embed]});
        }
    }
    
    // Özel Oda İstisnası
    let kanalcık = member.guild.channels.cache.get(member.voice.channelId)
    if(global.ayarlar && global.ayarlar.özelOda) {
        let guild = member.guild 
        if(guild) {
            let kanalgetir = guild.channels.cache.get(global.kanallar.özelOdaOluştur)
            if(kanalgetir && kanalcık && kanalgetir.id && kanalcık.parentId == kanalgetir.id) return;
        }
    } 

    // Koruma Kontrolü
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "member" ,"Sağ-Tık Susturma İşlemi!")) return;
    
    // Cezalandırma
    client.punitivesAdd(entry.executor.id, "jail")
    // client.allPermissionClose() // Bu işlem, kritik bir koruma işlemi olmadığı için kapatıldı.
    
    embed.setDescription(`${member} (__${member.id}__) üyesine ${entry.executor} (__${entry.executor.id}__) tarafından **Sağ-tık susturma** işlemi yapıldı! Yapan kişi ise **cezalandırıldı.**`);
    
    let loged = member.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await member.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Sağ-tık Susturma!",
        target: member.id,
        member: entry.executor.id,
    })
});