const { MessageEmbed, GuildBan, AuditLogEvent } = require("discord.js");
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
    
    let embed = new genEmbed().setTitle("Sunucuda Yasaklama Kaldırıldı!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.MemberBanRemove (24) kullanıldı.
    let entry = await ban.guild.fetchAuditLogs({type: AuditLogEvent.MemberBanRemove, limit: 1}).then(audit => audit.entries.first());
    
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "member" ,"Yasaklama Kaldırma!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "jail")
    client.allPermissionClose()
    
    // Yasağı Tekrar Uygula
    await ban.guild.members.ban(ban.user.id, { reason: "Yasaklaması Kaldırıldığı İçin Guard Tarafından Tekrar Yasaklandı." }).catch(console.error);
    
    embed.setDescription(`${ban.user} (\`${ban.user.id}\`) üyesinin yasaklaması, ${entry.executor} (\`${entry.executor.id}\`) tarafından kaldırıldığı için, kaldıran kişi **cezalandırıldı** ve üye tekrar **yasaklandı.**`);
    
    let loged = ban.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await ban.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Sağ-Tık Yasaklama Kaldırdı!",
        target: entry.executor.id,
        member: ban.user.id
    })
}

module.exports.config = {
    Event: "guildBanRemove"
}