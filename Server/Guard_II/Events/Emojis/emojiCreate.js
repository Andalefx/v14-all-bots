const { MessageEmbed, GuildEmoji, AuditLogEvent } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

/**
* @param {GuildEmoji} emoji
*/

module.exports = async (emoji) => {
    // Emoji bir sunucuya ait değilse veya sunucu mevcut değilse geri dön
    if (!emoji.guild) return; 
    
    const client = emoji.client;

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: emoji.guild.id})
    if(Data && !Data.emojiGuard) return;
    
    let embed = new genEmbed().setTitle("Sunucuda Emoji Oluşturuldu!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.EmojiCreate (20) kullanıldı.
    let entry = await emoji.guild.fetchAuditLogs({type: AuditLogEvent.EmojiCreate, limit: 1}).then(audit => audit.entries.first());
    
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "emoji" ,"Emoji Oluşturma!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "jail")
    client.allPermissionClose()
    
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından \`${emoji.name}\` isimli emoji oluşturuldu ve oluşturulduğu gibi **silinip** yapan kişi **cezalandırıldı.**`);
    
    // Emojiyi sil
    await emoji.delete(`Guard tarafından silindi. | Yetkili: ${entry.executor.tag}`).catch(err => {})
    
    let loged = emoji.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await emoji.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Emoji Oluşturdu!",
        target: entry.executor.id,
    })
}

module.exports.config = {
    Event: "emojiCreate"
}