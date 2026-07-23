const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Users = require('../../../../Global/Databases/Client.Users');
const Forcebans = require('../../../../Global/Databases/Punitives.Forcebans');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "kalkmazban",
    Komut: ["andaleban", "uzaoç","forceban","xox","siktirgitamınoğlu"],
    Kullanim: "kalkmazban <@andale/ID> <Sebep>",
    Aciklama: "Belirlenen üyeyi sunucudan uzaklaştırır (Kalkmaz Yasaklama).",
    Kategori: "kurucu",
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
        // Personel kontrolü V14'te aynı kalır.
        if(!ayarlar.staff.includes(message.member.id)) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || await client.getUser(args[0])
        let sunucudabul = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(sunucudabul && sunucudabul.user.bot) return message.reply(cevaplar.bot).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(sunucudabul && message.member.roles.highest.position <= sunucudabul.roles.highest.position) return message.reply(cevaplar.yetkiust).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let sebep = args.splice(1).join(" ");
        if(!sebep) return message.reply(cevaplar.sebep);
        
        if(sunucudabul) {
            // Üye sunucuda ise custom addPunitives fonksiyonu çalışır.
            await uye.addPunitives(1, message.member, sebep, message) // Type 1: Kalkmaz Yasaklama
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {})
        } else {
            // Üye sunucuda değilse manuel ceza işlemi yapılır.
            let cezano = await Punitives.countDocuments()
            cezano = cezano == 0 ? 1 : cezano + 1;
            
            let ceza = new Punitives({ 
                No: cezano,
                Member: uye.id,
                Staff: message.member.id,
                Type: "Kalkmaz Yasaklama",
                Reason: sebep,
                Date: Date.now()
            })
            await ceza.save().catch(err => {})  
            
            // Kalkmaz ban veritabanına kaydetme
            islem = new Forcebans({
                No: cezano,
                _id: uye.id,
            })
            await islem.save();
            
            let findedChannel = message.guild.kanalBul("forceban-log")

            if(findedChannel) {
                // V14 EmbedBuilder ve setFooter({ text, iconURL }) kullanımı
                findedChannel.send({embeds: [new genEmbed()
                    .setFooter({
                        text: `Ceza Numarası: #${cezano}`,
                        iconURL: uye.avatarURL({dynamic: true})
                    })
                    .setDescription(`${uye.toString()} üyesine, <t:${String(Date.now()).slice(0, 10)}:R> \`${sebep}\` nedeniyle işlem uygulandı.`)
                ]})
            }
            
            await message.channel.send(`${message.guild.emojiGöster(emojiler.Yasaklandı) || '❌'} ${uye.toString()} isimli üyeye \`${sebep}\` sebebiyle "__Kalkmaz(**BOT**) Yasaklama__" türünde ceza-i işlem uygulandı. (\`Ceza Numarası: #${cezano}\`)`)
            
            // Üyeyi banlama işlemi (V14'te aynı kalır)
            await message.guild.members.ban(uye.id, { reason: `#${ceza.No} (${ceza.Reason})` }).catch(err => {})
            
            // Kullanım sayısını artırma
            await Users.updateOne({ _id: message.member.id } , { $inc: { "Uses.Forceban": 1 } }, {upsert: true})
            
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {})
        }
    }
};