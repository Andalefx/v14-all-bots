const { AuditLogEvent } = require('discord.js');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Roles = require('../../../../Global/Databases//GuildMember.Roles.Backup');
const leftRoles = require('../../../../Global/Databases/Users.Left.Roles');
const GUILD_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');

/**
* Bu event, bir üye sunucudan ayrıldığında (veya atıldığında) tetiklenir.
*
* @param {GuildMember} member
*/

// --- Ana Event Handler (Rol Yedekleme ve Loglama) ---
module.exports = async (member) => {
    if (!global.sistem || member.guild.id !== sistem.SERVER.ID) return;
    
    // 1. Ayrılanı Log Kanalına Bildirme
    const kanalBul = member.guild.kanalBul("ayrılanlar");
    if (kanalBul) {
        kanalBul.send({content: `${member.user}`, embeds: [new genEmbed().setDescription(`${member.user.tag} (\`${member.user.id}\`) üyesi sunucudan <t:${String(Date.now()).slice(0, 10)}:R> (<t:${String(Date.now()).slice(0, 10)}:F>) ayrıldı.`)]}).catch(err => {});
    }

    // 2. Rol Yedekleme Kontrolü
    const cezaRolleri = [roller.jailRolü, roller.şüpheliRolü, roller.underworldRolü, roller.yasaklıTagRolü];
    
    // Üyenin rollerinde ceza rolü veya kayıtsız rolü varsa yedeklemeyi atla
    if (member.roles.cache.some(rol => cezaRolleri.includes(rol.id) || (roller.kayıtsızRolleri && roller.kayıtsızRolleri.includes(rol.id)))) return;
    
    // member.Left() metodunun global olarak tanımlı olduğu varsayılır ve çağrılır.
    member.Left();
};

module.exports.config = {
    Event: "guildMemberRemove"
};


// --- İkinci Event: Rol Yedekleme Verisini Silme ve Cache Güncelleme ---
client.on("guildMemberRemove", async (member) => {
    if (!global.sistem || member.guild.id !== sistem.SERVER.ID) return;
    
    // 1. Yedekleme Verisini Silme
    await Roles.deleteOne({_id: member.id});

    // 2. Sunucu Cache'ini Güncelleme (Son Ayrılan Üye)
    // v14: member objesinden doğrudan user'a erişilir.
    const detay = member.user; 
    
    await GUILD_SETTINGS.updateOne({guildID: member.guild.id}, {$set: {[`Caches.latest`]: {
        id: detay.id,
        avatarURL: detay.displayAvatarURL({extension: 'png', size: 1024}), // v14 displayAvatarURL kullanımı güncellendi
        tag: detay.tag
    }}}, {upsert: true});

    // 3. Yetkili Rollerini Yedekleme
    const yetkiliRol = member.guild.roles.cache.get(roller.altilkyetki);
    const uyeUstRol = member.guild.roles.cache.get(member.roles.highest.id);
    
    // Üyenin en yüksek rolü yetkili rolünden üstteyse rolleri yedekle
    if (yetkiliRol && uyeUstRol && yetkiliRol.rawPosition < uyeUstRol.rawPosition) {
        // @everyone rolü hariç tüm rol ID'lerini al
        const rolleri = member.roles.cache.filter(x => x.name !== "@everyone").map(x => x.id);
        await leftRoles.updateOne({_id: member.id} , {$set: {"_roles": rolleri}}, {upsert: true});
    }
});


// --- Üçüncü Event: Kick/Atılma Kontrolü ---
client.on("guildMemberRemove", async (member) => {
    if (!global.sistem || member.guild.id !== sistem.SERVER.ID) return;
    
    // v14: AuditLogEvent.MemberKick kullanılır, limit: 1 ile en son olayı çeker.
    const entry = await member.guild.fetchAuditLogs({type: AuditLogEvent.MemberKick, limit: 1}).then(audit => audit.entries.first()).catch(() => null);

    // Giriş (entry) yoksa VEYA yürütücü (executor) yoksa VEYA olay 5 saniyeden eskiyse, çık.
    if (!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || entry.targetId !== member.id) return;
    
    // Yürütücünün (Kick'i atan) Uses.Kick sayacını artır.
    await Users.updateOne({ _id: entry.executor.id } , { $inc: { "Uses.Kick": 1 } }, { upsert: true });
});