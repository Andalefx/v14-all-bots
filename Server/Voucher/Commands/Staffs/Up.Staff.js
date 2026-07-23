const { 
    Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    PermissionFlagsBits, ButtonStyle 
} = require("discord.js");
const Stats = require('../../../../Global/Databases/Client.Users.Stats')
const Invites = require('../../../../Global/Databases/Global.Guild.Invites');
const Users = require('../../../../Global/Databases/Client.Users');
const Upstaff = require('../../../../Global/Databases/Client.Users.Staffs');

const moment = require('moment');
const { genEmbed } = require('../../../../Global/İnit/Embed');

module.exports = {
    Isim: "yükselt",
    Komut: ["yukselt"],
    Kullanim: "yükselt <@üye/ID>",
    Aciklama: "Belirlenen yetkilinin sunucu içerisindeki bilgilerini gösterir ve yükseltir/düşürür.",
    Kategori: "stat",
    Extend: true,
    
    /**
    * @param {Client} client 
    */
    onLoad: function (client) {
        // Ön yükleme fonksiyonu (onLoad) boş bırakıldı.
    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, message, args) {
        // EmbedBuilder yerine genEmbed() kullanıldığı için direkt olarak EmbedBuilder'a geçiş yapmadım,
        // ancak varsayılan olarak EmbedBuilder kullanıldığı varsayılacaktır.
        let embed = new genEmbed();

        // V14 Yetki Kontrolü: ADMINISTRATOR izni için PermissionFlagsBits kullanılır.
        const hasAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        if(!roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !hasAdmin && !roller.limitliYükselticiRolleri.some(x => message.member.roles.cache.has(x)) && !roller.yükselticiRoller.some(x => message.member.roles.cache.has(x))) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        let kullanıcı = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
        if (!kullanıcı) return message.reply({ content: cevaplar.üye }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let uye = message.guild.members.cache.get(kullanıcı.id);
        
        if (!uye) return message.reply({ content: cevaplar.üye }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(uye.id == message.member.id) return message.reply({ content: cevaplar.kendi }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(roller.kayıtsızRolleri.some(x => uye.roles.cache.has(x))) return message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {});
        if(ayarlar.type && !uye.user.username.includes(ayarlar.tag)) return message.reply({ content: cevaplar.taglıalım }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Yetkili yasaklı tag kontrolü
        if((ayarlar && ayarlar.yetkiliYasaklıTag) && ayarlar.yetkiliYasaklıTag.filter(x => x != ayarlar.tag).some(x => uye.user.username.includes(x))) {
            return message.reply({
                content: `Belirtilen üyenin üzerinde bir yasaklı tag bulunmakta! Bu nedenden dolayı yetki işlemine devam edilemiyor. ${cevaplar.prefix}`
            }).then(x => {
                setTimeout(() => {
                    x.delete().catch(err => {})
                }, 7500);
            });
        }
        
        let Upstaffs = await Upstaff.findOne({_id: uye.id});

        if(!Upstaffs ) {
            // Eğer veri yoksa tepki ver
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {});
        } else {
            // Yetkili rol sistemine ait global değişkenlerin (örneğin _statSystem) tanımlı olduğu varsayılıyor.
            let yetkiBilgisi = _statSystem.staffs.find(x => uye.roles.cache.has(x.rol));
            if(!yetkiBilgisi) return message.reply({content: `${message.guild.emojiGöster(emojiler.Iptal) || '❌'} ${uye} isimli üyenin yetkili rolü bulunamadı!`, ephemeral: true});

            let rolBul = _statSystem.staffs[_statSystem.staffs.indexOf(yetkiBilgisi) + 1];

            if(!rolBul) return message.reply({content: `${message.guild.emojiGöster(emojiler.Iptal) || '❌'} ${uye} isimli üye son yetkiye ulaştığı için yükseltme işlemi yapılamaz.`, ephemeral: true});
            
            // Yükseltim sınırı kontrolü
            if(rolBul.No > ayarlar.yükseltimSınırı && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !hasAdmin && !roller.yükselticiRoller.some(x => message.member.roles.cache.has(x)) && roller.limitliYükselticiRolleri.some(x => message.member.roles.cache.has(x))) {
                return message.reply({content: `${message.guild.emojiGöster(emojiler.Iptal) || '❌'} ${uye}, isimli üyeyi en fazla şuan ki yetkiye kadar yükseltebilirsin.`, ephemeral: true}).then(x => setTimeout(() => {
                    x.delete().catch(err => {})
                }, 7500));
            }
            
            // İlk yetki veren admini kaydetme
            if(Upstaffs && !Upstaffs.StaffGiveAdmin) await Users.updateOne({_id: uye.id}, {$set: {"StaffGiveAdmin": message.member.id}}, {upsert: true});
            
            // Yönetim durumu güncelleme
            let isYonetim = roller.altYönetimRolleri.some(x => rolBul.exrol.includes(x)) || roller.yönetimRolleri.some(x => rolBul.exrol.includes(x)) || roller.üstYönetimRolleri.some(x => rolBul.exrol.includes(x));
            await Upstaff.updateOne({_id: uye.id}, { $set: {"Yönetim": isYonetim }}, {upsert: true});
            
            // Roldelik süresi sıfırlama
            await Upstaff.updateOne({_id: uye.id}, { $set: {"Rolde": Date.now() }}, {upsert: true});
            
            // Yeni rol listesi oluşturma
            let newRoles = [];
            
            // Eski ana yetki rolü ve ekstra roller dışındaki rolleri koru
            uye.roles.cache.filter(x => yetkiBilgisi.rol != x.id && !yetkiBilgisi.exrol.includes(x.id)).forEach(x => newRoles.push(x.id));
            
            // Yeni yetki rolünü ve ekstra rollerini ekle
            if(rolBul && rolBul.rol) {
                newRoles.push(rolBul.rol);
                if(rolBul.exrol && rolBul.exrol.length >= 1) newRoles.push(...rolBul.exrol);
            }
            
            // Rolleri ayarla
            await uye.roles.set(newRoles);
            
            // Yetkili logu ekleme
            await Users.updateOne({ _id: uye.id }, { $push: { "StaffLogs": {
                Date: Date.now(),
                Process: "YÜKSELTİLME",
                Role: rolBul ? rolBul.rol : roller.başlangıçYetki,
                Author: message.member.id
            }}}, { upsert: true }); 
            
            // Görev istatistiklerini sıfırlama
            await Upstaff.updateOne({_id: uye.id}, {$set: {"Mission": {
                Tagged: 0, Register: 0, Invite: 0, Staff: 0, Sorumluluk: 0, CompletedSorumluluk: false,
                completedMission: 0, CompletedStaff: false, CompletedInvite: false,
                CompletedAllVoice: false, CompletedPublicVoice: false,
                CompletedTagged: false, CompletedRegister: false,
            }}}, {upsert: true});
            
            // Terfi log kanalına mesaj gönderme
            let logKanalı = message.guild.kanalBul("terfi-log");
            if(logKanalı) logKanalı.send({embeds: [embed.setDescription(`${message.member} yöneticisi, ${uye} isimli üyeyi ${message.guild.roles.cache.get(rolBul.rol)} isimli rolüne yükseltti.`).setFooter({ text: `bu işlem veritabanında kayıtlı kalır.` })]});
            
            // Ek istatistikleri sıfırlama
            await Stats.updateOne({guildID: sistem.SERVER.ID, userID: uye.id}, {$set: {"taskVoiceStats": new Map()}}, {upsert: true});      
            await Upstaff.updateOne({ _id: uye.id }, { $set: { 
                "Point": 0, 
                "staffNo": Number(rolBul.No) + Number(1), 
                "staffExNo": rolBul.No, 
                "Yetkili": 0, 
                "Görev": 0, 
                "Invite": 0,  
                "Tag": 0, 
                "Register": 0, 
                "Ses": new Map(), 
                "Mesaj": 0, 
                "Bonus": 0, 
                "Toplantı": 0, 
                "Etkinlik": 0 
            }}, {upsert: true});
            
            // Başarılı yanıt
            message.reply({content: `${message.guild.emojiGöster(emojiler.Onay) || '✅'} Başarıyla ${uye} isimli yetkili, \`${message.guild.roles.cache.get(rolBul.rol).name}\` rolüne yükseltildi.`, ephemeral: true }).then(x => {
                setTimeout(() => {
                    x.delete().catch(err => {})
                }, 7500);
                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
            });
        }
    }
};