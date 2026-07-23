const { GuildMember, MessageEmbed, Guild, GuildBan, AuditLogEvent } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

/**
* @param {GuildBan} ban
*/


module.exports = async (ban) => {
    // Sunucu mevcut değilse geri dön
    if (!ban.guild) return; 
    
    const client = ban.client;

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: ban.guild.id})
    if(Data && !Data.banGuard) return;
    
    let embed = new genEmbed().setTitle("Sunucuda Sağ-Tık Yasaklama Atıldı!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.MemberBanAdd (23) kullanıldı.
    let entry = await ban.guild.fetchAuditLogs({type: AuditLogEvent.MemberBanAdd, limit: 1}).then(audit => audit.entries.first());
    
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "member" ,"Sağ-Tık Yasaklama!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "jail")
    client.allPermissionClose()
    
    // Yasağı Kaldır
    await ban.guild.members.unban(ban.user.id, "Sağ Tık İle Banlandığı İçin Geri Açıldı!").catch(console.error);
    
    embed.setDescription(`${ban.user} (\`${ban.user.id}\`) üyesi, ${entry.executor} (\`${entry.executor.id}\`) tarafından sunucudan \`Sağ-Tık\` ile yasaklandı! Yasaklanan üyenin yasağı **kaldırıldı** ve yasaklayan kişi **cezalandırıldı.**`);
    
    let loged = ban.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await ban.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Sağ-Tık Yasakladı!",
        target: entry.executor.id,
        member: ban.user.id
    })
}

module.exports.config = {
    Event: "guildBanAdd"
}