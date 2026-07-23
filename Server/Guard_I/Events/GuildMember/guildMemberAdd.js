const { MessageEmbed, GuildMember, AuditLogEvent } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

 /**
 * @param {GuildMember} member
 */


module.exports = async (member) => {
    // Üye bot değilse geri dön
    if (!member.user.bot) return;

    // Client'a erişim
    const client = member.client;
    
    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: member.guild.id})
    if(Data && !Data.botGuard) return;
    
    let embed = new genEmbed().setTitle("Sunucuya Bot Eklendi!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.BotAdd (28) kullanıldı.
    let entry = await member.guild.fetchAuditLogs({type: AuditLogEvent.BotAdd, limit: 1}).then(audit => audit.entries.first());
    
    // Kontroller
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "bot" ,"Sunucuya Bot Ekleme!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "jail")
    client.punitivesAdd(member.id, "ban") // Eklenen botu banla
    client.allPermissionClose()
    
    // Loglama
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) isimli üye tarafından ${member} (\`${member.id}\`) adında bir bot ekledi ve eklenen bot ile ekleyen üye **cezalandırıldı.**`);
    
    let loged = member.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await member.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Bot Ekleme!",
        target: entry.executor.id,
    })
}

module.exports.config = {
    Event: "guildMemberAdd"
}