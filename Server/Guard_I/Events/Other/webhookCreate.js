const { GuildMember, MessageEmbed, Message, Guild, GuildChannel, AuditLogEvent } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

 /**
 * @param {GuildChannel} channel
 */


module.exports = async (channel) => {
    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    const client = channel.client; // Client'a erişim için
    
    let Data = await Guard.findOne({guildID: channel.guild.id})
    if(Data && !Data.webhookGuard) return;
    
    let embed = new genEmbed().setTitle("Sunucuda Webhook Oluşturuldu!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.WebhookCreate (30) kullanıldı.
    let entry = await channel.guild.fetchAuditLogs({type: AuditLogEvent.WebhookCreate, limit: 1}).then(audit => audit.entries.first());
    
    // Güvenlik kontrolü
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, undefined ,"Webhook Oluşturma!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "ban")
    client.allPermissionClose()
    
    // Webhookları silme
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından \`${channel.name}\` kanalında webhook oluşturuldu ve oluşturulduğu gibi silinip **cezalandırıldı!**`);
    const webhooks = await channel.fetchWebhooks();
        webhooks.forEach(async element => {
            await element.delete().catch(() => {}); // Hata yakalama eklendi
        });
    
    // Loglama
    let loged = channel.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await channel.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Webhook Oluşturdu!",
        target: entry.executor.id,
    })
}

module.exports.config = {
    // Bu dosya webhook oluşturma olayını dinlediği için olay adı "webhookCreate" olmalıdır.
    Event: "webhookCreate"
}