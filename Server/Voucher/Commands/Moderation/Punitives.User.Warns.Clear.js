const { Client, Message, EmbedBuilder, PermissionFlagsBits} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "uyarıtemizle",
    Komut: ["uyarılartemizle","uyarilartemizle"],
    Kullanim: "uyarıtemizle <@andale/ID>", // Kullanim güncellendi
    Aciklama: "Belirtilen üyenin sicilindeki tüm uyarı cezalarını temizler (pasifize eder).",
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
        // V14 Yetki Kontrolü (PermissionFlagsBits yerine custom roller kullanılmış)
        if(!ayarlar.staff.includes(message.member.id) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));

        let hedef = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        let kullanıcı; // Genel User objesi

        // Eğer hedef GuildMember olarak bulunamazsa, ID'den genel kullanıcı objesini çekmeye çalış
        if (!hedef && args[0]) {
            try {
                // client.users.fetch, hem GuildMember hem de sunucudan ayrılmış User objesini getirebilir.
                kullanıcı = await client.users.fetch(args[0]); 
            } catch (e) {
                // Hata durumunda kullanıcı null kalır
            }
            
            // Eğer bir User objesi bulunduysa, işlem için onu kullan
            if (kullanıcı) hedef = kullanıcı; 
        }
        
        if(!hedef) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));

        const uyeId = hedef.id;

        // Üyenin uyarı cezaları olup olmadığını kontrol et
        const uyarılarVarMi = await Punitives.findOne({Member: uyeId, Type: "Uyarılma"});

        if(uyarılarVarMi) {
            // Uyarıları temizleme (pasifize etme) işlemi
            const updateResult = await Punitives.updateMany(
                {Member: uyeId, Type: "Uyarılma" }, 
                { 
                    $set: { 
                        Member: `Uyarıları Silindi (${uyeId})`, // Temizlendiği bilgisini tut
                        No: "-99999", // Geçersiz ceza numarası atama (Bu mantık database'inizin yapısına bağlıdır)
                        Remover: `Sildi (${message.author.id})`,
                        Active: false // Aktif ceza durumunu pasife çek
                    } 
                }
            );

            // Başarılı mesajı
            await message.reply({embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay) || '✅'} **${hedef.user ? hedef.user.tag : hedef.tag}** (${uyeId}) üyesinin **${updateResult.modifiedCount || 0}** adet uyarılması başarıyla temizlendi (pasifize edildi).`)]});
            // Reaksiyon
            await message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
        } else {
            // Uyarı bulunamazsa
            await message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {});
            return message.reply({embeds: [new genEmbed().setDescription(`**${hedef.user ? hedef.user.tag : hedef.tag}** (${uyeId}) isimli üyenin aktif uyarısı bulunamadığından dolayı işlem iptal edildi.`)]});
        }
    }
};