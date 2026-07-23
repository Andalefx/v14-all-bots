const { AuditLogEvent } = require('discord.js');
const Users = require('../../../../Global/Databases/Client.Users');
const Upstaffs = require('../../../../Global/Databases/Client.Users.Staffs');
const Tasks = require('../../../../Global/Databases/Client.Users.Tasks');
const GUILD_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');
const { genEmbed } = require('../../../../Global/İnit/Embed');

module.exports = async (member, role) => {
    if (!global.sistem || member.guild.id !== sistem.SERVER.ID) return;

    try {
        // Audit Log Çekimi
        const entry = await member.guild.fetchAuditLogs({ 
            type: AuditLogEvent.MemberRoleUpdate, 
            limit: 1 
        }).then(audit => audit.entries.first()).catch(() => null);

        if (!entry || !entry.executor || entry.executor.bot || (Date.now() - entry.createdTimestamp > 10000)) return;

        const yapan = member.guild.members.cache.get(entry.executor.id);
        if (!yapan) return;

        const Database = await GUILD_SETTINGS.findOne({ guildID: member.guild.id });
        if (!Database?.Ayarlar) return;

        const roller = Database.Ayarlar;
        const ayarlar = Database.Ayarlar;

        // Rolün kaldırıldığını kontrol et
        const roleRemoved = entry.changes.some(change => 
            change.key === '$remove' && change.new?.some(r => r.id === role.id)
        );

        if (!roleRemoved) return;

        // 1. SAĞ TIK KORUMA (Kaldırma)
        if (_staffs?.staffs?.some(x => x.rol === role.id) && 
            role.id !== roller.altilkyetki && 
            role.id !== roller.başlangıçYetki) {

            await member.roles.add(role.id, "Sağ-tık ile yetki kaldırıldığından tekrar verildi.").catch(() => {});

            yapan.send({
                content: `Yetki almak istediğin ${member} isimli üyeden **Sağ-tık** ile yetki alamazsın.\n**@${role.name}** rolü sadece komut üzerinden alınabilir.`
            }).catch(() => {});
            return;
        }

        // 2. GÖREV / YETKİ ÇEKME İŞLEMLERİ
        const görevGetir = await Tasks.findOne({ roleID: role.id });
        const yetkiliBilgisi = await Upstaffs.findOne({ _id: member.id });

        if (görevGetir && yetkiliBilgisi) {
            await Upstaffs.deleteOne({ _id: member.id });
            await Users.updateOne({ _id: member.id }, { 
                $set: { Staff: false } 
            }, { upsert: true });

            await Users.updateOne({ _id: member.id }, { 
                $push: { 
                    StaffLogs: {
                        Date: Date.now(),
                        Process: "ÇEKİLDİ",
                        Role: role.id,
                        Author: entry.executor.id
                    }
                } 
            }, { upsert: true });
        }

        // 3. ANA ROL LOG KAYDI (Kaldırma)
        await Users.updateOne({ _id: member.id }, { 
            $push: { 
                Roles: { 
                    rol: role.id, 
                    mod: entry.executor.id, 
                    tarih: Date.now(), 
                    state: "Kaldırma" 
                } 
            } 
        }, { upsert: true });

        // 4. Log Kanalına Mesaj
        const logChannel = member.guild.kanalBul("rol-al-log");
        if (logChannel) {
            logChannel.send({
                embeds: [new genEmbed().setDescription(
                    `${member} isimli üyeden <t:${Math.floor(Date.now()/1000)}:R> ${yapan} tarafından ${role} rolü geri alındı.`
                )]
            });
        }

    } catch (err) {
        console.error("guildMemberRoleRemove Event Hatası:", err);
    }
};

module.exports.config = {
    Event: "guildMemberRoleRemove"
};