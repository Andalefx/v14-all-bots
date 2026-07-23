const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Upstaff = require('../../../../Global/Databases/Client.Users.Staffs');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require('../../../../Global/İnit/Embed');

// Global değişkenlerin ve client metodlarının (roller, cevaplar, emojiler, tarihsel) varlığı varsayılmıştır.
// const { roller, cevaplar, emojiler, tarihsel } = global; 

module.exports = {
    Isim: "yetkiçek",
    Komut: ["yçek", "ytçek", "yetkicek", "ycek"],
    Kullanim: "yetkiçek <@andale/ID>", // Kullanım etiketi güncellendi
    Aciklama: "Belirlenen üyenin tüm yetki rollerini alır ve bu işlemi loglar.",
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
        let embed = new genEmbed();
        
        // İzin Kontrolü (Kurucu Rolleri veya Admin)
        const hasPermission = roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator);
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Üye Bulma
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        if (!uye) {
            return message.reply({ content: cevaplar.üye }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Kendi Kontrolü
        if (message.author.id === uye.id) {
            return message.reply({ content: cevaplar.kendi }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // 1. Yetkili Kontrolü ve Yetki Bıraktırma Fonksiyonunu Çağırma
        let kontrol = await Users.findOne({ _id: uye.id }) || { Staff: false };
        // Eğer üye yetkiliyse, custom removeStaff fonksiyonu çağrılır
        if (kontrol && kontrol.Staff) {
            // uye.removeStaff'ın V14'te de geçerli olduğu varsayılmıştır.
            // Bu fonksiyon yetkisi çekilen üyenin eski rollerini alıp kayıtsız rolü verir.
            uye.removeStaff(uye.roles.cache, true); 
        }

        // 2. Log Kaydı Ekleme (Yetki Çekildi)
        await Users.updateOne({ _id: uye.id }, { 
            $push: { 
                "StaffLogs": {
                    Date: Date.now(),
                    Process: "ÇEKİLDİ",
                    // Rol bilgisini alırken V14'te .hoist rolünün ID'sine erişilir
                    Role: uye.roles.highest ? uye.roles.highest.id : roller.başlangıçYetki, 
                    Author: message.member.id
                }
            }
        }, { upsert: true });
        
        // 3. Alt Yetkilerin Kaldırılması
        let altYetki = message.guild.roles.cache.get(roller.altilkyetki);
        
        if (altYetki) {
            // Alt ilk yetkiden büyük veya eşit pozisyondaki tüm rollerin kaldırılması
            await uye.roles.remove(uye.roles.cache.filter(rol => altYetki.position <= rol.position)).catch(err => {});
        } else {
             // altilkyetki rolü yoksa, sadece yetki çekme logu atılır ve devam edilir.
        }
        
        // 4. Log Kanalına Bilgilendirme
        let yetkiliLog = message.guild.channels.cache.find(x => x.name === "yetki-çek-log") || message.guild.kanalBul("yetki-çek-log");

        if (yetkiliLog) {
            yetkiliLog.send({
                embeds: [embed.setDescription(`${message.author} isimli yetkili ${uye.toString()} isimli üyenin \`${tarihsel(Date.now())}\` tarihinde **yetkisini aldı!**`)]
            }).catch(err => {});
        }
        
        // 5. Başarılı İşlem Mesajı
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay) || '✅';

        message.reply({
            embeds: [new genEmbed().setDescription(`${onayEmoji} Başarıyla ${uye.toString()} isimli üyenin **yetkisi alındı.**`)]
        })
        .then(x => {
            // Tepki Ekleme
            message.react(onayEmoji).catch(err => {});
            
            // Mesajı Silme
            setTimeout(() => {
                x.delete().catch(err => {});
            }, 7500);
        });
    }
};