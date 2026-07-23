const { 
    Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    TextInputBuilder, ModalBuilder, Util, ButtonStyle, TextInputStyle, 
    PermissionFlagsBits 
} = require("discord.js");
const Stats = require('../../../../Global/Databases/Client.Users.Stats')
const InviteData = require('../../../../Global/Databases/Global.Guild.Invites');
const Users = require('../../../../Global/Databases/Client.Users');
const Upstaffs = require('../../../../Global/Databases/Client.Users.Staffs');
const Tasks = require('../../../../Global/Databases/Client.Users.Tasks');
const moment = require('moment');
const ms = require('ms')
const { genEmbed } = require('../../../../Global/İnit/Embed');
require('moment-duration-format');
require('moment-timezone');
const table = require('table');

// Discord Modals kütüphanesine artık gerek yok, kaldırıldı.
let rolId;
let periyod;
let ödül;

module.exports = {
    Isim: "görevyönetim",
    Komut: ["görevsistemi","görev-yönetim","görevyönetimi"],
    Kullanim: "görevyönetim",
    Aciklama: "Belirlenen üye veya kullanan üye eğer ki yetkiliyse onun yetki atlama bilgilerini gösterir.",
    Kategori: "kurucu",
    Extend: true,
    
    /**
    * @param {Client} client 
    */
    onLoad: function (client) {
        client.yetkiliSesSureCevir = (date) => { return moment.duration(date).format('H'); };

        // V14'te modal işlemleri genellikle 'interactionCreate' event'i içinde yapılır.
        // Ancak kodunuzun yapısına uymak için, burada global bir listener varmış gibi 
        // V14 modal yapısını kullanacak şekilde güncelliyorum.
        // Bu listener'ın çalışması için botunuzun ana dosyasında interactionCreate event'ini dinlediğinizden emin olun.
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isModalSubmit()) return; // Sadece Modal Submit'leri dinle

            const modal = interaction;
            let guild = client.guilds.cache.get(global.sistem.SERVER.ID);

            if(!guild) {
                await modal.deferReply({ ephemeral: true });
                return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true });
            }
            
            let uye = guild.members.cache.get(modal.user.id);
            if(!uye) {
                await modal.deferReply({ ephemeral: true });
                return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true });
            }

            // --------------------------------------------------------------------------------
            // GÖREV OLUŞTURMA/GÜNCELLEME İLK MODAL CEVABI (myModal)
            // --------------------------------------------------------------------------------
            if(modal.customId == "myModal") {
                let bilgi = {
                    rol: modal.fields.getTextInputValue("rolId"),
                    ödül: modal.fields.getTextInputValue("ödül"),
                    periyod: modal.fields.getTextInputValue("t_selectInformationType") || "unlimited",
                    // otoYukseltimTuru V14'e taşınmadı, sadece okuması için bırakıldı.
                }
        
                if(bilgi && bilgi.rol && bilgi.periyod && bilgi.ödül) {
                    let rol = guild.roles.cache.get(bilgi.rol) || guild.roles.cache.find(x => bilgi.rol.includes(x.name));
                    
                    if(!rol) {
                        await modal.deferReply({ ephemeral: true });
                        return await modal.followUp({content: `Belirtilen ID veya isimde bir rol bulunamadı.` , ephemeral: true });
                    }
                    
                    // V14 Component Builders
                    let Row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel("Gereksinim Ekle/Güncelle")
                            .setCustomId("gereksinimEkleme"),
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji(guild.emojiGöster(emojiler.Iptal) ? guild.emojiGöster(emojiler.Iptal).id : '❌')
                            .setCustomId("iptalEt")
                            .setLabel("Görev Kurulumunu Sonlandır")
                    );

                    await modal.reply({components: [Row], embeds: [new genEmbed().setDescription(`**Merhaba!** ${uye.user.tag}\nŞimdi sırada ${rol} görevine gereksinim eklemede. Ekledikten sonra senin için görevleri dağıtacağım. Cevap vermen için "**30 Saniye**" süren var.`)], ephemeral: true });
                    
                    var filter = (i) => i.user.id == uye.id;
                    let collector = modal.channel.createMessageComponentCollector({ filter: filter, max: 1, time: 30000 });
                    
                    collector.on('collect', async (i) => {
                        await i.deferUpdate().catch(err => {}); // Etkileşimi ertele

                        if(i.customId == "gereksinimEkleme") {
                            // V14 Modal Builder
                            let setTasks = new ModalBuilder()
                                .setCustomId('acarKe')
                                .setTitle('Görev Gereksinimi Ekle')
                                .addComponents(
                                    new ActionRowBuilder().addComponents(
                                        new TextInputBuilder()
                                            .setCustomId('genelSes')
                                            .setLabel("Kaç Saat Seste Durmalı?")
                                            .setStyle(TextInputStyle.Short)
                                            .setPlaceholder('Örn: 15')
                                            .setRequired(true)
                                    ),
                                    new ActionRowBuilder().addComponents(
                                        new TextInputBuilder()
                                            .setCustomId('publicSes')
                                            .setLabel("Public/Streamer/Register'da Kaç Saat Durmalı?")
                                            .setStyle(TextInputStyle.Short)
                                            .setPlaceholder('Örn: 10')
                                            .setRequired(true)
                                    ),
                                    new ActionRowBuilder().addComponents(
                                        new TextInputBuilder()
                                            .setCustomId('Yetkili')
                                            .setLabel("Kaç Yetkili Belirlemeli?")
                                            .setStyle(TextInputStyle.Short)
                                            .setPlaceholder('Örn: 5 (Boş bırakılırsa 0)')
                                            .setRequired(false)
                                    ),
                                    new ActionRowBuilder().addComponents(
                                        new TextInputBuilder()
                                            .setCustomId('Taglı')
                                            .setLabel("Kaç Taglı Belirlemeli?")
                                            .setStyle(TextInputStyle.Short)
                                            .setPlaceholder('Örn: 5 (Boş bırakılırsa 0)')
                                            .setRequired(false)
                                    ),
                                    new ActionRowBuilder().addComponents(
                                        new TextInputBuilder()
                                            .setCustomId('Davet')
                                            .setLabel("Kaç Davet Yapmalı?")
                                            .setStyle(TextInputStyle.Short)
                                            .setPlaceholder('Örn: 5 (Boş bırakılırsa 0)')
                                            .setRequired(false)
                                    )
                                );
                            
                            // Global değişkenleri bir sonraki moda için sakla
                            rolId = bilgi.rol;
                            periyod = bilgi.periyod;
                            ödül = bilgi.ödül;
                            
                            await i.showModal(setTasks);
                            await modal.editReply({
                                components: [], 
                                embeds: [new genEmbed().setDescription(`Görev gerekesinim menüsü açıldı işleme burdan devam edilecek. ${guild.emojiGöster(emojiler.Onay) ? guild.emojiGöster(emojiler.Onay) : '✅'}`)], 
                                ephemeral: true
                            });
                        }
            
                        if(i.customId == "iptalEt") {
                            await modal.editReply({
                                components: [], 
                                embeds: [new genEmbed().setDescription(`Görev oluşturma/güncelleme işlemi başarıyla sonlandırıldı. ${guild.emojiGöster(emojiler.Onay) ? guild.emojiGöster(emojiler.Onay) : '✅'}`)], 
                                ephemeral: true
                            });
                            collector.stop(); // Collector'ü durdur
                        }
                    });
                    
                    collector.on('end', async (collected, reason) => {
                        if(reason == "time") {
                            await modal.editReply({components: [], embeds: [new genEmbed().setDescription(`İşleminiz zaman aşımı nedeniyle sonlandırıldı. Daha sonra tekrar deneyin!`)], ephemeral: true}).catch(err => {});
                        }
                    });
                }
            }

            // --------------------------------------------------------------------------------
            // GEREKSİNİM MODAL CEVABI (acarKe)
            // --------------------------------------------------------------------------------
            if(modal.customId == "acarKe") {
                let bilgi = {
                    genelses: Number(modal.fields.getTextInputValue("genelSes")) || 0,
                    publicses: Number(modal.fields.getTextInputValue("publicSes")) || 0,
                    taglı: Number(modal.fields.getTextInputValue("Taglı")) || 0,
                    yetkili: Number(modal.fields.getTextInputValue('Yetkili')) || 0,
                    davet: Number(modal.fields.getTextInputValue('Davet')) || 0,
                    rol: rolId,
                    ödül: ödül,
                    süre: periyod
                }
                
                let rol = guild.roles.cache.get(bilgi.rol);
                if(!rol) {
                    await modal.deferReply({ ephemeral: true });
                    return await modal.followUp({content: `Rol bulunamadığından işlem iptal edildi.` , ephemeral: true });
                }

                let verilenGörev = 0;
                if(bilgi.genelses > 0) verilenGörev++;
                if(bilgi.publicses > 0) verilenGörev++;
                if(bilgi.taglı > 0) verilenGörev++;
                if(bilgi.yetkili > 0) verilenGörev++;
                if(bilgi.davet > 0) verilenGörev++;
                
                // V14 Component Builders
                let Row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Secondary)
                        .setLabel("Görevi Ekle/Güncelle")
                        .setCustomId("görevEkle"),
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji(guild.emojiGöster(emojiler.Iptal) ? guild.emojiGöster(emojiler.Iptal).id : '❌')
                        .setCustomId("iptalEt")
                        .setLabel("Görevi İptal Et")
                );
                
                let sureBilgi = bilgi.süre == "unlimited" ? "**` ~ `**" : `<t:${String(Date.now() + ms(String(bilgi.süre))).slice(0, 10)}:R>`;

                await modal.reply({
                    components: [Row], 
                    embeds: [new genEmbed().setDescription(`**Rol Adı**: ${rol.name} (${rol})\n**Roldeki Üye Sayısı**: \` ${rol.members.size} \`\n**Görev Süresi**: ${sureBilgi}\n**Görev Ödülü**: \` ${bilgi.ödül} Görev Puanı, ${ayarlar.serverName} Parası \`\n**Toplam Verilen Görev**: \` ${verilenGörev} \`\n**Genel Toplam Ses**: \` ${bilgi.genelses} Saat \`\n**Public/Streamer/Register Ses**: \` ${bilgi.publicses} Saat \`\n${bilgi.yetkili > 0 ? `**Yetkili**: \` ${bilgi.yetkili} Kişi \`` : `- Yetkili Görevi Verilmemiş!`}\n${bilgi.taglı > 0 ? `**Taglı**: \` ${bilgi.taglı} Kişi \`` : `- Taglı Görevi Verilmemiş!`}\n${bilgi.davet > 0 ? `**Davet**: \` ${bilgi.davet} Kişi \`` : `- Davet Görevi Verilmemiş!`}\n\nŞimdi sırada ${rol} görevine eklediğin gereksinimleri onaylaman gerek. Onaylaman için "**30 Saniye**" süren var.`)], 
                    ephemeral: true
                });
                
                var filter = (i) => i.user.id == uye.id;
                let collector = modal.channel.createMessageComponentCollector({ filter: filter, max: 1, time: 30000 });
                
                collector.on('collect', async (i) => {
                    await i.deferUpdate().catch(err => {}); // Etkileşimi ertele

                    if(i.customId == "görevEkle") {
                        await modal.editReply({components: [], embeds: [new genEmbed().setDescription(`Başarıyla ${rol} görevi verildi/güncelledi ve dağıtım ${rol.members.size} kişi üzerine gerçekleşti. ${guild.emojiGöster(emojiler.Onay) ? guild.emojiGöster(emojiler.Onay) : '✅'}`)], ephemeral: true});
                        
                        let görevData = await Tasks.findOne({Active: true, roleID: rol.id});
                        if(görevData) {
                            await Tasks.deleteOne({Active: true, roleID: rol.id});
                        }
                        
                        let görevPush;
                        let baseTaskData = { 
                            Active: true, 
                            AllVoice: bilgi.genelses, 
                            publicVoice: bilgi.publicses, 
                            Tagged: bilgi.taglı, 
                            Staff: bilgi.yetkili, 
                            Register: 0, 
                            Invite: bilgi.davet, 
                            Reward: bilgi.ödül, 
                            countTasks: Number(verilenGörev) 
                        };
                        
                        if(bilgi.süre == "unlimited") {
                            görevPush = baseTaskData;
                        } else {
                            görevPush = { ...baseTaskData, Time: Date.now() + ms(String(bilgi.süre)) };
                        }

                        let membersWithTaskIDs = [];
                        let usersToInform = rol.members; // Roldeki tüm üyeler

                        usersToInform.forEach(async (member) => {
                            membersWithTaskIDs.push(member.id);
                            
                            // İstatistikleri Sıfırla
                            await Stats.updateOne({guildID: sistem.SERVER.ID, userID: member.id}, {$set: {"taskVoiceStats": new Map()}}, {upsert: true});
                            await Users.updateOne({_id: member.id}, {$set: { "Staff": true }}, { upsert:true });

                            // Upstaffs Görev Durumunu Sıfırla
                            await Upstaffs.updateOne({_id: member.id}, { $set: {"Mission": {
                                Tagged: 0,
                                Register: 0,
                                Invite: 0,
                                Staff: 0,
                                completedMission: 0,
                                CompletedStaff: false,
                                CompletedInvite: false,
                                CompletedAllVoice: false,
                                CompletedPublicVoice: false,
                                CompletedTagged: false,
                                CompletedRegister: false,
                            }, "Yönetim": true }});
                        });
                        
                        // Görevi Kaydet
                        await Tasks.updateOne({roleID: rol.id}, {$set: görevPush, $push: {Users: membersWithTaskIDs}}, {upsert: true});
                        
                        // Bilgilendirme ve Log
                        let görevBilgilendirme = guild.kanalBul("görev-bilgi");
                        if(görevBilgilendirme) {
                            görevBilgilendirme.send({
                                content: `${rol}`, 
                                embeds: [new genEmbed()
                                    .setFooter(`${sistem.botSettings.Prefixs[0]}görev komutu ile verilen görevlerinizi listeleyebilirsiniz.`)
                                    .setTitle(`${guild.emojiGöster(emojiler.sarıYıldız) || '⭐'} Bir Görev Daha Eklendi!`)
                                    .setDescription(`${guild.emojiGöster(emojiler.Görev.Kek) || '🍰'} ${rol} rolünde bulunan ${usersToInform.map(x => x).slice(0,2).join(", ")} ${usersToInform.size > 2 ? `ve ${usersToInform.size - 2} daha fazlası...` : ''} üyeye(üyelerine) **${verilenGörev} adet** görev taktim edildi.`)]
                            });
                        }
                        
                        // Üyelere DM Gönderme
                        usersToInform.forEach(user => {
                            user.send({
                                embeds: [new genEmbed()
                                    .setFooter(`${sistem.botSettings.Prefixs[0]}görev komutu ile verilen görevlerinizi listeleyebilirsiniz.`)
                                    .setDescription(`${guild.emojiGöster(emojiler.sarıYıldız) || '⭐'} ${user} sana bir görev verildi görev bilgilerini öğrenmek için lütfen **${sistem.botSettings.Prefixs[0]}yetkim** komutundan detaylı bakabilirsin.`)]
                            }).catch(err => {
                                // DM kapalı hatası.
                            });
                        });
                        collector.stop();

                    }
        
                    if(i.customId == "iptalEt") {
                        await modal.editReply({components: [], embeds: [new genEmbed().setDescription(`Görev oluşturma/güncelleme işlemi başarıyla iptal edildi. ${guild.emojiGöster(emojiler.Onay) ? guild.emojiGöster(emojiler.Onay) : '✅'}`)], ephemeral: true});
                        collector.stop();
                    }
                });
                
                collector.on('end', async (collected, reason) => {
                    if(reason == "time") {
                        await modal.editReply({components: [], embeds: [new genEmbed().setDescription(`İşleminiz zaman aşımı nedeniyle sonlandırıldı. Daha sonra tekrar deneyin!`)], ephemeral: true}).catch(err => {});
                    }
                });
            }

            // --------------------------------------------------------------------------------
            // GÖREV TEMİZLEME MODAL CEVABI (deleteTasks)
            // --------------------------------------------------------------------------------
            if(modal.customId == "deleteTasks") {
                let getInput = modal.fields.getTextInputValue('tasksId');
                let belirle = guild.roles.cache.get(getInput) || guild.members.cache.get(getInput);
        
                if(!belirle) {
                    await modal.deferReply({ ephemeral: true });
                    return await modal.followUp({content: `Rol veya üyelerde bulunamadığından işlem iptal edildi.` , ephemeral: true });
                }
                
                let logKanal = guild.kanalBul("görev-log");

                if(belirle.roles) { // Rol ise
                    let role = belirle;
                    let members = role.members;
                    let görevData = await Tasks.findOne({roleID: role.id});
                    
                    if(!görevData) {
                        await modal.deferReply({ ephemeral: true });
                        return await modal.followUp({content: `Belirtilen role ait bir görev bulunamadı!` , ephemeral: true });
                    }
                    
                    await modal.reply({ephemeral: true, embeds: [new genEmbed().setDescription(`${members.map(x => x.user.tag).slice(0,2).join(", ")} ${members.size > 2 ? `ve ${members.size - 2} daha fazlası...` : ''} üyeler(üyelerin) \`${role.name}\` rolüne ait görev bilgileri temizleniyor...`)]});

                    if(logKanal) {
                         logKanal.send({embeds: [new genEmbed().setDescription(`${role} rolününe ait olan ${members.map(x => x).slice(0,2).join(", ")} ${members.size > 2 ? `ve ${members.size - 2} daha fazlası...` : ''} üyeler(üyelerin) <t:${String(Date.now()).slice(0, 10)}:R> ${uye} tarafından tüm görev bilgileri temizlendi.`)]});
                    }

                    setTimeout(async () => {
                        await Tasks.deleteOne({roleID: role.id});
                        await modal.editReply({embeds: [new genEmbed().setDescription(`Başarıyla ${role} rolüne ait tüm görev verileri temizlendi ve kaldırıldı. ${guild.emojiGöster(emojiler.Onay) ? guild.emojiGöster(emojiler.Onay) : '✅'}`)], ephemeral: true});
                    }, 2000);
                    
                    members.forEach(async (member) => {
                        await Tasks.updateOne({ $pull: { Users: member.id }});
                        await Upstaffs.updateOne({_id: member.id}, {$set: {"Mission": {
                            Tagged: 0, Register: 0, Invite: 0, Staff: 0, completedMission: 0,
                            CompletedStaff: false, CompletedInvite: false, CompletedAllVoice: false,
                            CompletedPublicVoice: false, CompletedTagged: false, CompletedRegister: false,
                        }}}, {upsert: true});
                        await Stats.updateOne({guildID: sistem.SERVER.ID, userID: member.id}, {$set: {"taskVoiceStats": new Map()}}, {upsert: true});
                    });

                } else if(belirle.user) { // Üye ise
                    let member = belirle;
                    // En yüksek yetki rolüne ait görevi bulur (mantık biraz karmaşık, direkt roleID'ye bakmak daha iyi olabilir ama orijinali koruyorum)
                    let görevData = await Tasks.findOne({ roleID: member.roles.hoist ? member.roles.hoist.id : 0 }) || await Tasks.findOne({ roleID: member.roles.highest ? member.roles.highest.id : 0 });

                    if(!görevData) {
                        await modal.deferReply({ ephemeral: true });
                        return await modal.followUp({content: `Belirtilen üyeye ait bir görev bulunamadı!` , ephemeral: true });
                    }
                    
                    await Tasks.updateOne({ roleID: görevData.roleID }, { $pull: { Users: member.id }});
                    await Upstaffs.updateOne({_id: member.id}, {$set: {"Mission": {
                        Tagged: 0, Register: 0, Invite: 0, Staff: 0, completedMission: 0,
                        CompletedStaff: false, CompletedInvite: false, CompletedAllVoice: false,
                        CompletedPublicVoice: false, CompletedTagged: false, CompletedRegister: false,
                    }} }, {upsert: true});
                    await Stats.updateOne({guildID: sistem.SERVER.ID, userID: member.id}, {$set: {"taskVoiceStats": new Map()}}, {upsert: true});
                    
                    await modal.reply({ephemeral: true, embeds: [new genEmbed().setDescription(`${guild.emojiGöster(emojiler.Onay) || '✅'} Şuan da ${member} üyesine ait görev verileri temizleniyor...`)]});

                    if(logKanal) {
                        await logKanal.send({embeds: [new genEmbed().setDescription(`${guild.emojiGöster(emojiler.Onay) || '✅'} ${member} üyesinin <t:${String(Date.now()).slice(0, 10)}:R> ${uye} tarafından tüm görevleri temizlendi.`)]});
                    }

                    setTimeout(async () => {
                        await modal.editReply({embeds: [new genEmbed().setDescription(`Başarıyla ${member} üyesine ait tüm görev verileri temizlendi. ${guild.emojiGöster(emojiler.Onay) ? guild.emojiGöster(emojiler.Onay) : '✅'}`)], ephemeral: true});
                    }, 2000);
                }
            }
        });
    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, message, args) {
        let embed = new genEmbed();
        
        // V14 Permissions
        const hasAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        if(!ayarlar.staff.includes(message.member.id) && !hasAdmin && !roller.kurucuRolleri.some(x => message.member.roles.cache.has(x))) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // V14 Component Builders
        let Row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Görev Oluştur/Güncelle")
                .setCustomId("setTask"),

            new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Görev Temizle/Kaldır")
                .setCustomId("deleteTask"),

            new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel("Görevleri Listele")
                .setCustomId("viewTasks")
        );
        
        message.reply({
            embeds: [new genEmbed().setDescription(`Aşağıda bulunan düğmeler ile görev sistemine ekleme, güncelleme ve silme işlemlerini gerçekleştirebilirsin.`)], 
            components: [Row]
        }).then(async (msg) => {
            let filter = (i) => i.user.id == message.author.id;
            let collector = msg.createMessageComponentCollector({ filter: filter, max:1, time: 30000 });
            
            collector.on('collect', async (i) => {
                // i.deferUpdate().catch(err => {}); // Modallar için deferUpdate'e gerek yok
                
                if(i.customId == "deleteTask") {
                    // V14 Modal Builder
                    let deleteTasks = new ModalBuilder()
                        .setCustomId('deleteTasks')
                        .setTitle('Görev Temizle/Kaldır')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('tasksId')
                                    .setLabel("Rol ID/Üye ID")
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder('Silinecek görev rolü veya temizlenecek üye bilgisi girin.')
                                    .setRequired(true)
                            )
                        );
                    
                    await i.showModal(deleteTasks);
                    message.react(message.guild.emojiGöster(emojiler.sağOk) ? message.guild.emojiGöster(emojiler.sağOk).id : '➡️').catch(err => {});
                }

                if(i.customId == "viewTasks") {
                    message.react(message.guild.emojiGöster(emojiler.Onay) ? guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
                    await i.deferUpdate().catch(err => {});
                    
                    await Tasks.find({}).exec(async (err, res) => {
                        if(err) return message.reply({ content: 'Hata: `Bazı hatalar oluştu :(`' });
                        
                        if(!res || res.length <= 0) {
                            return message.reply({ content: `${ayarlar.serverName} sunucusuna ait aktif görev bilgisi veritabanında bulunamadı.` }).then(msg => {
                                setTimeout(() => { msg.delete().catch(err => {}); }, 5000);
                            });
                        }
                        
                        let data = [["ID","Rol İsmi", "Tüm Ses Saati","Diğer Ses Saati", "Davet", "Taglı", "Yetkili","Ödül"]];
                        data = data.concat(res.map((value, index) => {          
                            return [
                                `#${index + 1}`,
                                `${message.guild.roles.cache.get(value.roleID) ? message.guild.roles.cache.get(value.roleID).name : "@Rol Yok!"}`,
                                `${value.AllVoice} Saat`,
                                `${value.publicVoice} Saat`,
                                `${value.Invite}`,
                                `${value.Tagged}`,
                                `${value.Staff}`,
                                `${value.Reward}`,
                            ]
                        }));
                        
                        let veriler = table.table(data, {
                            border: {
                                topBody: `─`, topJoin: `┬`, topLeft: `┌`, topRight: `┐`,
                                bottomBody: `─`, bottomJoin: `┴`, bottomLeft: `└`, bottomRight: `┘`,
                                bodyLeft: `│`, bodyRight: `│`, bodyJoin: `│`,
                                joinBody: `─`, joinLeft: `├`, joinRight: `┤`, joinJoin: `┼`
                            },
                            drawHorizontalLine: function (index, size) {
                                return index === 0 || index === 1 || index === size;
                            }
                        });
                        
                        message.channel.send({content: `Aşağıda **${ayarlar.serverName}** sunucusuna ait aktif görevler listelenmektedir.`});
                        
                        // V14 Util.splitMessage kullanımı aynıdır.
                        const arr = Util.splitMessage(veriler, { maxLength: 1950, char: "\n" }); 
                        for (const newText of arr) {
                            message.channel.send(`\`\`\`${newText}\`\`\``);
                        }
                    });
                }
                
                if(i.customId == "setTask") {
                    // V14 Modal Builder
                    let setTasks = new ModalBuilder()
                        .setCustomId('myModal')
                        .setTitle('Görev Oluştur/Güncelle')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('rolId')
                                    .setLabel("Rol ID/İsmi")
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder('Görev verilecek rolü belirtin.')
                                    .setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('ödül')
                                    .setLabel("Görev Ödülü")
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder(`${ayarlar.serverName} Parası ödülü belirleyin.`)
                                    .setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('otoYukseltimTuru')
                                    .setLabel("Yükseltim Türü")
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder(`AUTO/PERM/YAPAN/YAPMAYAN/TELAFI/MEETING`)
                                    .setRequired(true)
                            ),
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()  
                                    .setCustomId('t_selectInformationType')
                                    .setLabel("Görev Süresi")
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder("Görev süresini seçmelisin. Sınırsız için boş bırakın. Örn: 1d")
                                    .setRequired(false)
                            )
                        );
                    
                    await i.showModal(setTasks);
                    message.react(message.guild.emojiGöster(emojiler.sağOk) ? message.guild.emojiGöster(emojiler.sağOk).id : '➡️').catch(err => {});
                }
            });

            collector.on('end', (i, reason) => {
                msg.delete().catch(err => {});
                if(reason == "time") {
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {});
                }
            });
        });
    }
};