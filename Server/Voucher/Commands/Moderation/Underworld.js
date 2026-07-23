const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits 
} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Users = require('../../../../Global/Databases/Client.Users');
const Jail = require('../../../../Global/Databases/Punitives.Jails');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const getLimit = new Map();

module.exports = {
    Isim: "ban",
    Komut: ["yargı", "yasakla", "sg", "ananısikerim"],
    Kullanim: "ban <@andale/ID> <Sebep>", // Kullanım güncellendi
    Aciklama: "Belirlenen üyeyi sunucudan uzaklaştırır (Underworld cezası uygular).",
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
        // Yetki Kontrolü
        if(!ayarlar && !roller && !roller.banHammer) return message.reply(cevaplar.notSetup); // Basit kontrol
        if(!roller.banHammer.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let hedefArg = args[0];
        
        // Ceza Numarası Kontrolü
        if(Number(hedefArg)) {
            let cezanobul = await Punitives.findOne({Type: "Underworld", No: hedefArg, Active: true})
            if(cezanobul) hedefArg = cezanobul.Member
        }
        
        // Üye/Kullanıcı Çekme (GuildMember öncelikli, ardından User)
        let sunucudabul = message.mentions.members.first() || message.guild.members.cache.get(hedefArg);
        let uye = sunucudabul ? sunucudabul.user : undefined;
        
        if (!uye && hedefArg) {
            try {
                // Sunucuda olmasa bile genel kullanıcı objesini çek
                uye = await client.users.fetch(hedefArg); 
            } catch (e) {
                // Hata durumunda uye null kalır
            }
        }
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(sunucudabul && sunucudabul.user.bot) return message.reply(cevaplar.bot).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Yetki üstünlüğü kontrolü (sadece sunucudaki üyeler için)
        if(sunucudabul && message.member.roles.highest.position <= sunucudabul.roles.highest.position) return message.reply(cevaplar.yetkiust).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Yetkili banlanamaz kontrolü
        if(sunucudabul && roller.Yetkiler.some(oku => sunucudabul.roles.cache.has(oku)) && !message.member.permissions.has(PermissionFlagsBits.Administrator) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) return message.channel.send(cevaplar.yetkilinoban);
        
        // Limit kontrolü
        if(getLimit.get(message.member.id) >= ayarlar.banLimit) return message.reply(cevaplar.bokyolu).then(s => setTimeout(() => s.delete().catch(err => {}), 7500));
        
        let sebep = args.splice(1).join(" ");
        if(!sebep) return message.reply(cevaplar.sebep).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Aktif Underworld kontrolü
        let bul = await Punitives.findOne({Member: uye.id, Type: "Underworld", Active: true})
        if(bul) return message.channel.send({embeds: [new genEmbed().setDescription(`${cevaplar.prefix} Belirtilen **${uye.tag}** isimli üyenin aktif bir **Underworld** cezası bulunmakta.`)]}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 7500);
        });

        // Eğer hapiste ise cezayı Underworld'e çevir
        let cezakontrol = await Jail.findById(uye.id)
        if(cezakontrol) {
            await Jail.deleteOne({ _id: uye.id })
            await Punitives.updateOne({ No: cezakontrol.No }, { $set: { "Active": false, Expried: Date.now(), Remover: message.member.id, Reason: "Underworld'e Çevrildi!",} }, { upsert: true })
            
            // Eğer üye sunucudaysa rolünü kaldır
            if(sunucudabul) sunucudabul.roles.remove(roller.jailRolü).catch(err => {}); 
        };

        // Eğer üye sunucudaysa özel GuildMember methodlarını kullan
        if(sunucudabul) {
            // Bunlar custom methodlar, GuildMember objesi üzerinden çağrıldığından dolayı sorunsuz çalışmalıdır.
            sunucudabul.removeStaff().catch(err => {});
            sunucudabul.dangerRegistrant().catch(err => {});
            sunucudabul.addPunitives(8, message.member, sebep, message).catch(err => {}); // Underworld cezası (8. tip olarak varsayılmıştır)
            
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {})
        } else {
            // Üye sunucuda değilse sadece veritabanına kaydet ve log at

            let cezano = await Punitives.countDocuments()
            cezano = cezano == 0 ? 1 : cezano + 1;
            
            let ceza = new Punitives({ 
                No: cezano,
                Member: uye.id,
                Staff: message.member.id,
                Type: "Underworld",
                Reason: sebep,
                Date: Date.now()
            })
            ceza.save().catch(err => {})
            
            // Loglama
            let findedChannel = message.guild.kanalBul("underworld-log")
            if(findedChannel) findedChannel.send({embeds: [new genEmbed().setFooter({text: `${message.guild.name} • Ceza Numarası: #${cezano}`, iconURL: message.guild.iconURL({dynamic: true})}).setDescription(`**${uye.tag}** üyesine, <t:${String(Date.now()).slice(0, 10)}:R> \`${sebep}\` nedeniyle ${message.member} tarafından ceza-i işlem uygulandı.`)]}).catch(err => {});
            
            await message.channel.send(`${message.guild.emojiGöster(emojiler.Yasaklandı) || '⛔'} Başarıyla **${uye.tag}** isimli kullanıcıya \`${sebep}\` sebebiyle "__Underworld__" türünde ceza-i işlem uygulandı. (\`Ceza Numarası: #${cezano}\`)`)
            
            // Kullanım istatistiği
            await Users.updateOne({ _id: message.member.id } , { $inc: { "Uses.Underworld": 1 } }, {upsert: true}).catch(err => {})
            
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {})
        }
        
        // Limit İşlemleri
        if(Number(ayarlar.banLimit)) {
            if(!message.member.permissions.has(PermissionFlagsBits.Administrator) && !ayarlar.staff.includes(message.member.id) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) {
                getLimit.set(`${message.member.id}`, (Number(getLimit.get(`${message.member.id}`) || 0)) + 1)
                setTimeout(() => {
                    getLimit.set(`${message.member.id}`, (Number(getLimit.get(`${message.member.id}`) || 0)) - 1)
                },1000*60*5) // 5 dakika
            }
        }
    }
};