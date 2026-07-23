const { MessageEmbed, Role, AuditLogEvent } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

/**
* @param {Role} role
*/

module.exports = async role => {
    // Sunucu mevcut değilse geri dön
    if (!role.guild) return; 
    
    const client = role.client;

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: role.guild.id})
    if(Data && !Data.roleGuard) return;
    
    let embed = new genEmbed().setTitle("Sunucuda Rol Oluşturuldu!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.RoleCreate (30) kullanıldı.
    let entry = await role.guild.fetchAuditLogs({type: AuditLogEvent.RoleCreate, limit: 1}).then(audit => audit.entries.first());
    
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "roles" ,"Rol Oluşturma!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "ban")
    client.allPermissionClose()
    
    // Rolü sil
    await role.delete(`Guard tarafından silindi. | Yetkili: ${entry.executor.tag}`).catch(err => {})
    
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından **\`${role.name}\`** isimli bir rol oluşturuldu! Oluşturan kişi **yasaklandı** ve rol **silindi.**`);
    
    let loged = role.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await role.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Rol Oluşturdu!",
        target: entry.executor.id,
    })
}

module.exports.config = {
    Event: "roleCreate"
}