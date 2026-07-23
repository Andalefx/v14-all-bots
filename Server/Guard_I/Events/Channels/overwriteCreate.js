const { GuildMember, MessageEmbed, GuildChannel, AuditLogEvent } = require("discord.js");
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
    
    // Yalnızca izin sayısı arttığında veya değiştiğinde kontrol et
    if (newChannel.permissionOverwrites.cache.size <= oldChannel.permissionOverwrites.cache.size) return;

    let embed =  new genEmbed().setTitle("Sunucuda Kanal İzni Oluşturuldu!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.OverwriteCreate (13) kullanıldı.
    let entry = await newChannel.guild.fetchAuditLogs({type: AuditLogEvent.OverwriteCreate, limit: 1}).then(audit => audit.entries.first())
    
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "channels" ,"Kanal İzni Oluşturuldu!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "ban")
    client.allPermissionClose()
    
    // V14 GÜNCELLEMESİ: İzinleri eski haline getirme
    // set metodu, V14'te PermissionOverwrites'i bir Array veya Collection olarak kabul eder.
    // oldChannel.permissionOverwrites.cache.map(p => p) kullanılarak Collection'dan Array'e dönüştürülüp set edilebilir.
    try {
        await newChannel.permissionOverwrites.set(oldChannel.permissionOverwrites.cache.map(p => p));
    } catch (error) {
        client.logger.error(`[Guard] ${oldChannel.name} kanalında izinler geri yüklenirken hata oluştu: ${error.message}`);
    }
    
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından \`#${oldChannel.name}\` isimli kanalda **yeni bir izin oluşturuldu** ve ayarları eski haline getirilerek yapan kişi **yasaklandı.**`);
    
    let loged = newChannel.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await newChannel.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Kanal İzni Oluşturma!",
        target: entry.executor.id,
    })
}

module.exports.config = {
    Event: "channelUpdate"
}