const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits 
} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Jail = require('../../../../Global/Databases/Punitives.Jails');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "unjail",
    Komut: ["cezalıçıkart", "cezalıçıkart", "hapisçıkart", "cezalikaldır"],
    Kullanim: "unjail <#No/@andale/ID>", // Kullanim güncellendi
    Aciklama: "Belirlenen üyeyi cezalıdan çıkartır.",
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
        
        let hedefArg = args[0];
        
        // Ceza Numarası Kontrolü (varsa ID'yi ceza kaydından çek)
        if(Number(hedefArg)) {
            let cezanobul = await Jail.findOne({No: hedefArg});
            if(cezanobul) hedefArg = cezanobul._id;
        }

        // Üye/Kullanıcı Çekme (Jailed kişi sunucuda olmalı)
        let uye = message.mentions.members.first() || message.guild.members.cache.get(hedefArg);
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(uye.user.bot) return message.reply(cevaplar.bot).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(!uye.manageable) return message.reply(cevaplar.dokunulmaz).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.member.roles.highest.position <= uye.roles.highest.position) return message.reply(cevaplar.yetkiust).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let cezakontrol = await Jail.findById(uye.id)
        if(!cezakontrol) {
            message.channel.send(cevaplar.cezayok);
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {});
            return;
        };
        
        // Ceza atan yetkili kontrolü
        let cezabilgisi = await Punitives.findOne({ Member: uye.id, Active: true, Type: "Cezalandırılma" })
        if(cezabilgisi && cezabilgisi.Staff !== message.author.id && message.guild.members.cache.get(cezabilgisi.Staff) && !message.member.permissions.has(PermissionFlagsBits.Administrator) && (roller.sorunÇözmeciler && !roller.sorunÇözmeciler.some(x => message.member.roles.cache.has(x))) && !roller.kurucuRolleri.some(x => message.member.roles.cache.has(x))) {
            let cezalandıran = message.guild.members.cache.get(cezabilgisi.Staff) || cezabilgisi.Staff;
            return message.channel.send({embeds: [new genEmbed().setDescription(`${cevaplar.prefix} Bu ceza ${cezalandıran} (\`${cezabilgisi.Staff}\`) Tarafından cezalandırılmış. **Bu Cezayı Açman Mümkün Değil!**`).setFooter({text: "yaptırım yapılan cezada yaptırımı yapan yetkili işlem uygulayabilir."})]})
            .then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {});
                setTimeout(() => {
                    x.delete().catch(err => {});
                }, 7500);
            });
        }
        
        // Veritabanı ve Roller Güncelleme
        await Jail.deleteOne({ _id: uye.id });
        await Punitives.updateOne({ No: cezakontrol.No }, { $set: { "Active": false, Expried: Date.now(), Remover: message.member.id} }, { upsert: true });

        let User = await Users.findOne({_id: uye.id});
        
        // Rol ve İsim Resetleme Mantığı
        if(uye && uye.manageable) {
            if(!ayarlar.taglıalım && User && User.Name && User.Names && User.Gender) {
                // Kayıtlı Kullanıcı
                let nickname = `${ayarlar.type ? uye.user.username.includes(ayarlar.tag) ? ayarlar.tag + " " : (ayarlar.tagsiz ? ayarlar.tagsiz + " " : (ayarlar.tag || "")) : ""}${User.Name}`;
                await uye.setNickname(nickname).catch(err => {});
                
                let roller_to_set = [];
                if(User.Gender == "Erkek") roller_to_set = roller.erkekRolleri;
                if(User.Gender == "Kadın") roller_to_set = roller.kadınRolleri;
                if(User.Gender == "Kayıtsız") roller_to_set = roller.kayıtsızRolleri;
                
                await uye.setRoles(roller_to_set).catch(err => {});
                if(uye.user.username.includes(ayarlar.tag)) await uye.roles.add(roller.tagRolü).catch(err => {});
                
            } else {
                // Kayıtsız Kullanıcı veya Kullanıcı Veritabanında Yok
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
        
        // Yanıt ve Loglama
        await message.reply(`${message.guild.emojiGöster(emojiler.Onay) || '✅'} Başarıyla ${uye} üyesinin (\`#${cezakontrol.No}\`) ceza numaralı cezalandırılması kaldırıldı!`).then(x => {setTimeout(() => {
            x.delete().catch(err => {})
        }, 10750)});
        
        if(uye) uye.send({embeds: [new genEmbed().setDescription(`${message.author} tarafından <t:${String(Date.now()).slice(0, 10)}:R> \`#${cezakontrol.No}\` ceza numaralı cezalandırılması kaldırıldı!`)]}).catch(x => {});

        let findChannel = message.guild.kanalBul("jail-log")
        if(findChannel) findChannel.send({embeds: [new genEmbed().setDescription(`${uye} uyesinin \`#${cezakontrol.No}\` numaralı cezalandırılması <t:${String(Date.now()).slice(0, 10)}:R> ${message.member} tarafından kaldırıldı.`)]}).catch(err => {});

        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
        
        // Leaderboard güncellemeleri
        message.member.Leaders("ceza", 5, {type: "CEZA", user: uye.id});
        message.member.Leaders("sorun", 5, {type: "CEZA", user: uye.id});
        message.member.Leaders("criminal", 5, {type: "CEZA", user: uye.id});
    }
};