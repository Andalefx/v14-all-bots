const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType 
} = require("discord.js");
const Unleash = require('../../../../Global/Databases/Guıild.Remove.Staffs');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require('../../../../Global/İnit/Embed');

// Global değişkenlerin ve client metodlarının (roller, ayarlar, cevaplar, emojiler, _statSystem) varlığı varsayılmıştır.
// const { roller, ayarlar, cevaplar, emojiler, _statSystem } = global; 

module.exports = {
    Isim: "yetkibaşlat",
    Komut: ["ytbaşlat", "ybaşlat", "yetkiliyap", "yetkili"],
    Kullanim: "yetkibaşlat <@andale/ID>",
    Aciklama: "Belirlenen üyeyi yetkiye davet eder veya direkt yetkili yapar.",
    Kategori: "yönetim",
    Extend: true,
    
    onLoad: function (client) {},

    onRequest: async function (client, message, args) {
        let embed = new genEmbed();
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay) || '✅';
        const iptalEmoji = message.guild.emojis.cache.get(emojiler.Iptal) || '❌';
        const now = Date.now();
        const unixTime = String(now).slice(0, 10);

        // İzin Kontrolü
        const hasPermission = roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.yükselticiRoller.some(x => message.member.roles.cache.has(x)) ||
                              roller.limitliYükselticiRolleri.some(x => message.member.roles.cache.has(x)) || 
                              roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator);
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Üye Bulma
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!uye) {
            return message.reply({ content: cevaplar.üye }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Kendi Kontrolü
        if (message.author.id === uye.id) {
            return message.reply({ content: cevaplar.kendi }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Kayıtsız Rol Kontrolü
        if (roller.kayıtsızRolleri.some(x => uye.roles.cache.has(x))) {
            return message.react(iptalEmoji).catch(err => {});
        }

        // Hesap Yaşı Kontrolü (7 Günden Yeniyse)
        const minAccountAge = 1000 * 60 * 60 * 24 * 7;
        if (now - uye.user.createdTimestamp < minAccountAge && !ayarlar.staff.includes(message.member.id)) {
            message.react(iptalEmoji).catch(err => {});
            return message.reply({ content: cevaplar.yenihesap }).then(x => {
                setTimeout(() => { x.delete().catch(err => {}) }, 7500);
            });
        }
        
        // Tag Kontrolleri
        if (ayarlar.type && !uye.user.username.includes(ayarlar.tag)) {
            return message.reply({
                content: `Belirtilen üyenin üzerinde **${ayarlar.tag}** sembolü bulunmadığından işleme devam edilemiyor. ${cevaplar.prefix}`
            }).then(x => {
                setTimeout(() => { x.delete().catch(err => {}) }, 7500);
            });
        }
        if ((ayarlar && ayarlar.yetkiliYasaklıTag) && ayarlar.yetkiliYasaklıTag.filter(x => x != ayarlar.tag).some(x => uye.user.username.includes(x))) {
            return message.reply({
                content: `Belirtilen üyenin üzerinde bir yasaklı tag bulunmakta! Bu nedenden dolayı yetki işlemine devam edilemiyor. ${cevaplar.prefix}`
            }).then(x => {
                setTimeout(() => { x.delete().catch(err => {}) }, 7500);
            });
        }
        
        // Üyenin Zaten Yetkili Olup Olmadığı Kontrolü (Rol Pozisyonu)
        let yetkiliRol = message.guild.roles.cache.get(roller.altilkyetki);
        let uyeUstRol = uye.roles.highest; // V14'te .highest member.roles'un bir property'sidir.
        
        if (yetkiliRol && uyeUstRol && yetkiliRol.position < uyeUstRol.position) {
             return message.reply({
                content: `Belirtilen üyenin üzerinde yetkili rolü bulunmakta! Bu nedenden dolayı yetki işlemine devam edilemiyor. ${cevaplar.prefix}`
            }).then(x => {
                setTimeout(() => { x.delete().catch(err => {}) }, 7500);
            });
        }

        // Yetki Salma Kontrolü
        let yetkiSalma = await Unleash.findOne({ _id: uye.id });
        if (yetkiSalma) {
            if (yetkiSalma.unleashPoint && yetkiSalma.unleashPoint == 1) {
                embed.setFooter({ text: `${uye.user.tag} üyesi daha önce yetki salmış birdaha salarsa yetkili olamayacak.` });
            } else {
                embed.setFooter({ text: `${uye.user.tag} üyesinin yetki salma hakkı ${yetkiSalma.unleashPoint ? yetkiSalma.unleashPoint : 0} adet bulunuyor.` });
            }
            if (yetkiSalma.unleashPoint >= 2 && !ayarlar.staff.includes(message.member.id)) {
                message.react(iptalEmoji).catch(err => {});
                return message.reply({
                    embeds: [new genEmbed().setFooter({ text: `${yetkiSalma.unleashPoint} yetki salma hakkı bulunmakta.` }).setDescription(`${iptalEmoji} ${uye} isimli üyesi birden fazla kez yetki saldığından dolayı işlem yapılamıyor.`)]
                }).then(x => {
                    setTimeout(() => { x.delete().catch(err => {}) }, 12500);
                });
            }
        }
        
        // Üye Zaten Yetkili mi? (Veritabanı Kontrolü)
        let kontrol = await Users.findOne({ _id: uye.id });
        if (kontrol && kontrol.Staff) {
            return message.reply({ content: `${cevaplar.prefix} ${uye} isimli üye zaten yetkili olarak belirlenmiş.` });
        }
        
        // --------------------------------------------------------------------------------
        // Yetkili Rolüne Direkt Ekleme (Kurucu/Admin Yetkisine Sahipse)
        // --------------------------------------------------------------------------------
        
        const isDirectStaff = message.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku));

        if (isDirectStaff) {
            message.react(onayEmoji).catch(err => {});
            
            // Veritabanı Güncellemeleri
            await Users.updateOne({ _id: uye.id }, { $set: { "Staff": true, "StaffGiveAdmin": message.member.id } }, { upsert: true });
            await Users.updateOne({ _id: message.member.id }, { $push: { "Staffs": { id: uye.id, Date: now } } }, { upsert: true });

            // Log Kaydı
            await Users.updateOne({ _id: uye.id }, { $push: { "StaffLogs": {
                Date: now, Process: "BAŞLATILMA", Role: roller.başlangıçYetki, Author: message.member.id
            }}}, { upsert: true });

            // Puan ve Liderlik Güncellemeleri
            client.Upstaffs.addPoint(message.member.id, _statSystem.points.staff, "Yetkili");
            message.member.Leaders("yetki", _statSystem.points.staff, { type: "STAFF", user: uye.id });

            // Rol ve Nickname İşlemleri
            const initialRoles = [roller.başlangıçYetki, roller.altilkyetki].filter(r => r); // Geçersiz rol ID'lerini filtrele
            uye.setNickname(uye.displayName.replace(ayarlar.tagsiz, ayarlar.tag)).catch(err => {});
            
            // Rolleri ekle ve Bonus puanı ver
            if (initialRoles.length > 0) {
                 uye.roles.add(initialRoles).then(x => client.Upstaffs.addPoint(uye.id, "1", "Bonus")).catch(err => {});
            } else {
                 client.Upstaffs.addPoint(uye.id, "1", "Bonus"); // Rol yoksa bile bonus puanı ver
            }

            // Başarılı Mesaj
            message.reply({
                embeds: [embed.setDescription(`${onayEmoji} Başarıyla ${uye.toString()} üyesi ${message.author} tarafından <t:${unixTime}:R> başarıyla yetkili olarak başlatıldı!`)],
                components: []
            });
            
            // Log Kanalı
            let yetkiliLog = message.guild.channels.cache.find(x => x.name === "yetki-ver-log") || message.guild.kanalBul("yetki-ver-log");
            if (yetkiliLog) yetkiliLog.send({ embeds: [embed.setDescription(`${uye} isimli üye <t:${unixTime}:R> ${message.author} tarafından yetkili olarak başlatıldı.`)] }).catch(err => {});
            
            return;
        }

        // --------------------------------------------------------------------------------
        // Yetkili Daveti (Daha Düşük Yetkililer İçin)
        // --------------------------------------------------------------------------------

        // Button Componentleri (V14 ActionRowBuilder ve ButtonBuilder)
        let Row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("OK")
                .setEmoji(onayEmoji)
                .setLabel("Kabul Ediyorum!")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId("NO")
                .setEmoji(iptalEmoji)
                .setLabel("Kabul Etmiyorum!")
                .setStyle(ButtonStyle.Secondary),
        );
        
        const yetkiRolName = roller.başlangıçYetki ? message.guild.roles.cache.get(roller.başlangıçYetki) ? `${message.guild.roles.cache.get(roller.başlangıçYetki)} yetkisinden yetkili` : "yetkili" : "yetkili";

        embed.setDescription(`${message.member.toString()} isimli yetkili seni **${message.guild.name}** sunucusunda ${yetkiRolName} yapmak istiyor. Kabul ediyor musun?`);
        
        await message.channel.send({ content: uye.toString(), embeds: [embed], components: [Row] }).then(async (msg) => {
            const filter = i => i.user.id === uye.id;
            const collector = msg.createMessageComponentCollector({ filter, time: 30000, componentType: ComponentType.Button });

            collector.on('collect', async (i) => {
                // Kullanıcı etkileşimini erteleme (defer)
                await i.deferUpdate().catch(err => {});

                if (i.customId === "OK") {
                    message.react(onayEmoji).catch(err => {});
                    
                    // Veritabanı Güncellemeleri
                    await Users.updateOne({ _id: uye.id }, { $set: { "Staff": true, "StaffGiveAdmin": message.member.id } }, { upsert: true });
                    await Users.updateOne({ _id: message.member.id }, { $push: { "Staffs": { id: uye.id, Date: now } } }, { upsert: true });
                    
                    // Puan ve Liderlik Güncellemeleri
                    client.Upstaffs.addPoint(message.member.id, _statSystem.points.staff, "Yetkili");
                    message.member.Leaders("yetki", _statSystem.points.staff, { type: "STAFF", user: uye.id });
                    
                    // Rol ve Nickname İşlemleri
                    const initialRoles = [roller.başlangıçYetki, roller.altilkyetki].filter(r => r);
                    uye.setNickname(uye.displayName.replace(ayarlar.tagsiz, ayarlar.tag)).catch(err => {});
                    
                    if (initialRoles.length > 0) {
                         uye.roles.add(initialRoles).then(x => client.Upstaffs.addPoint(uye.id, "1", "Bonus")).catch(err => {});
                    } else {
                         client.Upstaffs.addPoint(uye.id, "1", "Bonus");
                    }

                    // Başarılı Mesaj ve Log
                    msg.delete().catch(err => {});
                    message.channel.send({ 
                        content: null, 
                        embeds: [embed.setDescription(`${onayEmoji} Başarıyla ${uye.toString()} üyesi ${message.author} tarafından <t:${unixTime}:R> başarıyla ${yetkiRolName} olarak başlatıldı!`)], 
                        components: [] 
                    }).catch(err => {});
                    
                    let yetkiliLog = message.guild.channels.cache.find(x => x.name === "yetki-ver-log") || message.guild.kanalBul("yetki-ver-log");
                    if (yetkiliLog) yetkiliLog.send({ embeds: [embed.setDescription(`${uye} isimli üye <t:${unixTime}:R> ${message.author} tarafından yetkili olarak başlatıldı.`)] }).catch(err => {});
                    
                } else if (i.customId === "NO") {
                    msg.edit({
                        content: message.member.toString(),
                        embeds: [new genEmbed().setColor("Red").setDescription(`${iptalEmoji} **${uye.user.tag}** isimli üye, **${message.guild.name}** sunucusunda yetkili olma teklifini reddetti!`)],
                        components: []
                    }).catch(err => {});
                    message.react(iptalEmoji).catch(err => {});
                }
            });

            collector.on('end', collected => {
                // Süre bittiğinde mesajı sil
                if (msg && !msg.deleted) msg.delete().catch(err => {});
            });
        }).catch(err => {});
    }
};