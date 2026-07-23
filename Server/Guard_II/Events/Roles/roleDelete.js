const { MessageEmbed, Role, AuditLogEvent } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
const deletedRoles = require('../../../../Global/Databases/Guild.Deleted.Roles');

/**
* @param {Role} role
*/

module.exports = async role => {
    // Sunucu mevcut değilse geri dön
    if (!role.guild) return; 
    
    const client = role.client;
    const sistem = global.sistem || {}; // Sistem ayarlarının tanımlı olduğu varsayılır.

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: role.guild.id})
    if(Data && !Data.roleGuard) return;
    
    let embed = new genEmbed().setTitle("Sunucuda Rol Silindi!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.RoleDelete (32) kullanıldı.
    let entry = await role.guild.fetchAuditLogs({type: AuditLogEvent.RoleDelete, limit: 1}).then(audit => audit.entries.first());
    
    // Orijinal kodda yetkili kontrolü yoktu, sadece Audit Log kaydı vardı, bu yüzden sadece log kontrolü korunmuştur.
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000) return;
    
    // Silinen rol bilgisini veritabanına kaydet
    await deletedRoles.updateOne({"roleID": role.id}, { $set: { "Date": Date.now(), "Remover": entry.executor.id }}, {upsert: true}).catch(err => {
        client.logger.error(`[ROLE_DELETE] Silinen rol yedeklenirken hata oluştu: ${err.message}`);
    });
    
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından **${role.name}** (\`${role.id}\`) rolü silindi. \`${sistem.botSettings?.Prefixs[0] || "!"}rolkur ${role.id}\` komutu ile kurulum yapabilirsiniz.`);
    
    let loged = role.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await role.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
}

module.exports.config = {
    Event: "roleDelete"
}