const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits 
} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Jail = require('../../../../Global/Databases/Punitives.Jails');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "şüpheliçıkart",
    Komut: ["unsuspend", "unsuspect"],
    Kullanim: "şüpheliçıkart <@andale/ID> <Sebep>", // Kullanim güncellendi
    Aciklama: "Belirtilen üye yeni bir hesapsa onu şüpheliden çıkartır.",
    Kategori: "yetkili",
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
        // V14 Yetki Kontrolü
        if(!roller.jailHammer.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(uye.user.bot) return message.reply(cevaplar.bot).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(!uye.manageable) return message.reply(cevaplar.dokunulmaz).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.member.roles.highest.position <= uye.roles.highest.position) return message.reply(cevaplar.yetkiust).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Üye'nin aktif bir "cezalı" (jail) kaydı olup olmadığını kontrol et.
        let cezakontrol = await Jail.findById(uye.id)
        if(cezakontrol) {
            message.channel.send(`${cevaplar.prefix} Belirtilen üye sistemsel tarafından cezalandırılmış, şüpheli çıkart komutu ile çıkartman mümkün gözükmüyor.`).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {});
                setTimeout(() => {
                    x.delete().catch(err => {});
                }, 7500);
            });
            return;
        };

        // Üyenin eski bilgilerini çekme
        let User = await Users.findOne({_id: uye.id});
        
        // Üye şüpheli rolünden çıkartılıp, eski bilgilerine göre rol ve isim verilir.
        if(uye && uye.manageable) {
            
            if(!ayarlar.taglıalım && User && User.Name && User.Names && User.Gender) {
                // Kayıtlı Kullanıcı
                let nickname = `${ayarlar.type ? uye.user.username.includes(ayarlar.tag) ? ayarlar.tag + " " : (ayarlar.tagsiz ? ayarlar.tagsiz + " " : (ayarlar.tag || "")) : ""}${User.Name}`;
                if(ayarlar.isimyas) nickname = `${nickname} | ${User.Age}`;

                await uye.setNickname(nickname).catch(err => {});
                
                let roller_to_set = [];
                if(User.Gender == "Erkek") roller_to_set = roller.erkekRolleri;
                if(User.Gender == "Kadın") roller_to_set = roller.kadınRolleri;
                if(User.Gender == "Kayıtsız") roller_to_set = roller.kayıtsızRolleri; // Şüpheliden çıktı, kayıtlı/kayıtsız rolü verilmeli.
                
                await uye.setRoles(roller_to_set).catch(err => {});
                if(uye.user.username.includes(ayarlar.tag)) await uye.roles.add(roller.tagRolü).catch(err => {});

            } else {
                // Kayıtsız Kullanıcı
                await uye.setRoles(roller.kayıtsızRolleri).catch(err => {});

                let nickname = 'Kayıtsız'; 
                if(ayarlar.isimyas) {
                    if(ayarlar.type) {
                        nickname = `${uye.user.username.includes(ayarlar.tag) ? ayarlar.tag : (ayarlar.tagsiz ? ayarlar.tagsiz : (ayarlar.tag || ""))} İsim | Yaş`;
                    } else {
                        nickname = `İsim | Yaş`;
                    }
                } else if (ayarlar.type) {
                     nickname = `${uye.user.username.includes(ayarlar.tag) ? ayarlar.tag : (ayarlar.tagsiz ? ayarlar.tagsiz : (ayarlar.tag || ""))} Kayıtsız`;
                }

                await uye.setNickname(nickname).catch(err => {});
            }
        }
        
        // Loglama
        let findChannel = message.guild.kanalBul("şüpheli-log")
        if(findChannel) findChannel.send({embeds: [new genEmbed().setDescription(`${uye} uyesinin şüpheli durumu <t:${String(Date.now()).slice(0, 10)}:R> ${message.member} tarafından kaldırıldı.`)]}).catch(err => {});
        
        // Yanıt
        await message.reply({embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay) || '✅'} Başarıyla ${uye} isimli üye şüpheli hesap konumundan çıkartıldı!`)]})
        .then(x => {
            setTimeout(() => {
                x.delete().catch(err => {});
            }, 7500);
        });

        // Üyeye DM Atma
        if(uye) uye.send({embeds: [new genEmbed().setAuthor({name: uye.user.tag, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`${uye.user.tag}, ${message.author} tarafından <t:${String(Date.now()).slice(0, 10)}:R> şüpheliden çıkartıldın.`)]}).catch(x => {});

        // Reaksiyon
        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
    }
};