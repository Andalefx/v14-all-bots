// Discord.js v14 için importlar güncellendi.
const { EmbedBuilder, Guild, AuditLogEvent } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
const roleBackup = require("../../../../Global/Databases/Guild.Roles");

/**
 * @param {Guild} role 
 */

module.exports = async role => {
  const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
  let Data = await Guard.findOne({guildID: role.guild.id})
  if(Data && !Data.roleGuard) return;
    
    // genEmbed'in EmbedBuilder'dan türediğini varsayarak V14'e uyumlu kalmasını sağlıyoruz.
    let embed = new genEmbed().setTitle("Sunucuda Rol Silindi!")
    
    // V14'te type string değil, sabit (AuditLogEvent.RoleDelete) kullanılır.
    let entry = await role.guild.fetchAuditLogs({type: AuditLogEvent.RoleDelete}).then(audit => audit.entries.first());
    
    let arr = [roller.tagRolü, ...roller.kayıtsızRolleri, ...roller.kadınRolleri, ...roller.erkekRolleri]
    
    if(arr.includes(role.id)) {
        embed.setTitle("Sunucuda Özel Bir Rol Silindi!")
        // Güvenlik kontrolü
        if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id)) return;
        
        client.punitivesAdd(entry.executor.id, "ban")
        client.allPermissionClose()
        
        const roleData = await roleBackup.findOne({ roleID: role.id })
        
        // Rol oluşturma V14'te aynıdır, ancak 'icon' değeri null veya Buffer olmalıdır.
        const newRole = await role.guild.roles.create({
          name: roleData ? roleData.name : role.name,
          color: roleData ? roleData.color : role.color,
          hoist: roleData ? roleData.hoist : role.hoist,
          icon: roleData ? roleData.icon : undefined, // V14'te null yerine undefined/yok kullanılabilir
          position: roleData ? roleData.position : role.rawPosition,
          permissions: roleData ? roleData.permissions : role.permissions,
          mentionable: roleData ? roleData.mentionable : role.mentionable,
          reason: "Rol Silindiği İçin Tekrar Oluşturuldu!"
        });
        
        // Açıklama ve Footer güncellemesi
        embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından **@${role.name}** (\`${role.id}\`) isimli özel rol silindi, silen kişi sunucudan uzaklaştırılarak silinen rol tekrardan kurulmaya başlandı.
    
**Rol İsmi**: \` @${newRole.name} \` [${newRole}]
**Dağıtılacak Kişi Bilgisi**: \` ${roleData.members.length || 0} kişi \`
**Tahmini Dağıtım Süresi**: \` ${roleData ? roleData.members.length > 0 ? (roleData.members.length>1000 ? parseInt((roleData.members.length*(250/1000)) / 60)+" dakika" : parseInt(roleData.members.length*(250/1000))+" saniye") : "Belirlenemedi." : "Belirlenemedi." } \``)
             .setFooter({text: "yukarda belirtilen rol bilgisi dahilinde tekrardan kurulum sağlanmıştır ve dağıtımı başlamıştır."});
        
        let loged = role.guild.kanalBul("guard-log");
        // loged.wsend yerine loged.send kullanıldı.
        if(loged) await loged.send({embeds: [embed]}); 
        
        const owner = await role.guild.fetchOwner();
        if(owner) owner.send({embeds: [embed]})
        
        let data = await roleBackup.findOne({ roleID: role.id })
        if(!data) return client.logger.log(`[${role.id}] ID'li rol silindi fakat herhangi bir veri olmadığı için işlem yapılmadı.`,"log");
        await client.rolKur(role.id, newRole)
        await client.queryManage(role.id, newRole.id)
        return;
    }
    
    // GENEL ROL SİLME KONTROLÜ
    // Güvenlik kontrolü
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "roles" ,"Rol Silme!")) return;
    
    client.punitivesAdd(entry.executor.id, "ban")
    client.allPermissionClose()
    
    const roleData = await roleBackup.findOne({ roleID: role.id })
    
    const newRole = await role.guild.roles.create({
      name: roleData ? roleData.name : role.name,
      color: roleData ? roleData.color : role.color,
      hoist: roleData ? roleData.hoist : role.hoist,
      // roleData.hoist yerine roleData.icon kullanıldı (muhtemelen orijinal kodda bir hata)
      icon: roleData ? roleData.icon : undefined, 
      position: roleData ? roleData.position : role.rawPosition,
      permissions: roleData ? roleData.permissions : role.permissions,
      mentionable: roleData ? roleData.mentionable : role.mentionable,
      reason: "Rol Silindiği İçin Tekrar Oluşturuldu!"
    });
    
    embed.setDescription(`${entry.executor} (\`${entry.executor.id}\`) tarafından **@${role.name}** (\`${role.id}\`) isimli rol silindi, silen kişi sunucudan uzaklaştırılarak silinen rol tekrardan kurulmaya başlandı.

**Rol İsmi**: \` @${newRole.name} \` [${newRole}]
**Dağıtılacak Kişi Bilgisi**: \` ${roleData.members.length || 0} kişi \`
**Tahmini Dağıtım Süresi**: \` ${roleData ? roleData.members.length > 0 ? (roleData.members.length>1000 ? parseInt((roleData.members.length*(250/1000)) / 60)+" dakika" : parseInt(roleData.members.length*(250/1000))+" saniye") : "Belirlenemedi." : "Belirlenemedi." } \``)
        .setFooter({text: "yukarda belirtilen rol bilgisi dahilinde tekrardan kurulum sağlanmıştır ve dağıtımı başlamıştır."});
    
    let loged = role.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]}); // loged.wsend yerine loged.send
    
    const owner = await role.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]})
    
    let data = await roleBackup.findOne({ roleID: role.id })
    if(!data) return client.logger.log(`[${role.id}] ID'li rol silindi fakat herhangi bir veri olmadığı için işlem yapılmadı.`,"log");
    await client.rolKur(role.id, newRole)
    await client.queryManage(role.id, newRole.id)
    
    client.processGuard({
      type: "Rol Sildi!",
      target: entry.executor.id,
  })
}

module.exports.config = {
    Event: "roleDelete"
}