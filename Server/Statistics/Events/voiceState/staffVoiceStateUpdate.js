// İhtiyaç duyulursa Discord.js ChannelType import edilebilir, ancak "GUILD_VOICE" stringi v14'te de çalışır.
// const { ChannelType } = require('discord.js');

let Upstaff;
module.exports = () => {
    // Upstaff modülünü yükle
    Upstaff = require('../../../../Global/Plugins/Staff');
    client.logger.log("Yetki sistemi verileri güncellendi.", "ups")
    
    // Sunucuyu cache'ten al
    let guild = client.guilds.cache.get(sistem.SERVER.ID);
    
    // Guild yoksa return et
    if (!guild) return; 

    setInterval( async () => {
        // Kanal tipini string olarak filtreleme (V14'te de çalışır)
        // Alternatif V14 filtreleme: .filter(channel => channel.type === ChannelType.GuildVoice)
        let channels = guild.channels.cache.filter(channel => 
            channel.type == "GUILD_VOICE" && 
            channel.members.size > 0 && 
            channel.parent && 
            _statSystem.accessPointChannels.includes(channel.parentId)
        );
        
        channels.forEach(channel => {
            // Sadece bot olmayan, kendini sağır etmeyen ve yetkili rolüne sahip üyeleri filtrele
            let members = channel.members.filter(member => 
                !member.user.bot && 
                !member.voice.selfDeaf && 
                _statSystem.staffs.some(x => member.roles.cache.has(x.rol))
            );
            
            members.forEach(async (member) => {
                // Ceza veya kayıtsız rollerine sahip üyeleri atla
                if(member.roles.cache.has(roller.jailRolü) || 
                   member.roles.cache.has(roller.şüpheliRolü) || 
                   member.roles.cache.has(roller.yasaklıTagRolü) || 
                   member.roles.cache.has(roller.underworldRolü) || 
                   (roller.kayıtsızRolleri && roller.kayıtsızRolleri.some(rol => member.roles.cache.has(rol)))
                ) return;
                
                // Yarım puanlık ayrık kanallar
                if(kanallar.ayrıkKanallar.some(x => channel.id == x)) {
                    await client.Upstaffs.addPoint(member.id, _statSystem.points.halfVoice, "Ses", channel.id)
                    return;
                }

                // Tam puanlık kategoriler
                if(_statSystem.fullPointChannels.includes(channel.parentId)) {
                    // Mute ise yarım puan, değilse tam puan ver
                    if(member.voice.selfMute) { 
                        await client.Upstaffs.addPoint(member.id, _statSystem.points.halfVoice, "Ses", channel.parentId) 
                    } else { 
                        await client.Upstaffs.addPoint(member.id, _statSystem.points.voice, "Ses", channel.parentId) 
                    }
                } 
                // Diğer tüm kanallarda yarım puan ver
                else { 
                    await client.Upstaffs.addPoint(member.id, _statSystem.points.halfVoice, "Ses", channel.parentId) 
                }
            });
        });
    }, 600000); // 10 dakikada bir çalışır
}

module.exports.config = {
    Event: "ready"
}