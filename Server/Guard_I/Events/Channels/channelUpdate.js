const { GuildMember, MessageEmbed, GuildChannel, AuditLogEvent, ChannelType } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");


/**
* @param {GuildChannel} oldChannel
* @param {GuildChannel} newChannel
*/


module.exports = async (oldChannel, newChannel) => {
    // DM kanalı veya sunucu mevcut değilse geri dön
    if (!oldChannel.guild) return; 
    
    const client = oldChannel.client;

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: oldChannel.guild.id})
    if(Data && !Data.channelGuard) return;
    
   let embed = new genEmbed().setTitle("Sunucuda Kanal Güncellendi!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.ChannelUpdate (12) kullanıldı.
   let entry = await newChannel.guild.fetchAuditLogs({type: AuditLogEvent.ChannelUpdate, limit: 1}).then(audit => audit.entries.first())
    
   if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "channels" ,"Kanal Güncelleme!")) return;
    
    // Cezalandırma ve Koruma
   client.punitivesAdd(entry.executor.id, "ban")
   client.allPermissionClose()
    
    // Ebeveyn (Parent) değişikliğini geri al (Kategori değilse ve ebeveyn değişmişse)
   if (newChannel.type !== ChannelType.GuildCategory && newChannel.parentId !== oldChannel.parentId) {
        // V14'te setParent metodu hem ID hem de obje kabul eder.
        newChannel.setParent(oldChannel.parentId).catch(err => {});
    }

    // Kanal tipine göre eski ayarlara geri döndürme
   if (newChannel.type === ChannelType.GuildCategory) {
     await newChannel.edit({
       position: oldChannel.position,
       name: oldChannel.name,
     }).catch(err => {});
       
   } else if (newChannel.type === ChannelType.GuildText || newChannel.type === ChannelType.GuildNews) {
     await newChannel.edit({
       name: oldChannel.name,
       position: oldChannel.position,
       topic: oldChannel.topic,
       nsfw: oldChannel.nsfw,
       rateLimitPerUser: oldChannel.rateLimitPerUser,
     }).catch(err => {});
       
   } else if (newChannel.type === ChannelType.GuildVoice) {
     await newChannel.edit({
       name: oldChannel.name,
       position: oldChannel.position,
       bitrate: oldChannel.bitrate,
       userLimit: oldChannel.userLimit,
     }).catch(err => {});
   };

    // Loglama
   embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından \`#${oldChannel.name}\` isimli kanal **güncellendi** ve ayarları eski haline **getirilerek** yapan kişi **yasaklandı.**`);
    
   let loged = newChannel.guild.kanalBul("guard-log");
   if(loged) await loged.send({embeds: [embed]});
    
   const owner = await newChannel.guild.fetchOwner();
   if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
   client.processGuard({
    type: "Kanal Güncelleme!",
    target: entry.executor.id,
})
}

module.exports.config = {
   Event: "channelUpdate"
}