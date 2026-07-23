const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Stats = require('../../../../Global/Databases/Client.Users.Stats');
const Invites = require('../../../../Global/Databases/Global.Guild.Invites');
const Users = require('../../../../Global/Databases/Client.Users');
const Upstaff = require('../../../../Global/Databases/Client.Users.Staffs');
const moment = require('moment');
const { genEmbed } = require('../../../../Global/İnit/Embed');

// Global değişkenlerin ve client metodlarının varlığı varsayılmıştır.
// const { ayarlar, roller, cevaplar, emojiler, _statSystem, sistem } = global; 

module.exports = {
    Isim: "düşür",
    Komut: ["düşür", "dusur"],
    Kullanim: "düşür <@andale/ID>",
    Aciklama: "Belirlenen yetkiliyi bir alt yetkiye düşürür ve istatistiklerini sıfırlar.",
    Kategori: "stat",
    Extend: true,
    
    /**
    * @param {Client} client 
    */
    onLoad: function (client) {

    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, message, args) {
        let embed = new genEmbed();
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay) || '✅';
        const iptalEmoji = message.guild.emojis.cache.get(emojiler.Iptal) || '❌';

        // İzin Kontrolü (Kurucu Rolleri, Admin veya Yükseltici Rolleri)
        const hasPermission = roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              (roller.yükselticiRoller && roller.yükselticiRoller.some(x => message.member.roles.cache.has(x)));
                              
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
        
        // Kayıtsız/Tagsız Kontrolleri
        if (roller.kayıtsızRolleri.some(x => uye.roles.cache.has(x))) {
            return message.react(iptalEmoji).catch(err => {});
        }
        if (ayarlar.type && !uye.user.username.includes(ayarlar.tag)) {
            return message.react(iptalEmoji).catch(err => {});
        }
        if ((ayarlar && ayarlar.yetkiliYasaklıTag) && ayarlar.yetkiliYasaklıTag.filter(x => x != ayarlar.tag).some(x => uye.user.username.includes(x))) {
             return message.reply({
                content: `Belirtilen üyenin üzerinde bir tag bulunmakta! Bu nedenden dolayı yetki işlemine devam edilemiyor. ${cevaplar.prefix}`
            }).then(x => {
                setTimeout(() => {
                    x.delete().catch(err => {})
                }, 7500);
            });
        }
        
        let Upstaffs = await Upstaff.findOne({ _id: uye.id });

        // Üye veritabanında yoksa veya yetkili değilse işlem iptali (yetki düşürme komutu olduğu için)
        if (!Upstaffs) {
            return message.react(iptalEmoji).catch(err => {});
        }

        // --------------------------------------------------------------------------------
        // Yetki Düşürme İşlemleri
        // --------------------------------------------------------------------------------
        
        // Mevcut yetki bilgisini bulma
        let yetkiBilgisi = _statSystem.staffs.find(x => uye.roles.cache.has(x.rol));
        
        if (!yetkiBilgisi) {
            return message.reply({ content: `${iptalEmoji} ${uye} isimli üye terfi sisteminde tanımlı bir yetkiye sahip değil.`, ephemeral: true });
        }
        
        // Bir alt yetkiyi bulma
        let rolBulIndex = _statSystem.staffs.indexOf(yetkiBilgisi) - 1;
        let rolBul = _statSystem.staffs[rolBulIndex];

        // En alt yetki kontrolü
        if (!rolBul) {
            return message.reply({ content: `${iptalEmoji} ${uye} isimli üye en alt yetkide, daha fazla düşüremezsin.`, ephemeral: true });
        }
        
        // 1. Yönetici Düşürme Loglama
        if (!Upstaffs || !Upstaffs.StaffGiveAdmin) {
            await Users.updateOne({ _id: uye.id }, { $set: { "StaffGiveAdmin": message.member.id } }, { upsert: true });
        }
        
        // 2. Yönetim Rolü Durumu Güncelleme
        const isYonetim = roller.altYönetimRolleri.some(x => rolBul.exrol.includes(x)) || 
                          roller.yönetimRolleri.some(x => rolBul.exrol.includes(x)) || 
                          roller.üstYönetimRolleri.some(x => rolBul.exrol.includes(x));
                          
        await Upstaff.updateOne({ _id: uye.id }, { $set: { "Yönetim": isYonetim } }, { upsert: true });

        // 3. Yeni Rolleri Ayarlama
        let newRoles = [];
        // Mevcut yetki rollerini (ana rol ve ek roller) ve bir üst yetkiye ait rolleri (exrol) çıkar
        uye.roles.cache.filter(x => yetkiBilgisi.rol !== x.id && !yetkiBilgisi.exrol.includes(x.id)).forEach(x => newRoles.push(x.id));
        
        // Yeni rolü ekle
        if (rolBul && rolBul.rol) {
            newRoles.push(rolBul.rol);
            if (rolBul.exrol && rolBul.exrol.length >= 1) newRoles.push(...rolBul.exrol);
        }
        
        // Rolleri set etme
        await uye.roles.set(newRoles).catch(err => {
            console.error(`Rol set etme hatası (${uye.user.tag}):`, err);
        });
        
        // 4. Veritabanı Güncellemeleri
        await Upstaff.updateOne({ _id: uye.id }, { $set: { "Rolde": Date.now() } }, { upsert: true });
        
        // Log Kaydı Ekleme
        await Users.updateOne({ _id: uye.id }, { 
            $push: { 
                "StaffLogs": {
                    Date: Date.now(),
                    Process: "DÜŞÜRÜLME",
                    Role: rolBul ? rolBul.rol : roller.başlangıçYetki,
                    Author: message.member.id
                }
            }
        }, { upsert: true });
        
        // Görev İstatistiklerini Sıfırlama
        await Upstaff.updateOne({ _id: uye.id }, { $set: { 
            "Mission": {
                Tagged: 0, Register: 0, Invite: 0, Staff: 0, Sorumluluk: 0, CompletedSorumluluk: false,
                completedMission: 0, CompletedStaff: false, CompletedInvite: false, CompletedAllVoice: false, 
                CompletedPublicVoice: false, CompletedTagged: false, CompletedRegister: false,
            }
        }}, { upsert: true });
        
        // Genel İstatistikleri Sıfırlama (Stats ve Upstaff)
        await Stats.updateOne({ guildID: sistem.SERVER.ID, userID: uye.id }, { $set: { "taskVoiceStats": new Map() } }, { upsert: true });

        await Upstaff.updateOne({ _id: uye.id }, { $set: { 
            "Point": 0, 
            "staffNo": Number(rolBul.No) + Number(1), 
            "staffExNo": rolBul.No, 
            "Yetkili": 0, "Görev": 0, "Invite": 0, "Tag": 0, "Register": 0, 
            "Ses": new Map(), "Mesaj": 0, "Bonus": 0, "Toplantı": 0, "Etkinlik": 0 
        }}, { upsert: true });

        // 5. Log Kanalına Bilgilendirme
        let logKanalı = message.guild.channels.cache.find(x => x.name === "terfi-log") || message.guild.kanalBul("terfi-log");
        
        if (logKanalı) {
            logKanalı.send({
                embeds: [embed.setDescription(`${message.member} yöneticisi, ${uye} isimli üyeyi **${message.guild.roles.cache.get(rolBul.rol).name}** isimli rolüne düşürdü.`).setFooter({ text: `bu işlem veritabanında kayıtlı kalır.` })]
            }).catch(err => {});
        }
        
        // 6. Başarılı İşlem Mesajı
        message.reply({ 
            content: `${onayEmoji} Başarıyla **${uye.user.tag}** isimli yetkili, **\`${message.guild.roles.cache.get(rolBul.rol).name}\`** rolüne düşürüldü.`, 
            ephemeral: true 
        }).then(x => {
            setTimeout(() => {
                x.delete().catch(err => {});
            }, 7500);
            message.react(onayEmoji).catch(err => {});
        });
    }
};