const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const getLimit = new Map();

module.exports = {
    Isim: "yargı",
    Komut: ["yargi","yargila","yargıla"],
    Kullanim: "yargı <@andale/ID> <Sebep>",
    Aciklama: "Belirlenen üyeyi sunucudan uzaklaştırır.",
    Kategori: "kurucu",
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
        if(!ayarlar && !roller && !roller.banHammer || !roller.üstYönetimRolleri || !roller.yönetimRolleri || !roller.kurucuRolleri || !roller.altYönetimRolleri) return message.reply(cevaplar.notSetup)
        
        // V14 Yetki Kontrolü: PermissionFlagsBits kullanıldı.
        const hasAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        if(!roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !hasAdmin) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Üye nesnesi (User veya GuildMember) çekilir.
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || await client.getUser(args[0])
        // Sunucuda bulunan üye nesnesi (sadece GuildMember)
        let sunucudabul = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(sunucudabul && sunucudabul.user.bot) return message.reply(cevaplar.bot).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(sunucudabul && message.member.roles.highest.position <= sunucudabul.roles.highest.position) return message.reply(cevaplar.yetkiust).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Yetkiliye yasaklama kontrolü
        if(sunucudabul && roller.Yetkiler.some(oku => sunucudabul.roles.cache.has(oku)) && !hasAdmin && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) return message.reply(cevaplar.yetkilinoban); 
        
        // Ban limiti kontrolü
        if(getLimit.get(message.member.id) >= ayarlar.banLimit) return message.reply(cevaplar.bokyolu).then(s => setTimeout(() => s.delete().catch(err => {}), 7500));
        
        let sebep = args.splice(1).join(" ");
        if(!sebep) return message.reply(cevaplar.sebep).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));

        if(sunucudabul) {
            // Üye sunucuda ise custom fonksiyonlar çalıştırılır ve ban atılır.
            await sunucudabul.removeStaff() // Custom fonksiyon
            await sunucudabul.dangerRegistrant() // Custom fonksiyon
            await sunucudabul.addPunitives(2, message.member, sebep, message) // Custom fonksiyon (Ban Type: 2)
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
        } else {
            // Üye sunucuda değil (User nesnesi) ise manuel ban ve log işlemi yapılır.
            let cezano = await Punitives.countDocuments()
            cezano = cezano == 0 ? 1 : cezano + 1;
            
            let ceza = new Punitives({ 
                No: cezano,
                Member: uye.id,
                Staff: message.member.id,
                Type: "Yasaklama",
                Reason: sebep,
                Date: Date.now()
            })
            await ceza.save().catch(err => {})
            
            let findedChannel = message.guild.kanalBul("ban-log")

            if(findedChannel) {
                findedChannel.send({embeds: [new genEmbed()
                    .setFooter({
                        text: `${message.guild.name ? `${message.guild.name} •` : ''} Ceza Numarası: #${cezano}`,
                        iconURL: message.guild.name ? message.guild.iconURL({dynamic: true}) : uye.avatarURL({dynamic: true})
                    })
                    .setDescription(`${uye.toString()} üyesine, <t:${String(Date.now()).slice(0, 10)}:R> \`${sebep}\` nedeniyle ${message.member} tarafından ceza-i işlem uygulandı.`)
                ]})
            }
            
            await message.channel.send(`${message.guild.emojiGöster(emojiler.Yasaklandı) || '❌'} ${uye.toString()} isimli üyeye \`${sebep}\` sebebiyle "__Yasaklama__" türünde ceza-i işlem uygulandı. (\`Ceza Numarası: #${cezano}\`)`)
            
            // Üyeyi banlama işlemi
            await message.guild.members.ban(uye.id, { reason: `#${ceza.No} (${ceza.Reason})` }).catch(err => {})
            
            // Ban sayısını artırma
            await Users.updateOne({ _id: message.member.id } , { $inc: { "Uses.Ban": 1 } }, {upsert: true})
            
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
        }
        
        // Limit sistemi
        if(Number(ayarlar.banLimit)) {
            if(!hasAdmin && !ayarlar.staff.includes(message.member.id) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) {
                getLimit.set(`${message.member.id}`, (Number(getLimit.get(`${message.member.id}`) || 0)) + 1)
                setTimeout(() => {
                    getLimit.set(`${message.member.id}`, (Number(getLimit.get(`${message.member.id}`) || 0)) - 1)
                }, 1000 * 60 * 5) // 5 dakika
            }
        }
    }
};