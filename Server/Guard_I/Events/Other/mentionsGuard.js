const { GuildMember, MessageEmbed, Message, AuditLogEvent, PermissionsBitField } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');

 /**
 * @param {Message} oldMessage
 * @param {Message} newMessage
 */

// messageUpdate Olayı
module.exports = async (oldMessage, newMessage) => {
    // Mesaj bot veya sistem mesajı ise veya içerik değişmemişse dur
    if(newMessage.author.bot || !newMessage.guild || oldMessage.content === newMessage.content) return;
    
    // Client'a erişim
    const client = newMessage.client;
    
    let embed = new genEmbed().setTitle("Sunucuda Duyuru Atıldı!")
    
    if ((newMessage.content.includes('@everyone') || newMessage.content.includes('@here'))) { 
        const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
        let Data = await Guard.findOne({guildID: oldMessage.guild.id})
        if(Data && !Data.everyoneGuard) return;
        
        // Bu kısım global sistem objesi gerektirir, sistemin tanımlı olduğu varsayılmıştır.
        let _findServer = await GUILDS_SETTINGS.findOne({ guildID: sistem.SERVER.ID }) 
        const _set = _findServer.Ayarlar
        
        let uye = newMessage.member;
        
        // V14 GÜNCELLEMESİ: 'MENTION_EVERYONE' izni PermissionsBitField üzerinden kontrol edildi.
        if(!uye.permissions.has(PermissionsBitField.Flags.MentionEveryone)) return;
        
        if(await client.checkMember(newMessage.author.id, undefined ,"Gereksiz Duyuru Kullanımı!") || _set.chatİzinliler && _set.chatİzinliler.includes(newMessage.member.id)) return;
        
        await newMessage.delete().catch(() => {});
        
        client.punitivesAdd(uye.id, "jail")
        // client.allPermissionClose()
        
        embed.setDescription(`${uye} (\`${uye.id}\`) üyesi \`@everyone & @here\` yetkisine sahip olup, mesajını düzenlerken kullanım sağladığı için cezalandırıldı.`);
        
        let loged = newMessage.guild.kanalBul("guard-log");
        if(loged) await loged.send({embeds: [embed]});
        
        const owner = await newMessage.guild.fetchOwner();
        if(owner) owner.send({embeds: [embed]}).catch(err => {})
        
        client.processGuard({
            type: "İzinsiz Duyuru Kullanımı! (Düzenleme)",
            target: newMessage.author.id,
        })
    }
}

module.exports.config = {
    Event: "messageUpdate"
}

// -------------------------------------------------------------------------------- //

// messageCreate Olayı (Ayrı bir event listener olarak çalışır)
// Dosya dışına (genellikle index.js veya client dosyasına) eklenmesi gereken kısım

/**
 * @param {Client} client 
 * @param {Message} message
 */

client.on("messageCreate", async (message) => {
    // Mesaj bot veya sistem mesajı ise veya sunucudan gelmiyorsa dur
    if(message.author.bot || !message.guild) return; 
    
    const client = message.client;
    
    let embed = new genEmbed().setTitle("Sunucuda Duyuru Atıldı!")
    
    if ((message.content.includes('@everyone') || message.content.includes('@here'))) { 
        const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
        let Data = await Guard.findOne({guildID: message.guild.id})
        if(Data && !Data.everyoneGuard) return;
        
        // Bu kısım global sistem objesi gerektirir, sistemin tanımlı olduğu varsayılmıştır.
        let _findServer = await GUILDS_SETTINGS.findOne({ guildID: sistem.SERVER.ID }) 
        const _set = _findServer.Ayarlar
        
        let uye = message.member;
        
        // V14 GÜNCELLEMESİ: 'MENTION_EVERYONE' izni PermissionsBitField üzerinden kontrol edildi.
        if(!uye.permissions.has(PermissionsBitField.Flags.MentionEveryone)) return;
        
        if(await client.checkMember(message.author.id, undefined ,"Gereksiz Duyuru Kullanımı!") || _set.chatİzinliler && _set.chatİzinliler.includes(message.member.id)) return;
        
        await message.delete().catch(() => {});
        
        client.punitivesAdd(uye.id, "jail")
        //client.allPermissionClose()
        
        embed.setDescription(`${uye} (\`${uye.id}\`) üyesi \`@everyone & @here\` yetkisine sahip olup kullanım sağladığı için cezalandırıldı.`);
        
        let loged = message.guild.kanalBul("guard-log");
        if(loged) await loged.send({embeds: [embed]});
        
        const owner = await message.guild.fetchOwner();
        if(owner) owner.send({embeds: [embed]}).catch(err => {})
        
        client.processGuard({
            type: "İzinsiz Duyuru Kullanımı! (Oluşturma)",
            target: message.author.id,
        })
    }
})