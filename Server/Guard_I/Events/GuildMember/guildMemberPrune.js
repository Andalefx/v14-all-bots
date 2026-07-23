const { GuildMember, MessageEmbed, AuditLogEvent } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

 /**
 * @param {GuildMember} member
 */


module.exports = async (member) => {
    // Üye bot ise geri dön (isteğe bağlı, botlar için prune yapılmaz ama güvenlik için iyi)
    if (member.user.bot) return;

    // Client'a erişim
    const client = member.client;
    const guild = member.guild; // guild'i tanımla

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: member.guild.id})
    if(Data && !Data.pruneGuard) return;
    
    let embed = new genEmbed().setTitle("Sunucuda Üye Çıkar Atıldı!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.MemberPrune (21) kullanıldı.
    let entry = await guild.fetchAuditLogs({type: AuditLogEvent.MemberPrune, limit: 1}).then(audit => audit.entries.first());
    
    // Kontroller: Log kaydı var mı, bir executor var mı, 5 saniye içinde mi gerçekleşti ve executor güvenilir mi?
    if(!entry || !entry.executor || Date.now() - entry.createdTimestamp > 5000 || await client.checkMember(entry.executor.id, undefined, "Sunucudan Üye Çıkartma!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "ban")
    client.allPermissionClose()
    
    // Loglama
    embed.setDescription(`${member} (\`${member.id}\`) üyesi, ${entry.executor} (\`${entry.executor.id}\`) tarafından **Üye Çıkar** (Prune) işlemi ile sunucudan çıkartıldı! Yetkili ise yasaklandı.`);
    
    // V14 DÜZELTMESİ: guild.kanalBul() kullanıldı.
    let loged = guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Üye Çıkartma!",
        target: entry.executor.id,
    })
}

module.exports.config = {
    Event: "guildMemberRemove"
}