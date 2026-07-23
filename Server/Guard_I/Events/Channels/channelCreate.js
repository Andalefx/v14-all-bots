const { MessageEmbed, AuditLogEvent, GuildChannel } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

/**
 * @param {GuildChannel} channel
 */
module.exports = async channel => {
    // Kanal bot tarafından oluşturulduysa veya DM kanalıysa kontrol etme
    if (!channel.guild) return; 

    const client = channel.client;

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: channel.guild.id})
    if(Data && !Data.channelGuard) return;
    
    let embed = new genEmbed().setTitle("Sunucuda Kanal Oluşturuldu!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.ChannelCreate (10) kullanıldı.
    let entry = await channel.guild.fetchAuditLogs({type: AuditLogEvent.ChannelCreate, limit: 1}).then(audit => audit.entries.first());
    
    // Kontroller
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "channels" ,"Kanal Oluşturma!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "ban")
    client.allPermissionClose()
    
    // Kanalı sil
    await channel.delete(`Guard tarafından tekrardan silindi. | Yetkili: ${entry.executor.tag}`).catch(err => {});   
    
    // Loglama
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından \`#${channel.name}\` isimli kanal oluşturuldu ve oluşturulduğu gibi **silinip** yapan kişi **yasaklandı.**`);
    
    let loged = channel.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await channel.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Kanal Oluşturma!",
        target: entry.executor.id,
    })
}

module.exports.config = {
    Event: "channelCreate"
}