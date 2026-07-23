const { Client, Message, EmbedBuilder, PermissionFlagsBits} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "cezalartemizle",
    Komut: ["cezalartemizle","siciltemizle","sicil-temizle"],
    Kullanim: "cezalartemizle <@andale/ID>", // Kullanim güncellendi
    Aciklama: "Belirtilen üyenin sicilindeki tüm pasif cezaları temizler.",
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
        // V14 Yetki Kontrolü
        if(!ayarlar.staff.includes(message.member.id) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Üye çekme
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        // Eğer mention veya cache'te üye bulunamazsa ve ID verilmişse, ID'den kullanıcıyı çekmeye çalış
        if (!uye && args[0]) {
             try {
                const fetchedUser = await client.users.fetch(args[0]);
                if (fetchedUser) uye = fetchedUser;
             } catch (e) {
                // Kullanıcı bulunamazsa uye hala null kalır.
             }
        }

        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));

        const uyeId = uye.id; // Üyenin ID'si, ister GuildMember ister User objesi olsun.

        // Cezaları kontrol et
        let cezalar = await Punitives.findOne({Member: uyeId});
        if(!cezalar) return message.reply({embeds: [new genEmbed().setDescription(`${uye} isimli üyenin cezası bulunamadı.`)]});

        // Aktif ceza kontrolü
        if(await Punitives.findOne({Member: uyeId, Active: true})) return message.reply({embeds: [new genEmbed().setDescription(`${uye} isimli üyenin aktif cezası bulunduğundan dolayı işlem iptal edildi.`)]});

        // Tüm cezaları temizleme (pasifize etme) işlemi
        await Punitives.updateMany(
            {Member: uyeId}, 
            { 
                $set: { 
                    Member: `Sicil Temizlendi (${uyeId})`, // Temizlendiği bilgisini tut
                    No: "-99999", // Geçersiz ceza numarası atama
                    Remover: `Sildi (${message.author.id})`
                } 
            }
        );

        // Başarılı mesajı (V14 EmbedBuilder)
        await message.reply({embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay) || '✅'} ${uye} üyesinin tüm cezaları başarıyla temizlendi.`)]});
        
        // Reaksiyon
        await message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
    }
};