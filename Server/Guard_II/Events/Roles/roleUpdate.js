const { MessageEmbed, Role, AuditLogEvent, PermissionsBitField } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

/**
* @param {Role} oldRole
* @param {Role} newRole
*/

module.exports = async (oldRole, newRole) => {
    // Sunucu mevcut değilse veya rol değişmediyse geri dön
    if (!oldRole.guild || oldRole.permissions.bitfield === newRole.permissions.bitfield && oldRole.name === newRole.name) return; 
    
    const client = oldRole.client;

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: oldRole.guild.id})
    if(Data && !Data.roleGuard) return;
    
    // V14 GÜNCELLEMESİ: Permissions listesi büyük/küçük harfe duyarlı olarak güncellendi.
    const permissionStaff = [
        "Administrator", "ManageRoles", "ManageChannels", "ManageGuild", 
        "BanMembers", "KickMembers", "ManageNicknames", "ManageEmojisAndStickers", 
        "ManageWebhooks"
    ];
    
    let embed = new genEmbed().setTitle("Sunucuda Rol Düzenlendi!")
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.RoleUpdate (31) kullanıldı.
    let entry = await oldRole.guild.fetchAuditLogs({type: AuditLogEvent.RoleUpdate, limit: 1}).then(audit => audit.entries.first());
    
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "roles" ,"Rol Düzenleme!")) return;
    
    // Cezalandırma ve Koruma
    client.punitivesAdd(entry.executor.id, "ban")
    client.allPermissionClose()
    
    // Yüksek İzin Kontrolü ve Geri Alma
    // İzinler değiştiyse ve kritik bir izin eklendiyse (veya bitfield'dan izin değişimi kontrolü)
    if (permissionStaff.some(p => !oldRole.permissions.has(p) && newRole.permissions.has(p))) {
        
        // Rolün izinlerini Güvenli İzin Bitfield'ına geri ayarla (Eski koddaki 6479482433n kullanıldı, bu izinleri geri ayarlamalı)
        // V14'te izinler `PermissionsBitField` ile çalışır. 
        await newRole.setPermissions(oldRole.permissions.bitfield, `Guard tarafından yetki yükseltilmesi nedeniyle eski izinlerine geri çekildi.`).catch(err => {
            client.logger.error(`[ROLE_UPDATE] İzinler geri yüklenirken hata oluştu: ${err.message}`);
        });

    }
    
    // Rolün Diğer Ayarlarını Eski Haline Getirme
    await newRole.edit({
        name: oldRole.name,
        color: oldRole.hexColor || null, // Renk null ise hatayı önle
        hoist: oldRole.hoist,
        mentionable: oldRole.mentionable,
    }, `Guard tarafından rol ayarları eski haline getirildi. | Yetkili: ${entry.executor.tag}`).catch(err => {
        client.logger.error(`[ROLE_UPDATE] Rol ayarları geri yüklenirken hata oluştu: ${err.message}`);
    });
    
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından **${oldRole.name}** rolü **güncellenmeye çalışıldı!** Yapan kişi **yasaklandı** ve rol eski haline **geri getirildi.**`);
    
    let loged = oldRole.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await oldRole.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "Rol Güncelledi!",
        target: entry.executor.id,
    })
}

module.exports.config = {
    Event: "roleUpdate"
}