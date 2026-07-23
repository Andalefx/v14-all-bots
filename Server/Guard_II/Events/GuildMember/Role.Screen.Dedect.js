const { GuildMember,  Guild, AuditLogEvent,  ButtonBuilder, ButtonStyle, Client, ActionRowBuilder } = require("discord.js");
const fs = require('fs');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Roles = require('../../../../Global/Databases/GuildMember.Roles.Backup');

/**
* @param {GuildMember} oldPresence
* @param {GuildMember} newPresence
*/

// Not: Bu event dosyasında iki ayrı "presenceUpdate" işleyicisi bulunmaktadır.
// İlki, dosya export'u (offline guard), ikincisi client.on() (web guard).

// =================================================================
// 1. Çevrimdışı Koruma (Offline Guard)
// =================================================================

module.exports = async (oldPresence, newPresence) => {
    if (!newPresence) return;
    if (!newPresence.member) return;
    
    const client = newPresence.client;
    const ayarlar = global.ayarlar || {}; // Eğer ayarlar globalde tanımlıysa
    const emojiler = global.emojiler || {}; // Eğer emojiler globalde tanımlıysa
    
    let embed = new genEmbed()
    let uye = newPresence.guild.members.cache.get(newPresence.member.user.id);
    
    if (!uye) return;
    // Sunucu ID kontrolü (global.sistem.SERVER.ID'nin tanımlı olduğu varsayılır)
    if (uye.guild.id != global.sistem.SERVER.ID) return;

    const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
    let Data = await Guard.findOne({ guildID: uye.guild.id });
    if (Data && !Data.offlineGuard) return;

    // V14 GÜNCELLEMESİ: MessageActionRow ve MessageButton -> ActionRowBuilder ve ButtonBuilder kullanıldı.
    // Ancak bu kısım sadece Web Guard'da kullanıldığı için burada tutulmasına gerek yok.

    const Permissions = ["Administrator", "ManageRoles", "ManageChannels", "ManageGuild", "ManageEmojisAndStickers", "ManageWebhooks"];

    let arr = [];

    // V14 GÜNCELLEMESİ: clientStatus'a doğrudan erişim.
    // let Dedection = Object.keys(newPresence.member.presence.clientStatus); // V13'te bu çalışıyordu, V14'te clientStatus objesi undefined olabilir.
    
    // Güvenlik Rollerini Tespit Et
    let memberSafeRoles = uye.roles.cache.filter((e) => e.editable && e.name !== "@everyone" && Permissions.some((a) => e.permissions.has(a)));
    if (memberSafeRoles) memberSafeRoles.forEach(rol => {
        arr.push(rol.id);
    });

    // Durum: Yönetici çevrimdışına düştü
    if (uye && uye.presence && uye.presence.status === "offline" && Permissions.some(x => uye.permissions.has(x))) {
        
        // Yönetici korumasından muaf değilse ve yetkisi varsa
        if (await client.checkMember(uye.id)) return;

        // Rolleri kaydet ve çek
        await Roles.updateOne({ _id: uye.id }, { $set: { "Roles": arr, Reason: "Çevrimdışı" } }, { upsert: true });
        if (arr && arr.length >= 1) await uye.roles.remove(arr, `Çevrimdışı alındığından dolayı yetkisi çekildi.`).catch(err => {});
        
        // Loglama
        embed.setFooter({ text: "Aktif olduğunda yetkisi tekrardan verilecektir." }).setTitle("Sunucuda Bir Yönetici Çevrim-Dışı Aldı!").setDescription(`${uye} (\`${uye.id}\`) isimli yönetici **Çevrim-Dışı** oldu.\n\n\`\`\`fix\nÜzerinden Alınan Roller\n\`\`\`\n${arr.length >= 1 ? `\` ••❯ \` Çekilen Roller: ${arr.filter(x => uye.guild.roles.cache.get(x)).map(x => uye.guild.roles.cache.get(x)).join(", ")}` : `\` ••❯ \` Üzerinden herhangi bir rol alınmadı.`}`);
        
        let loged = newPresence.guild.kanalBul("guard-log");
        if (loged) await loged.send({ embeds: [embed] }).catch(err => {});
        
    // Durum: Yönetici aktif oldu (Çevrimdışı Koruma Geri Alma)
    } else if (uye && oldPresence && oldPresence.status === "offline" && uye.presence.status !== "offline") {
        let Data = await Roles.findOne({ _id: uye.id, Reason: "Çevrimdışı" });
        if (Data && Data.Roles && Data.Roles.length) {
            // Kaydedilen rolleri geri ver
            if (Data.Roles) uye.roles.add(Data.Roles, `Aktif olduğundan dolayı çekilen yetkileri tekrardan verildi.`).catch(err => {});
            await Roles.findByIdAndDelete(uye.id);
        }
    }
}

module.exports.config = {
    Event: "presenceUpdate"
}

// =================================================================
// 2. Web Tarayıcı Girişi Koruma (Web Guard) - client.on() kullanıldı.
// =================================================================

// client'ın global olarak tanımlı olduğu varsayılıyor.
if (global.client instanceof Client) { // client objesinin varlığını ve tipini kontrol et
    client.on("presenceUpdate", async (oldPresence, newPresence) => {
        if (!newPresence || !newPresence.member || !newPresence.guild) return;

        const client = newPresence.client;
        const ayarlar = global.ayarlar || {};
        const emojiler = global.emojiler || {};
        
        let embed = new genEmbed()
        let uye = newPresence.guild.members.cache.get(newPresence.member.user.id);

        if (!uye) return;
        if (uye.guild.id != global.sistem.SERVER.ID) return;

        const Guard = require('../../../../Global/Databases/Global.Guard.Settings');
        let Data = await Guard.findOne({ guildID: uye.guild.id });
        if (Data && !Data.webGuard) return;

        // V14 GÜNCELLEMESİ: Buton Tanımlama (ButtonBuilder ve MessageActionRow)
        let Row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ver')
                .setEmoji(newPresence.guild.emojiGöster(emojiler.Onay) || "✅") // Emoji kontrolü eklenmeli
                .setLabel('Rolleri Geri Ver!')
                .setStyle(ButtonStyle.Secondary),
        );
        
        const Permissions = ["Administrator", "ManageRoles", "ManageChannels", "ManageGuild", "ManageEmojisAndStickers", "ManageWebhooks"];
        
        let arr = [];
        let clientStatus = newPresence.member.presence?.clientStatus;
        
        // V14 GÜNCELLEMESİ: presence.clientStatus objesini kontrol et
        let CheckWeb = clientStatus && clientStatus.web;

        let memberSafeRoles = uye.roles.cache.filter((e) => e.editable && e.name !== "@everyone" && Permissions.some((a) => e.permissions.has(a)));
        if (memberSafeRoles) memberSafeRoles.forEach(rol => {
            arr.push(rol.id);
        });

        // Durum: Yönetici Web'den giriş yaptı
        if (CheckWeb && Permissions.some(x => uye.permissions.has(x))) {
            
            // Eğer üyenin önceki durumu da web ise veya web'den mobilden geçtiyse çalışmaması için kontrol eklenebilir.
            if (oldPresence && oldPresence.member.presence?.clientStatus?.web) return;

            if (await client.checkMember(uye.id)) return;

            // Rolleri kaydet ve çek
            await Roles.updateOne({ _id: uye.id }, { $set: { "Roles": arr, Reason: "Web tarayıcı girişi için kaldırıldı." } }, { upsert: true });
            if (arr && arr.length >= 1) await uye.roles.remove(arr, `Web üzerinden sunucuyu görüntülediği için.`).catch(err => {});

            // Loglama
            embed.setFooter({ text: "Aşağıdaki düğmeyi sadece sunucu sahibi veya yetkili kullanabilir." }).setTitle("Bir Yönetici Sunucuya Webden Giriş Sağladı!").setDescription(`${uye} (\`${uye.id}\`) isimli yönetici Web tarayıcısından **Sunucu** ekranına giriş yaptığı için yetkisi çekildi.\n\n\`\`\`fix\nÜzerinden Alınan Roller\n\`\`\`\n${arr.length >= 1 ? `\` ••❯ \` Çekilen Roller: ${arr.filter(x => uye.guild.roles.cache.get(x)).map(x => uye.guild.roles.cache.get(x).name).join(", ")}` : `\` ••❯ \` Üzerinden herhangi bir rol alınmadı.`}`);

            let loged = newPresence.guild.kanalBul("guard-log");
            if (loged) await loged.send({ embeds: [embed], components: [Row] }).then(async (msg) => {
                
                const tacsahip = await newPresence.guild.fetchOwner();
                // Filter V14'te Permission Overwrites'i kontrol ederken büyük/küçük harf duyarlı olabilir.
                const filter = i => i.customId === "ver" && (ayarlar.staff.includes(i.user.id) || i.user.id === tacsahip.id);
                
                const collector = msg.createMessageComponentCollector({ filter, max: 1, time: 60000 }); // Collector süresi eklendi
                
                collector.on('collect', async i => {
                    await i.deferUpdate();
                    if (i.customId === "ver") {
                        let Data = await Roles.findOne({ _id: uye.id });
                        if (Data && Data.Roles && Data.Roles.length) {
                            i.followUp({ content: `${newPresence.guild.emojiGöster(emojiler.Onay) || "✅"} ${uye}, üyesinin çekilen rolleri başarıyla geri verildi.`, ephemeral: true });
                            if (Data.Roles) uye.roles.add(Data.Roles, `${i.user.tag} tarafından tekrardan verildi.`).catch(err => {});
                            await Roles.findByIdAndDelete(uye.id);
                        } else {
                            i.followUp({ content: `${newPresence.guild.emojiGöster(emojiler.Iptal) || "❌"} ${uye}, üyesinin rolleri veritabanında bulunamadığından işlem sonlandırıldı.`, ephemeral: true });
                        }
                    }
                });
                
                collector.on('end', c => {
                    msg.edit({ embeds: [embed], components: [] }).catch(err => {});
                });
                
            }).catch(err => {}); // Loged send catch
            
            const owner = await newPresence.guild.fetchOwner();
            if (owner) owner.send({ embeds: [embed] }).catch(err => {});
            
            client.processGuard({
                type: "Tarayıcı Girişi!",
                target: uye.id,
            });
        }
    });
}