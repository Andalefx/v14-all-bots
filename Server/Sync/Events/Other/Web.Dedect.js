const { 
    Client, 
    Guild, 
    GuildMember, 
    EmbedBuilder, // MessageEmbed yerine
    ActionRowBuilder, // MessageActionRow yerine
    ButtonBuilder, // MessageButton yerine
    ButtonStyle, // Buton Stilleri için
    PermissionsBitField, // İzinler için
    Events // Olay tanımı için
} = require("discord.js");

// Varsayımlar:
// Global dosyalardan gelen gerekli ayarların tanımlı olduğunu varsayıyoruz.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Roles = require('../../../../Global/Databases/GuildMember.Roles.Backup');
const Guard = require('../../../../Global/Databases/Global.Guard.Settings');

// Global değişkenlerin import edildiğini veya tanımlı olduğunu varsayıyoruz
const sistem = global.sistem || {};
const ayarlar = global.ayarlar || {};
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 

/**
 * @param {Client} client
 */
module.exports = (client) => {

    // 20 Saniyede Bir Çalışacak Interval
    setInterval(async () => {
        // İzinler Listesi (PermissionsBitField kullanılarak V14'e uyarlandı)
        const Permissions = [
            PermissionsBitField.Flags.Administrator, 
            PermissionsBitField.Flags.ManageRoles, 
            PermissionsBitField.Flags.ManageChannels, 
            PermissionsBitField.Flags.ManageGuild,  
            PermissionsBitField.Flags.ManageEmojisAndStickers, 
            PermissionsBitField.Flags.ManageWebhooks
        ];
        
        // Sunucuya Erişim
        const guild = client.guilds.cache.get(sistem.SERVER.ID);
        if (!guild) return;

        // Web Guard Ayarı Kontrolü
        let Data = await Guard.findOne({ guildID: guild.id });
        if (Data && !Data.webGuard) return;

        // Webden Giriş Yapan Yöneticiyi Bulma İşlemi
        guild.members.cache.filter(x => 
            !x.user.bot && // Bot olmamalı
            x.presence && // Çevrimiçi durumu olmalı
            x.presence.clientStatus && x.presence.clientStatus.web && // Web'den bağlı olmalı
            x.roles.cache.some(e => 
                e.editable && 
                e.name !== "@everyone" && 
                Permissions.some(p => e.permissions.has(p)) // Yüksek yetkili role sahip olmalı
            )
        ).forEach(async (uye) => {
            
            // Eğer üyenin yüksek yetkisi yoksa veya Guard tarafından göz ardı edilecekse (whitelist vb.)
            // client.checkMember(uye.id) fonksiyonunuzun içeriği bilinmediği için koruma amaçlı kaldırılmadı.
            if (client.checkMember && await client.checkMember(uye.id)) return; 
            
            let embed = new EmbedBuilder();
            let arr = [];
            
            // Üzerindeki yüksek yetkili rolleri filtrele
            let memberSafeRoles = uye.roles.cache.filter((e) => e.editable && e.name !== "@everyone" && Permissions.some((a) => e.permissions.has(a)));
            if (memberSafeRoles) {
                memberSafeRoles.forEach(rol => {
                    arr.push(rol.id);
                });
            }

            // --- Yetki Çekme ve Loglama ---
            
            // Rolleri kaydet ve çek
            await Roles.updateOne({ _id: uye.id }, { $set: { "Roles": arr, Reason: "Web tarayıcı girişi için kaldırıldı." } }, { upsert: true });
            if (arr.length >= 1) {
                await uye.roles.remove(arr, `Web üzerinden sunucuyu görüntülediği için.`).catch(err => {});
            }

            // Embed Oluşturma
            embed.setFooter({ text: "Aşağıdaki düğmeyi sadece sunucu sahibi kullanabilir." })
                 .setTitle("Bir Yönetici Sunucuya Webden Giriş Sağladı!")
                 .setDescription(`${uye} (\`${uye.id}\`) isimli yönetici Web tarayıcısından **Sunucu** ekranına giriş yaptığı için yetkisi çekildi.\n\`\`\`fix
Üzerinden Alınan Roller \`\`\`\
${arr.length >= 1 ? `\` ••❯ \` Çekilen Roller: ${arr.filter(x => guild.roles.cache.get(x)).map(x => guild.roles.cache.get(x).name).join(", ")}` : `\` ••❯ \` Üzerinden herhangi bir rol alınmadı.` } `)
                 .setColor(ButtonStyle.Danger); // Tehlike rengi

            // Buton Oluşturma (V14)
            let Row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setCustomId('ver')
                .setEmoji(emojiler.Onay || '✅') 
                .setLabel('Rolleri Geri Ver!')
                .setStyle(ButtonStyle.Secondary),
            );

            // Log Kanalına Gönderme
            let loged = guild.channels.cache.find(x => x.name === "guard-log"); // kanalBul fonksiyonu yerine cache kullanıldı.
            
            if (loged) {
                await loged.send({ embeds: [embed], components: [Row] }).then(async (msg) => {
                    const tacsahip = await guild.fetchOwner();
                    
                    // Toplayıcı Filtresi (Sunucu sahibi veya yetkili staff)
                    const filter = i => i.customId === "ver" && (ayarlar.staff.includes(i.user.id) || i.user.id === tacsahip.user.id);
                    const collector = msg.createMessageComponentCollector({ filter, max: 1, time: 60000 * 5 }); // 5 dakika süre

                    collector.on('collect', async i => {
                        if (i.customId === "ver") {
                            let Data = await Roles.findOne({ _id: uye.id });
                            if (Data && Data.Roles && Data.Roles.length) {
                                // Rolleri geri ver
                                await uye.roles.add(Data.Roles, `${i.user.tag} tarafından tekrardan verildi.`).catch(err => {});
                                await Roles.findByIdAndDelete(uye.id);
                                
                                i.reply({ content: `${emojiler.Onay || '✅'} ${uye}, üyesinin çekilen rolleri başarıyla geri verildi.`, ephemeral: true });
                            } else {
                                i.reply({ content: `${emojiler.Iptal || '❌'} ${uye}, üyesinin rolleri veritabanında bulunamadığından işlem sonlandırıldı.`, ephemeral: true });
                            }
                        }
                    });

                    collector.on('end', c => {
                        msg.edit({ embeds: [embed], components: [] }).catch(err => {});
                    });
                });
            }
            
            // Sunucu Sahibine Bilgi
            const owner = await guild.fetchOwner();
            if (owner) owner.send({ embeds: [embed] }).catch(err => {});
        });
    }, 20000); // 20 saniye
}

// Olay Yapılandırması
module.exports.config = {
    Event: "ready"
};