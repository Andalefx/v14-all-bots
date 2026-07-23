const { GuildMember, MessageEmbed, Message, Guild, GuildChannel, AuditLogEvent } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

 /**
 * @param {GuildChannel} channel
 */


module.exports = async (channel) => {
    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    // Client'a erişim için channel.client kullanılır.
    const client = channel.client; 
    
    let Data = await Guard.findOne({guildID: channel.guild.id})
    if(Data && !Data.webhookGuard) return;
    let embed = new genEmbed().setTitle("Sunucuda Webhook Güncellendi!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.WebhookUpdate (11) veya string 'WEBHOOK_UPDATE' kullanılabilir. Sayısal kullanım tercih edildi.
    let entry = await channel.guild.fetchAuditLogs({type: AuditLogEvent.WebhookUpdate, limit: 1}).then(audit => audit.entries.first()); 
    
    // V14 GÜNCELLEMESİ: client değişkenine erişim düzeltildi.
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, undefined ,"Webhook Güncelleme!")) return;
    
    // Webhook objesini alma
    const webhook = entry.target; 
    
    client.punitivesAdd(entry.executor.id, "ban")
    client.allPermissionClose()
    
    // V14 GÜNCELLEMESİ: channelID yerine channelId kullanıldı.
    await webhook.edit({ name: webhook.name, avatar: webhook.avatar, channel: webhook.channelId }); 
    
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından \`${channel.name}\` kanalında webhook güncellendi ve güncellendiği gibi cezalandırıldı.`);
    let loged = channel.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    const owner = await channel.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    client.processGuard({
        type: "Webhook Güncellendi!",
        target: entry.executor.id,
    })
}

module.exports.config = {
    Event: "webhookUpdate"
}