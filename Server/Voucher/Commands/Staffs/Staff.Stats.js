const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits, 
    ActionRowBuilder, ButtonBuilder, SelectMenuBuilder, 
    ButtonStyle, ComponentType 
} = require("discord.js");
const Stats = require('../../../../Global/Databases/Client.Users.Stats');
const Invites = require('../../../../Global/Databases/Global.Guild.Invites');
const Users = require('../../../../Global/Databases/Client.Users');
const Upstaff = require('../../../../Global/Databases/Client.Users.Staffs');
const { genEmbed } = require('../../../../Global/İnit/Embed');

// Global değişkenlerin ve fonksiyonların varlığı varsayılmıştır.
// const { _statSystem, roller, ayarlar, cevaplar, emojiler, sistem, tarihsel, client.sayılıGün, client.getTime, client.toDate } = global;

module.exports = {
    Isim: "staff-stats",
    Komut: ["ystats", "yetkilistatistik", "yetkili-stat"],
    Kullanim: "staff-stats <@andale/ID>",
    Aciklama: "Belirlenen yetkilinin sunucu içerisindeki görev ve statü bilgilerini gösterir.",
    Kategori: "stat",
    Extend: true,
    
    onLoad: function (client) {},

    onRequest: async function (client, message, args) {
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay) || '✅';
        const iptalEmoji = message.guild.emojis.cache.get(emojiler.Iptal) || '❌';
        
        // İzin Kontrolü
        const hasPermission = roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator);
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Üye Bulma
        let kullanıcı = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;
        let uye = kullanıcı ? message.guild.members.cache.get(kullanıcı.id) : message.member;

        // Yetkili Kontrolü
        let yetkili = client.staffs.check(uye.id) || uye.roles.cache.some(r => _statSystem.staffs.some(x => x.rol === r.id));
        if (!yetkili && !uye.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({ 
                content: `${iptalEmoji} Belirtilen ${uye.toString()} üyesi yetkili olarak bulunamadı.` 
            }).then(s => setTimeout(() => s.delete().catch(err => {}), 7500));
        }
        
        // Veri Çekme
        let Upstaffs = await Upstaff.findOne({ _id: uye.id });
        let stats = await Stats.findOne({ userID: uye.id, guildID: message.guild.id });
        let yetkiBilgisi = _statSystem.staffs.find(x => uye.roles.cache.has(x.rol));
        if (!yetkiBilgisi) yetkiBilgisi = _statSystem.staffs[0];

        let Puan = Upstaffs ? (Upstaffs.Point || 0) : 0;

        // --------------------------------------------------------------------------------
        // İstatistik Fonksiyonları
        // --------------------------------------------------------------------------------

        const getPuanDetay = (Upstaffs) => {
            if (!Upstaffs) return "Veri bulunamadı.";
            return `
\`\`\`fix
Toplam Puan: ${Puan.toFixed(1)} Puan
Görev Puanı: ${Upstaffs.Görev ? Upstaffs.Görev.toFixed(1) : 0} Puan
Ses Puanı: ${Upstaffs.Ses ? Upstaffs.Ses.toFixed(1) : 0} Puan
Tag Puanı: ${Upstaffs.Tag ? Upstaffs.Tag.toFixed(1) : 0} Puan
Kayıt Puanı: ${Upstaffs.Register ? Upstaffs.Register.toFixed(1) : 0} Puan
Davet Puanı: ${Upstaffs.Invite ? Upstaffs.Invite.toFixed(1) : 0} Puan
Yetkili Puanı: ${Upstaffs.Yetkili ? Upstaffs.Yetkili.toFixed(1) : 0} Puan
Bonus Puanı: ${Upstaffs.Bonus ? Upstaffs.Bonus.toFixed(1) : 0} Puan
Toplantı Puanı: ${Upstaffs.Toplantı ? Upstaffs.Toplantı.toFixed(1) : 0} Puan
Etkinlik Puanı: ${Upstaffs.Etkinlik ? Upstaffs.Etkinlik.toFixed(1) : 0} Puan
\`\`\`
            `;
        };
        
        const getYetkiDetay = (Upstaffs) => {
             if (!Upstaffs || !Upstaffs.StaffLogs || Upstaffs.StaffLogs.length === 0) return "Yetki logları bulunamadı.";
             return Upstaffs.StaffLogs.map((x, index) => `\`${index + 1}.\` **${x.Process}** | ${message.guild.roles.cache.get(x.Role) || "Rol Bulunamadı."} | ${message.guild.members.cache.get(x.Author) || "Bilinmiyor"} tarafından. (\`${tarihsel(x.Date)}\`)`).slice(0, 10).join("\n");
        };

        const getSesDetay = (stats) => {
            if (!stats || !stats.voiceStats || stats.voiceStats.size === 0) return "Ses istatistiği bulunamadı.";
            return Array.from(stats.voiceStats.entries())
                .sort(([, a], [, b]) => b - a)
                .map(([channelID, time]) => {
                    let kanal = message.guild.channels.cache.get(channelID);
                    return `\` • \` ${kanal ? kanal.name : "#kanal-adı"} **:** \`${client.sayılıGün(time)}\``;
                }).slice(0, 10).join("\n");
        };

        const getMesajDetay = (stats) => {
            if (!stats || !stats.messageStats || stats.messageStats.size === 0) return "Mesaj istatistiği bulunamadı.";
            return Array.from(stats.messageStats.entries())
                .sort(([, a], [, b]) => b - a)
                .map(([channelID, count]) => {
                    let kanal = message.guild.channels.cache.get(channelID);
                    return `\` • \` ${kanal ? kanal.name : "#kanal-adı"} **:** \`${count} mesaj\``;
                }).slice(0, 10).join("\n");
        };
        
        // --------------------------------------------------------------------------------
        // Embed & Component Hazırlama
        // --------------------------------------------------------------------------------

        const currentRoles = uye.roles.cache.filter(x => x.editable && x.id != message.guild.id).sort((a, b) => b.position - a.position).map(x => x.toString()).join(", ")
        
        const BaseEmbed = (embed) => {
            return embed
                .setAuthor({ name: `${uye.user.tag} Yetkili İstatistik`, iconURL: uye.user.displayAvatarURL({ extension: "png" }) })
                .setDescription(`Aşağıda **${uye.user.tag}** üyesinin yetkili statü bilgileri bulunmaktadır.
                
\` ••❯ \` **Yetki Seviyesi**: ${yetkili ? `Yetkili (\`${yetkiBilgisi.No + 1}. ${yetkiBilgisi.isim}\`)` : "Yetkili Değil."}
\` ••❯ \` **Başlangıç Tarihi**: \`${Upstaffs ? tarihsel(Upstaffs.Rolde) : "Tarih Bulunamadı"}\`
\` ••❯ \` **Toplam Puan**: \`${Puan.toFixed(1)}\`
\` ••❯ \` **Toplam Ses**: \`${stats ? client.sayılıGün(stats.allVoice) : client.sayılıGün(0)}\`
\` ••❯ \` **Toplam Mesaj**: \`${stats ? (stats.allMessage || 0) : 0} Mesaj\`
\` ••❯ \` **Mevcut Rolleri**: ${currentRoles.length > 300 ? "Çok Fazla Rol..." : currentRoles}
`)
                .setFooter({ text: message.member.user.tag, iconURL: message.member.user.displayAvatarURL({ extension: "png" }) })
        };

        const mainEmbed = BaseEmbed(new genEmbed());
        
        // Dropdown/Select Menu (V14 StringSelectMenuBuilder)
        const selectMenu = new ActionRowBuilder().addComponents(
            new SelectMenuBuilder()
                .setCustomId("staff_stats_menu")
                .setPlaceholder("Detaylı İstatistikler")
                .addOptions([
                    { label: "Puan Detayları", description: "Yetki Puanlarının kaynaklarını gösterir.", value: "puan_detay", emoji: "📈" },
                    { label: "Yetki Logları", description: "Yetki yükseltme ve düşürme loglarını gösterir.", value: "yetki_log", emoji: "📜" },
                    { label: "Ses Detayları", description: "Hangi kanallarda ne kadar zaman geçirdiğini gösterir.", value: "ses_detay", emoji: "🎧" },
                    { label: "Mesaj Detayları", description: "Hangi kanallara kaç mesaj attığını gösterir.", value: "mesaj_detay", emoji: "💬" },
                    { label: "Geri Dön", description: "Ana istatistik sayfasına döner.", value: "main_page", emoji: "🏠" },
                ])
        );
        
        // --------------------------------------------------------------------------------
        // Mesajı Gönderme ve Collector Başlatma
        // --------------------------------------------------------------------------------
        
        const msg = await message.channel.send({
            embeds: [mainEmbed],
            components: [selectMenu]
        });

        // Collector Ayarları
        const filter = (i) => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({
            filter,
            time: 60000 * 5, // 5 dakika
            componentType: ComponentType.SelectMenu 
        });

        collector.on('collect', async i => {
            await i.deferUpdate(); 
            let newEmbed = new genEmbed();

            switch (i.values[0]) {
                case "puan_detay":
                    newEmbed = BaseEmbed(newEmbed).addFields({ name: `Puan Detayları`, value: getPuanDetay(Upstaffs), inline: false });
                    break;
                case "yetki_log":
                    newEmbed = BaseEmbed(newEmbed).addFields({ name: `Yetki Logları (Son 10)`, value: getYetkiDetay(Upstaffs), inline: false });
                    break;
                case "ses_detay":
                    newEmbed = BaseEmbed(newEmbed).addFields({ name: `Ses Detayları (Son 10)`, value: getSesDetay(stats), inline: false });
                    break;
                case "mesaj_detay":
                    newEmbed = BaseEmbed(newEmbed).addFields({ name: `Mesaj Detayları (Son 10)`, value: getMesajDetay(stats), inline: false });
                    break;
                case "main_page":
                default:
                    newEmbed = mainEmbed;
                    break;
            }

            // Embed'i güncelle
            i.editReply({ embeds: [newEmbed], components: [selectMenu] }).catch(err => {});
        });

        collector.on('end', collected => {
            // Collector bittiğinde select menu'yu devre dışı bırakma
            const disabledSelect = new ActionRowBuilder().addComponents(
                SelectMenuBuilder.from(selectMenu.components[0]).setDisabled(true)
            );
            msg.edit({ components: [disabledSelect] }).catch(err => {});
        });
    }
};