const { Client, Message } = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives'); // Database şemasının yolu
const { ayarlar, cevaplar, emojiler } = global.sistem; // Global değişkenlerin doğru import edildiğini varsayıyorum.

module.exports = {
    Isim: "af",
    Komut: ["toplu-ban-kaldır", "bantemizle"],
    Kullanim: "af",
    Aciklama: "Sunucudaki tüm yasaklamaları kaldırır ve veri tabanındaki cezaları pasifleştirir.",
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
        // İzin kontrolü
        // Yalnızca ayarlar.staff dizisindeki üyelerin kullanabilmesini sağlıyoruz
        if (!ayarlar.staff.includes(message.member.id)) {
            const reply = await message.reply(cevaplar.noyt).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
            }, 5000);
            return;
        }

        // Sunucudaki tüm yasaklı kullanıcıları çek (Collection döner)
        const banneds = await message.guild.bans.fetch().catch(err => {
            console.error("Ban listesi çekilemedi:", err);
            return null;
        });

        if (!banneds || banneds.size === 0) {
            return message.reply(`Sunucuda kaldırılacak aktif bir yasaklama bulunmamaktadır.`).catch(err => {});
        }

        let unbannedCount = 0;
        const unbanPromises = [];

        // Collection'daki her bir ban kaydını (ban entry'si) döngüye al
        for (const ban of banneds.values()) {
            // Unban işlemini Promise dizisine ekle
            const unbanPromise = message.guild.members.unban(ban.user.id, `Yetkili: ${message.author.tag} (ID: ${message.author.id})`)
                .then(async () => {
                    unbannedCount++;
                    // Veritabanı işlemleri
                    try {
                        // Aktif olan Yasaklama cezasını bul
                        const res = await Punitives.findOne({ Member: ban.user.id, Type: "Yasaklama", Active: true });
                        if (res) {
                            // Cezayı pasifleştir ve bitiş süresini, kaldıran yetkiliyi kaydet
                            await Punitives.updateOne({ No: res.No }, { 
                                $set: { "Active": false, Expried: Date.now(), Remover: message.member.id } 
                            });
                        }
                    } catch (dbErr) {
                        console.error(`Veritabanı güncelleme hatası (${ban.user.id}):`, dbErr);
                    }
                })
                .catch(err => {
                    // Unban işlemi başarısız olursa (örneğin bot yetkisi yetersizse)
                    console.error(`Kullanıcının banı kaldırılamadı (${ban.user.tag}):`, err);
                });
            
            unbanPromises.push(unbanPromise);
        }

        // Tüm unban işlemlerinin bitmesini bekle
        await Promise.allSettled(unbanPromises);

        // Bilgilendirme mesajı ve reaksiyon
        message.reply({ content: `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla sunucudaki toplam **${unbannedCount}** kullanıcının yasaklaması kaldırıldı ve ceza verileri güncellendi.`, allowedMentions: { repliedUser: false } }).catch(err => {});
        
        if (message) {
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
        }
    }
};