const { GuildMember, MessageEmbed, AuditLogEvent, PermissionsBitField, ChannelType } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Users = require('../../../../Global/Databases/Client.Users');
const ms = require('ms')
const dataLimit = new Map()

// Not: client ve tarihsel fonksiyonunun global olarak erişilebilir olduğu varsayılmıştır.

 /**
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */

// -------------------------------------------------------------------------------- //
// guildMemberUpdate Olayı (Sağ Tık Rol Koruma)
// -------------------------------------------------------------------------------- //
module.exports = async (oldMember, newMember) => {
    // Üye bot ise geri dön
    if (newMember.user.bot) return;

    const client = newMember.client;
    
    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: oldMember.guild.id})
    if(Data && !Data.memberRoleGuard) return;
    
    // V14 GÜNCELLEMESİ: İzin adları PermissionsBitField.Flags'tan alınmalı
    const permissionStaff = [
        PermissionsBitField.Flags.Administrator, 
        PermissionsBitField.Flags.ManageRoles, 
        PermissionsBitField.Flags.ManageChannels, 
        PermissionsBitField.Flags.ManageGuild, 
        PermissionsBitField.Flags.BanMembers, 
        PermissionsBitField.Flags.KickMembers, 
        PermissionsBitField.Flags.ManageNicknames, 
        PermissionsBitField.Flags.ManageEmojisAndStickers, 
        PermissionsBitField.Flags.ManageWebhooks
    ];
    
    let embed = new genEmbed().setTitle("Sunucuda Sağ-Tık Rol Verildi/Alındı!")
    
    if (newMember.roles.cache.size > oldMember.roles.cache.size) {
        // V14 GÜNCELLEMESİ: AuditLogEvent.MemberRoleUpdate (25) kullanıldı.
        let entry = await newMember.guild.fetchAuditLogs({type: AuditLogEvent.MemberRoleUpdate, limit: 1}).then(audit => audit.entries.first());
        
        if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "member" ,"Sağ-Tık Rol/Ver Alma!")) return;
        
        // Atanan izinleri kontrol et
        const hasCriticalPerm = permissionStaff.some(p => newMember.permissions.has(p));
        
        // Eğer roller değiştiyse ve kritik izinlerden birine sahip olduysa (veya eskiden de varsa, V13'teki orijinal mantık korundu)
        if (hasCriticalPerm) {
       
                // Rolleri eski haline getir
                await newMember.roles.set(oldMember.roles.cache.map(r => r.id)).catch(err => {})  
                
                embed.setDescription(`${newMember} (__${newMember.id}__) üyesine ${entry.executor} (__${entry.executor.id}__) tarafından Sağtık Rol İşlemi Yapıldı! Veren kişi **cezalandırıldı** ve verilen kişiden rol geri alındı.`);
                
                let loged = newMember.guild.kanalBul("guard-log");
                if(loged) await loged.send({embeds: [embed]});
                
                await client.punitivesAdd(entry.executor.id, "jail")
                
                const owner = await newMember.guild.fetchOwner();
                if(owner) owner.send({embeds: [embed]}).catch(err => {})
                
                client.processGuard({
                    type: "Sağ-tık Rol Verme/Alma!",
                    target: entry.executor.id,
                    member: newMember.id,
                })
            
        }
    };
}

module.exports.config = {
    Event: "guildMemberUpdate"
}

// -------------------------------------------------------------------------------- //
// guildMemberNicknameUpdate Eventi (Sağ Tık İsim Koruma)
// -------------------------------------------------------------------------------- //
// Not: V13'te client.on ile özel bir event olarak kullanılıyordu. V14'te de bu yapı korunmuştur.
client.on("guildMemberNicknameUpdate", async (member, oldNickname, newNickname) => {
    // Üye bot ise geri dön
    if (member.user.bot) return;

    const client = member.client;
    
    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({guildID: member.guild.id})
    if(Data && !Data.nicknameGuard) return;
    
    let embed = new genEmbed()
    
    // V14 GÜNCELLEMESİ: AuditLogEvent.MemberUpdate (24) kullanıldı.
    let entry = await member.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberUpdate // İsim değiştirme bu olay tipine girer
    }).then(audit => audit.entries.first());
    
    if(entry && entry.executor && entry.executor.bot) return;
    
    // Normal Yetkili Kontrolü (Loglama için)
    if(entry && entry.executor && !entry.executor.bot) {
        // Eğer yetkili güvenilir ise sadece logla ve kaydet
        if(await client.checkMember(entry.executor.id, "member" ,"Sağ-Tık İsim Değiştirme!")) {
            await Users.updateOne({_id: member.id}, {$push: { "Names": { Staff: entry.executor.id, Name: newNickname == null ? member.user.username : newNickname, State: "Sağ-Tık Değiştirme", Date: Date.now() }}}, {upsert: true})
            let Log = member.guild.kanalBul("isim-log")
            if(Log) Log.send({embeds: [embed.setDescription(`${member} (__${member.id}__) üyesinin ismi \`${oldNickname == null ? member.user.username : oldNickname} => ${newNickname == null ? member.user.username : newNickname}\` olarak ${entry.executor} (__${entry.executor.id}__) tarafından **${tarihsel(Date.now())}** güncellendi.`)]})
            return; // Güvenilir yetkiliyse cezalandırma veya eski isme döndürme yapma
        }
    }
    
    // İzinsiz İşlem Kontrolü (Cezalandırma ve Geri Alma için)
    if(!entry || !entry.executor || entry.createdTimestamp <= Date.now() - 5000 || await client.checkMember(entry.executor.id, "member" ,"Sağ-Tık İsim Değiştirme!")) return;

    // İsmi eski haline getir
    member.setNickname(oldNickname).catch(err => {})
    
    // İsteğe bağlı cezalandırma, orijinal kodda yorum satırıydı: client.punitivesAdd(entry.executor.id, "jail")
    
    embed.setDescription(`${member} (__${member.id}__) üyesinin ismi \`${oldNickname == null ? member.user.username : oldNickname} => ${newNickname == null ? member.user.username : newNickname}\` olarak ${entry.executor} (__${entry.executor.id}__) tarafından **izinsiz** olarak güncellendi ve ${member} üyesinin ismi eski haline getirildi.`);
    
    let loged = member.guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]});
    
    const owner = await member.guild.fetchOwner();
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
    
    client.processGuard({
        type: "İzinsiz İsim Değiştirme!",
        target: entry.executor.id,
        member: member.id,
    })
})