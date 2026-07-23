const { MessageEmbed, Guild, AuditLogEvent } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

/**
* @param {Guild} guild
*/


module.exports = async (guild) => {
    // Sunucu mevcut değilse geri dön
    if (!guild.client) return;
    
    const client = guild.client;

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: guild.id})
    if(Data && !Data.botGuard) return; // Genellikle bot/entegrasyon işlemlerinde botGuard kullanılır.
    
    let embed = new genEmbed().setTitle("Sunucuda Entagrasyon Silindi!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.IntegrationDelete (51) kullanıldı.
    let entry = await guild.fetchAuditLogs({type: AuditLogEvent.IntegrationDelete, limit: 1}).then(audit => audit.entries.first());
    
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, undefined ,"Entegrasyon Silindi!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "jail")
    client.allPermissionClose()
    
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından **entegrasyon silindi** ve silindiği gibi **cezalandırıldı.**`);
    
    let loged = guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Entegrasyon Silindi!",
        target: entry.executor.id,
    })
}

module.exports.config = {
    Event: "guildIntegrationsUpdate"
}