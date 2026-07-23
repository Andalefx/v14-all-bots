const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits, 
    ActionRowBuilder, ButtonBuilder, SelectMenuBuilder, 
    ButtonStyle, ComponentType 
} = require("discord.js");
const Stats = require('../../../../Global/Databases/Client.Users.Stats');
const Invites = require('../../../../Global/Databases/Global.Guild.Invites');
const Users = require('../../../../Global/Databases/Client.Users');
const Upstaff = require('../../../../Global/Databases/Client.Users.Staffs');
const moment = require('moment');
const { genEmbed } = require('../../../../Global/İnit/Embed');
// Global değişkenlerin ve fonksiyonların varlığı varsayılmıştır.
// const { _statSystem, roller, ayarlar, cevaplar, emojiler, sistem, tarihsel } = global;

module.exports = {
    Isim: "staff-kontrol",
    Komut: ["staffkontrol", "y-kontrol", "yetkilikontrol"],
    Kullanim: "staff-kontrol <@andale/ID>",
    Aciklama: "Belirlenen yetkilinin sunucu içerisindeki görev ve statü bilgilerini gösterir ve yönetim imkanı sunar.",
    Kategori: "stat",
    Extend: true,
    
    onLoad: function (client) {},

    onRequest: async function (client, message, args) {
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay) || '✅';
        const iptalEmoji = message.guild.emojis.cache.get(emojiler.Iptal) || '❌';

        // İzin Kontrolü (Sadece Kurucular)
        const hasPermission = roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator);
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Üye Bulma
        let kullanıcı = message.mentions.users.first() || client.users.cache.get(args[0]);
        let uye = kullanıcı ? message.guild.members.cache.get(kullanıcı.id) : null;
        
        if (!uye) {
            return message.reply({ content: cevaplar.üye }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Kendi Kontrolü
        if (uye.id === message.member.id) {
            return message.reply({ content: cevaplar.kendi }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Yetkili Kontrolü
        let Upstaffs = await Upstaff.findOne({ _id: uye.id });
        let staffData = _statSystem.staffs.find(x => uye.roles.cache.has(x.rol));
        let yetkili = staffData ? true : false;
        
        // Eğer üye yetkili değilse veya yetki verisi yoksa
        if (!Upstaffs || !yetkili) {
            return message.reply({ 
                content: `${iptalEmoji} Belirtilen **${uye.user.tag}** üyesi yetkili olarak bulunamadı.` 
            }).then(s => setTimeout(() => s.delete().catch(err => {}), 7500));
        }

        // --------------------------------------------------------------------------------
        // Veri Çekme ve Hazırlama
        // --------------------------------------------------------------------------------
        
        let stats = await Stats.findOne({ userID: uye.id, guildID: message.guild.id });
        let User = await Users.findOne({ _id: uye.id });
        
        let yetkiBilgisi = _statSystem.staffs.find(x => uye.roles.cache.has(x.rol));
        if (!yetkiBilgisi) yetkiBilgisi = _statSystem.staffs[0];

        let rolBul = _statSystem.staffs[_statSystem.staffs.indexOf(yetkiBilgisi) + 1];
        let rolBulOnceki = _statSystem.staffs[_statSystem.staffs.indexOf(yetkiBilgisi) - 1];

        // İstatistik Hazırlama
        let toplamPuan = (Upstaffs.Point || 0);
        let GörevPuan = (Upstaffs.Görev || 0);
        let SesPuan = (Upstaffs.Ses || 0);
        let TagPuan = (Upstaffs.Tag || 0);
        let KayıtPuan = (Upstaffs.Register || 0);
        let InvitePuan = (Upstaffs.Invite || 0);
        let YetkiliPuan = (Upstaffs.Yetkili || 0);
        let BonusPuan = (Upstaffs.Bonus || 0);
        let ToplantıPuan = (Upstaffs.Toplantı || 0);
        let EtkinlikPuan = (Upstaffs.Etkinlik || 0);

        let Loglar = User.StaffLogs ? User.StaffLogs.map((x, index) => `\`${index + 1}.\` ${message.guild.roles.cache.get(x.Role) || "Rol Bulunamadı."} | ${x.Process} (\`${tarihsel(x.Date)}\`)`).slice(0, 10).join("\n") : "Veri bulunamadı.";
        let Puanlar = `
\`\`\`fix
Toplam Puan: ${toplamPuan.toFixed(1)} Puan
Görev Puanı: ${GörevPuan.toFixed(1)} Puan
Ses Puanı: ${SesPuan.toFixed(1)} Puan
Tag Puanı: ${TagPuan.toFixed(1)} Puan
Kayıt Puanı: ${KayıtPuan.toFixed(1)} Puan
Davet Puanı: ${InvitePuan.toFixed(1)} Puan
Yetkili Puanı: ${YetkiliPuan.toFixed(1)} Puan
Bonus Puanı: ${BonusPuan.toFixed(1)} Puan
Toplantı Puanı: ${ToplantıPuan.toFixed(1)} Puan
Etkinlik Puanı: ${EtkinlikPuan.toFixed(1)} Puan
\`\`\`
        `;
        
        let SesDurumu = stats ? client.sayılıGün(stats.allVoice) : client.sayılıGün(0);
        let MesajDurumu = stats ? (stats.allMessage || 0) : 0;

        // --------------------------------------------------------------------------------
        // Component Hazırlama (V14 Builders)
        // --------------------------------------------------------------------------------
        
        // **Select Menus (Yönetim Seçenekleri)**
        const yetkiSelect = new ActionRowBuilder().addComponents(
            new SelectMenuBuilder()
                .setCustomId("staff_management_select")
                .setPlaceholder("Yetkili Yönetim Seçenekleri (Rol/Puan)")
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions([
                    { label: "Yetki Yükselt", description: rolBul ? `${message.guild.roles.cache.get(rolBul.rol).name} rolüne yükseltir.` : "Yükseltilebilecek bir rol yok.", value: "staff_yukselt", emoji: "⬆️", disabled: !rolBul },
                    { label: "Yetki Düşür", description: rolBulOnceki ? `${message.guild.roles.cache.get(rolBulOnceki.rol).name} rolüne düşürür.` : "Düşürülebilecek bir rol yok.", value: "staff_dusur", emoji: "⬇️", disabled: !rolBulOnceki },
                    { label: "Yetkiyi Al", description: "Üyenin yetkili rollerini alır.", value: "staff_al", emoji: "❌" },
                    { label: "Puan Sıfırla", description: "Üyenin tüm yetki puanlarını sıfırlar.", value: "staff_puan_sıfırla", emoji: "♻️" },
                ])
        );

        // **Buttonlar (İstatistikler)**
        const statButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("staff_yetki_log")
                .setLabel("Yetki Logları")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("📜"),
            new ButtonBuilder()
                .setCustomId("staff_detay")
                .setLabel("Puan Detay")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("📈")
        );

        // **Ana Embed**
        const mainEmbed = new genEmbed()
            .setAuthor({ name: `${message.guild.name} Yetkili Kontrol Sistemi`, iconURL: message.guild.iconURL({ extension: "png" }) })
            .setDescription(`Aşağıda **${uye.user.tag}** üyesinin yetkili bilgileri ve yönetim paneli bulunmaktadır.\n
\` ••❯ \` **Yetkili Bilgisi**: ${yetkili ? `Yetkili (\`${yetkiBilgisi.No + 1}. ${yetkiBilgisi.isim}\`)` : "Yetkili Değil."}
\` ••❯ \` **Toplam Puan**: \`${toplamPuan.toFixed(1)}\`
\` ••❯ \` **Görev Başlangıç**: \`${Upstaffs.Rolde ? tarihsel(Upstaffs.Rolde) : "Tarih Bulunamadı"}\`
\` ••❯ \` **Toplam Ses/Mesaj**: \`${SesDurumu}\` / \`${MesajDurumu} Mesaj\`
`)
            .addFields(
                { name: "Puan Detayları:", value: Puanlar, inline: false }
            );

        // --------------------------------------------------------------------------------
        // Mesajı Gönderme ve Collector Başlatma
        // --------------------------------------------------------------------------------
        
        const msg = await message.channel.send({
            embeds: [mainEmbed],
            components: [yetkiSelect, statButtons]
        });

        // Collector Ayarları
        const filter = (i) => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({
            filter,
            time: 60000 * 5, // 5 dakika
            componentType: ComponentType.Any 
        });

        collector.on('collect', async i => {
            // Kullanıcı etkileşimini erteleme (defer)
            await i.deferUpdate(); 

            if (i.customId === "staff_yetki_log") {
                // Yetki Logları Butonu
                const logEmbed = new genEmbed()
                    .setDescription(`**${uye.user.tag}** üyesinin son 10 yetki logu:\n\n${Loglar}`);
                    
                i.editReply({ embeds: [logEmbed], components: [yetkiSelect, statButtons] });

            } else if (i.customId === "staff_detay") {
                // Puan Detay Butonu (Ana embed zaten detayları içerdiği için tekrar ana embed'i gönderir)
                i.editReply({ embeds: [mainEmbed], components: [yetkiSelect, statButtons] });

            } else if (i.customId === "staff_management_select") {
                const selected = i.values[0];
                
                if (selected === "staff_yukselt") {
                    // Yetki Yükseltme
                    if (!rolBul) return i.editReply({ content: `${iptalEmoji} Yükseltilebilecek bir rol bulunamadı.`, ephemeral: true });
                    
                    // Yükseltme işlemini yap (Orijinal kodunuzdaki yükseltme mantığı burada çalışır)
                    // ... (Burada yükseltme mantığı çalıştırılmalı) ...
                    
                    // Basitleştirilmiş yükseltme:
                    const newRoles = uye.roles.cache.filter(x => yetkiBilgisi.rol !== x.id && !yetkiBilgisi.exrol.includes(x.id)).map(x => x.id);
                    newRoles.push(rolBul.rol);
                    if (rolBul.exrol && rolBul.exrol.length > 0) newRoles.push(...rolBul.exrol);

                    await uye.roles.set(newRoles).catch(err => {});

                    const successEmbed = new genEmbed().setDescription(`${onayEmoji} **${uye.user.tag}** üyesi başarıyla **${message.guild.roles.cache.get(rolBul.rol).name}** rolüne **yükseltildi!**`);
                    i.editReply({ embeds: [successEmbed], components: [yetkiSelect, statButtons] });

                } else if (selected === "staff_dusur") {
                    // Yetki Düşürme
                    if (!rolBulOnceki) return i.editReply({ content: `${iptalEmoji} Düşürülebilecek bir rol bulunamadı.`, ephemeral: true });
                    
                    // Düşürme işlemini yap (Orijinal kodunuzdaki düşürme mantığı burada çalışır)
                    // ... (Burada düşürme mantığı çalıştırılmalı) ...
                    
                    // Basitleştirilmiş düşürme:
                    const newRoles = uye.roles.cache.filter(x => yetkiBilgisi.rol !== x.id && !yetkiBilgisi.exrol.includes(x.id)).map(x => x.id);
                    newRoles.push(rolBulOnceki.rol);
                    if (rolBulOnceki.exrol && rolBulOnceki.exrol.length > 0) newRoles.push(...rolBulOnceki.exrol);
                    
                    await uye.roles.set(newRoles).catch(err => {});
                    
                    const successEmbed = new genEmbed().setDescription(`${onayEmoji} **${uye.user.tag}** üyesi başarıyla **${message.guild.roles.cache.get(rolBulOnceki.rol).name}** rolüne **düşürüldü!**`);
                    i.editReply({ embeds: [successEmbed], components: [yetkiSelect, statButtons] });
                    
                } else if (selected === "staff_al") {
                    // Yetkiyi Alma (Yetki Çek)
                    if (client.staffs.check(uye.id)) { // Global yetki kontrol fonksiyonunuz
                        uye.removeStaff(uye.roles.cache, true);
                        const successEmbed = new genEmbed().setDescription(`${onayEmoji} **${uye.user.tag}** üyesinin yetkisi başarıyla **alındı!**`);
                        i.editReply({ embeds: [successEmbed], components: [yetkiSelect, statButtons] });
                    } else {
                        i.editReply({ content: `${iptalEmoji} Üye zaten yetkili değil veya yetki alımı başarısız oldu.`, ephemeral: true });
                    }

                } else if (selected === "staff_puan_sıfırla") {
                    // Puan Sıfırlama
                    await Upstaff.updateOne({ _id: uye.id }, { 
                        $set: { 
                            "Point": 0, "Yetkili": 0, "Görev": 0, "Invite": 0, "Tag": 0, "Register": 0, 
                            "Ses": new Map(), "Mesaj": 0, "Bonus": 0, "Toplantı": 0, "Etkinlik": 0 
                        }
                    }, { upsert: true });

                    const successEmbed = new genEmbed().setDescription(`${onayEmoji} **${uye.user.tag}** üyesinin yetki puanları başarıyla **sıfırlandı!**`);
                    i.editReply({ embeds: [successEmbed], components: [yetkiSelect, statButtons] });
                }
            }
        });

        collector.on('end', collected => {
            // Collector bittiğinde komponentleri devre dışı bırakma
            const disabledSelect = new ActionRowBuilder().addComponents(
                SelectMenuBuilder.from(yetkiSelect.components[0]).setDisabled(true)
            );
            const disabledButtons = new ActionRowBuilder().addComponents(
                ButtonBuilder.from(statButtons.components[0]).setDisabled(true),
                ButtonBuilder.from(statButtons.components[1]).setDisabled(true)
            );

            msg.edit({ components: [disabledSelect, disabledButtons] }).catch(err => {});
        });
    }
};