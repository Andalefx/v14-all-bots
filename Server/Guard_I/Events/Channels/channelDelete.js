const { GuildMember, MessageEmbed, GuildChannel, AuditLogEvent, ChannelType, Guild } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Settings");
// Bu şemaların dosya yolu korunmuştur.
const TextChannels = require("../../../../Global/Databases/Guild.Text.Channels");
const VoiceChannels = require("../../../../Global/Databases/Guild.Voice.Channels");

 /**
 * @param {GuildChannel} channel
 */


module.exports = async (channel) => {
    // DM kanalı veya sunucu mevcut değilse geri dön
    if (!channel.guild) return; 
    
    const client = channel.client;

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: channel.guild.id})
    if(Data && !Data.channelGuard) return;
    
    let embed = new genEmbed().setTitle("Sunucuda Kanal Silindi!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.ChannelDelete (11) kullanıldı.
    let entry = await channel.guild.fetchAuditLogs({type: AuditLogEvent.ChannelDelete, limit: 1}).then(audit => audit.entries.first())
    
    // Kontroller
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "channels" ,"Kanal Silme!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "ban")
    client.allPermissionClose()
    
    let newChannel;
    
    // V14 GÜNCELLEMESİ: ChannelType enum'ları kullanıldı.
    if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildNews) {
        newChannel = await channel.guild.channels.create({
            name: channel.name,
            type: channel.type,
            topic: channel.topic,
            nsfw: channel.nsfw,
            parent: channel.parentId, // V14'te parentId kullanıldı.
            position: channel.position + 1,
            rateLimitPerUser: channel.rateLimitPerUser
        }).catch(err => {});
    } else if (channel.type === ChannelType.GuildVoice) {
        newChannel = await channel.guild.channels.create({
            name: channel.name,
            type: channel.type,
            bitrate: channel.bitrate,
            userLimit: channel.userLimit,
            parent: channel.parentId, // V14'te parentId kullanıldı.
            position: channel.position + 1
        }).catch(err => {});
    } else if (channel.type === ChannelType.GuildCategory) {
        newChannel = await channel.guild.channels.create({
            name: channel.name,
            type: channel.type,
            position: channel.position + 1
        }).catch(err => {});
        
        // Kategori altındaki kanalları yeni kategoriye taşı
        if (newChannel) {
            const textChannels = await TextChannels.find({ parentID: channel.id });
            await TextChannels.updateMany({ parentID: channel.id }, { parentID: newChannel.id });
            textChannels.forEach(c => {
                const textChannel = channel.guild.channels.cache.get(c.channelID);
                // setParent yerine setParentId kullanılması V14'te daha temizdir.
                if (textChannel) textChannel.setParent(newChannel.id, { lockPermissions: false }).catch(err => {});
            });
            
            const voiceChannels = await VoiceChannels.find({ parentID: channel.id });
            await VoiceChannels.updateMany({ parentID: channel.id }, { parentID: newChannel.id });
            voiceChannels.forEach(c => {
                const voiceChannel = channel.guild.channels.cache.get(c.channelID);
                if (voiceChannel) voiceChannel.setParent(newChannel.id, { lockPermissions: false }).catch(err => {});
            });
        }
    };
    
    // İzinleri yeni kanala aktar
    if (newChannel) {
        channel.permissionOverwrites.cache.forEach(perm => {
            let thisPermOverwrites = {};
            perm.allow.toArray().forEach(p => {
                thisPermOverwrites[p] = true;
            });
            perm.deny.toArray().forEach(p => {
                thisPermOverwrites[p] = false;
            });
            // V14'te permissionOverwrites.edit() veya create() kullanılır.
            newChannel.permissionOverwrites.create(perm.id, thisPermOverwrites).catch(err => {});
        });
        // client.queryManage fonksiyonu varsa çalıştır
        await client.queryManage(channel.id, newChannel.id).catch(err => {})
    }

    // Loglama
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından \`#${channel.name}\` isimli kanal silindi ve **geri oluşturularak** yapan kişi **yasaklandı.** Yeni Kanal: ${newChannel ? `<#${newChannel.id}>` : "Oluşturulamadı"}`);
    
    let loged = channel.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await channel.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
      type: "Kanal Silme!",
      target: entry.executor.id,
  })
}

module.exports.config = {
    Event: "channelDelete"
}