const { Client, Message, EmbedBuilder, PermissionFlagsBits} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "cezatemizleme",
    Komut: ["cezatemizle"],
    Kullanim: "cezatemizle <#Ceza-No>",
    Aciklama: "Belirtilen ceza numarasının sicilini temizler (veri tabanından silmez, pasifize eder).",
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
        // Yetki kontrolü (Kullanıcının belirlediği rol/ID'ler)
        if(!ayarlar.staff.includes(message.member.id) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        const cezaNo = args[0];

        if(!Number(cezaNo)) return message.channel.send(`${cevaplar.prefix} \`Belirtilen argüman bir numaraya benzemiyor lütfen rakam kullanınız.\``).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let cezabul = await Punitives.findOne({No: cezaNo});
        
        if(!cezabul) return message.channel.send(`${cevaplar.prefix} Belirtilen \`#${cezaNo}\` numaralı ceza bulunamadı.`).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Aktif ceza kontrolü (Ceza hala devam ediyorsa iptal)
        if(cezabul && cezabul.Active) return message.channel.send(`${cevaplar.prefix} Belirtilen (\`#${cezaNo}\`) ceza numarasında aktif ceza bulunduğundan dolayı işlem iptal edildi.`).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));

        // Ceza silme işlemi: Üye ve ceza numarası alanlarını güncelleme.
        await Punitives.updateOne({No: cezaNo}, 
            { 
                $set: { 
                    Member: `Silindi #${cezabul.No} (${cezabul.Member})`, // Üye ID'sini kaybetmeden işaretleme
                    No: "-99999", // Geçersiz bir ceza numarası atama
                    Remover: `Sildi (${message.author.id})`
                } 
            }, 
            { upsert: true }
        );

        // Kullanıcı bilgisini çekme
        const memberInfo = cezabul.Member 
            ? message.guild.members.cache.get(cezabul.Member) 
                ? message.guild.members.cache.get(cezabul.Member).toString() 
                : `<@${cezabul.Member}>` 
            : `\`Bilinmiyor\``; 

        // Mesaj gönderme (V14 EmbedBuilder)
        await message.channel.send({
            embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay) || '✅'} ${memberInfo} isimli üyeye ait \`#${cezaNo}\` numaralı ceza sicilden temizlendi.`)]
        })
        
        // Reaksiyon
        await message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
    }
};