const { MessageEmbed, GuildEmoji, AuditLogEvent } = require("discord.js");
const { genEmbed } = require('../../../../Global/İnit/Embed')
/**
* @param {GuildEmoji} oldEmoji
* @param {GuildEmoji} newEmoji
*/


module.exports = async (oldEmoji, newEmoji) => {
    // Emoji bir sunucuya ait değilse veya isim değişmediyse geri dön
    if (!oldEmoji.guild || oldEmoji.name === newEmoji.name) return; 
    
    const client = oldEmoji.client;

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: oldEmoji.guild.id})
    if(Data && !Data.emojiGuard) return;
    
    let embed = new genEmbed().setTitle("Sunucuda Emoji Düzenlendi!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.EmojiUpdate (21) kullanıldı.
    let entry = await newEmoji.guild.fetchAuditLogs({type: AuditLogEvent.EmojiUpdate, limit: 1}).then(audit => audit.entries.first());
    
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "emoji" ,"Emoji Düzenleme!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "jail")
    client.allPermissionClose()
    
    // Emojiyi eski adına geri döndür
    await newEmoji.edit({ 
        name: oldEmoji.name 
    }, { 
        reason: `${entry.executor.username} tarafından güncellenmeye çalışıldı.` 
    }).catch(err => {});
    
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından (${newEmoji}) \`${oldEmoji.name}\` isimli emoji \`${newEmoji.name}\` olarak **güncellenmeye çalışıldı.** Emoji eski haline getirilerek yapan kişi **cezalandırıldı.**`);
    
    let loged = newEmoji.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await newEmoji.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Emoji Güncelledi!",
        target: entry.executor.id,
    })
}

module.exports.config = {
    Event: "emojiUpdate"
}