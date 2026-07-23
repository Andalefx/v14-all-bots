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

        // Rolün eklendiğini kontrol et
        const roleAdded = entry.changes.some(change => 
            change.key === '$add' && change.new?.some(r => r.id === role.id)
        );

        if (!roleAdded) return;

        // 1. SAĞ TIK KORUMA
        if (roller.staffs?.some(x => x.rol === role.id) && 
            role.id !== roller.altilkyetki && 
            role.id !== roller.başlangıçYetki) {

            await member.roles.remove(role.id, "Sağ-tık ile yetki verildiğinden kaldırıldı.").catch(() => {});

            yapan.send({
                content: `Yetki vermek istediğin ${member} isimli üyeye **Sağ-tık** ile yetki veremezsin.\nAlmak istediğin **@${role.name}** rolü sadece komut üzerinden verilmeye ve alınmaya açıktır.`
            }).catch(() => {});
            return;
        }

        // 2. GÖREV BAŞLATMA / GÜNCELLEME
        const görevGetir = await Tasks.findOne({ roleID: role.id });
        const KullaniciData = await Users.findOne({ _id: member.id });
        const yetkiliBilgisi = await Upstaffs.findOne({ _id: member.id });

        if (görevGetir && !yetkiliBilgisi) {
            await Upstaffs.updateOne({ _id: member.id }, { 
                $set: { 
                    staffNo: 1, 
                    staffExNo: 0, 
                    Point: 0, 
                    ToplamPuan: 0, 
                    Baslama: Date.now(), 
                    Yönetim: true 
                } 
            }, { upsert: true });

            await Users.updateOne({ _id: member.id }, { 
                $set: { Staff: true, StaffGiveAdmin: entry.executor.id } 
            }, { upsert: true });

            await Users.updateOne({ _id: member.id }, { 
                $push: { 
                    StaffLogs: { 
                        Date: Date.now(), 
                        Process: "BAŞLATILMA", 
                        Role: role.id, 
                        Author: entry.executor.id 
                    } 
                } 
            }, { upsert: true });

        } else if (görevGetir && yetkiliBilgisi?.Yönetim) {
            await Upstaffs.updateOne({ _id: member.id }, { 
                $set: { Rolde: Date.now() } 
            }, { upsert: true });

            await Users.updateOne({ _id: member.id }, { 
                $push: { 
                    StaffLogs: { 
                        Date: Date.now(), 
                        Process: "GÜNCELLEME", 
                        Role: role.id, 
                        Author: entry.executor.id 
                    } 
                } 
            }, { upsert: true });
        }

        // 3. YASAKLI ROL KONTROLÜ
        if (roller.yasaklıRoller?.includes(role.id) && !ayarlar.staff?.includes(entry.executor.id)) {
            await member.roles.remove(role.id, "Yasaklı rol verildiğinden kaldırıldı.").catch(() => {});
            return;
        }

        // 4. ANA ROL LOG KAYDI
        await Users.updateOne({ _id: member.id }, { 
            $push: { 
                Roles: { 
                    rol: role.id, 
                    mod: entry.executor.id, 
                    tarih: Date.now(), 
                    state: "Ekleme" 
                } 
            } 
        }, { upsert: true });

        // 5. Log Kanalına Mesaj
        const logChannel = member.guild.kanalBul("rol-ver-log");
        if (logChannel) {
            logChannel.send({
                embeds: [new genEmbed().setDescription(
                    `${member} isimli üyeye <t:${Math.floor(Date.now()/1000)}:R> ${yapan} tarafından ${role} rolü verildi.`
                )]
            });
        }

    } catch (err) {
        console.error("guildMemberRoleAdd Event Hatası:", err);
    }
};

module.exports.config = {
    Event: "guildMemberRoleAdd"
};