const { MessageEmbed, Guild, AuditLogEvent } = require("discord.js");
const request = require('request'); // Harici API isteği için korunmuştur.
const { genEmbed } = require("../../../../Global/İnit/Embed");

/**
* @param {Guild} oldGuild
* @param {Guild} newGuild
*/


module.exports = async (oldGuild, newGuild) => {
    // Sunucu mevcut değilse geri dön
    if (!oldGuild.client) return;
    
    const client = oldGuild.client;

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: oldGuild.id})
    if(Data && !Data.guildGuard) return;
    
    let embed = new genEmbed().setTitle("Sunucu Ayarları Güncellendi!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.GuildUpdate (1) kullanıldı.
    let entry = await newGuild.fetchAuditLogs({type: AuditLogEvent.GuildUpdate, limit: 1}).then(audit => audit.entries.first());
    
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "guild" ,"Sunucu Ayarları Güncelleme!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "ban")
    client.allPermissionClose()
    
    // Eski Ayarlara Geri Döndürme
    
    // İsim
    if (newGuild.name !== oldGuild.name) {
        await newGuild.setName(oldGuild.name, `Guard tarafından geri yüklendi. | Yetkili: ${entry.executor.tag}`).catch(err => {});
    }
    
    // İkon
    if (newGuild.iconURL({dynamic: true, size: 2048}) !== oldGuild.iconURL({dynamic: true, size: 2048})) {
        await newGuild.setIcon(oldGuild.iconURL({dynamic: true, size: 2048}), `Guard tarafından geri yüklendi. | Yetkili: ${entry.executor.tag}`).catch(err => {});
    }
    
    // Banner
    if (oldGuild.banner !== newGuild.banner) {
        await newGuild.setBanner(oldGuild.bannerURL({ size: 4096 }), `Guard tarafından geri yüklendi. | Yetkili: ${entry.executor.tag}`).catch(err => {});
    }
    
    // Vanity URL (Özel Davet Kodu)
    if (newGuild.vanityURLCode && (newGuild.vanityURLCode !== oldGuild.vanityURLCode)) {
        // Discord API'sine PATCH isteği göndererek eski kodu geri yükle
        request({
            method: "PATCH", 
            url: `https://discord.com/api/v10/guilds/${newGuild.id}/vanity-url`, // v10 API sürümü kullanıldı
            headers: { 
                "Authorization": `Bot ${client.token}` 
            },
            json: { 
                "code": oldGuild.vanityURLCode // Eski kodu geri yükle
            }
        }, (err) => {
            if (err) client.logger.error(`[GUILD_UPDATE] Vanity URL geri yüklenirken hata oluştu: ${err.message}`);
        });
    }
    
    // Loglama
    embed.setDescription(` ${entry.executor} (\`${entry.executor.id}\`) tarafından sunucu **güncellenmeye çalışıldı!** Yapan kişi **banlandı** ve sunucu eski haline **geri getirildi.**`);
    
    let loged = newGuild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await newGuild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Sunucu Güncelledi!",
        target: entry.executor.id,
    })
}

module.exports.config = {
    Event: "guildUpdate"
}