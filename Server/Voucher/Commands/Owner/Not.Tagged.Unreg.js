const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
// Global fonksiyonların ve veritabanı modelinin doğru import edildiği varsayılmıştır.
const { genEmbed } = require("../../../../Global/İnit/Embed");;
const Kullanici = require('../../../../Global/Databases/Client.Users'); // Veritabanı modeliniz

// Global değişkenlerin doğru import edildiği varsayılmıştır.
// const { ayarlar, roller, cevaplar, emojiler } = global; 

module.exports = {
    Isim: "tagsızat",
    Komut: ["tagsızkayıtsız"],
    Kullanim: "tagsızat",
    Aciklama: "Sunucudaki kayıtlı olup tagı olmayan üyeleri kayıtsız'a atar.",
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
        // V14 Embed Oluşturma
        const embed = new genEmbed(); 

        // İzin Kontrolü (Administrator veya kurucu rolleri)
        const hasPermission = message.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)));
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Taglı-Alım Kontrolü
        if (!ayarlar.taglıalım) {
            return message.channel.send({ content: `${cevaplar.prefix} \`Taglı-Alım\` modu kapalı olduğundan dolayı işlem iptal edildi.` });
        }
        
        // Tagsız ve Kayıtlı Olan Üyeleri Filtreleme
        const tagsızlar = message.guild.members.cache.filter(x => 
            // 1. Tagsız Olanlar
            !x.user.username.includes(ayarlar.tag) && 
            // 2. Vip/Booster Rolü Olmayanlar (Tagsız olmasına rağmen kayıtta kalma ayrıcalığı olanlar hariç)
            !x.roles.cache.has(roller.vipRolü) && 
            !x.roles.cache.has(roller.boosterRolü) &&
            // 3. Kayıtlı Rolü Olanlar (Kadın veya Erkek rolleri olanlar)
            (roller.kadınRolleri.some(r => x.roles.cache.has(r)) || 
            roller.erkekRolleri.some(r => x.roles.cache.has(r)))
        );
        
        // İşlem
        tagsızlar.forEach(async (uye) => {
            // Takma Adı Güncelleme
            uye.setNickname(`${uye.user.username.includes(ayarlar.tag) ? ayarlar.tag : (ayarlar.tagsiz ? ayarlar.tagsiz : (ayarlar.tag || ""))} İsim | Yaş`).catch(err => {});
            
            // Rolleri Kayıtsız Rollere Ayarlama
            uye.roles.set(roller.kayıtsızRolleri).catch(err => {});
            
            // Sesten Atma
            if (uye.voice.channel) {
                uye.voice.disconnect().catch(err => {});
            }
            
            // Veritabanı İşlemleri
            let data = await Kullanici.findOne({ _id: uye.id });
            if (data && data.Name) {
                await Kullanici.updateOne({ _id: uye.id }, {
                    $set: { "Gender": "Kayıtsız" },
                    $push: { 
                        "Names": { 
                            Staff: message.member.id, 
                            Date: Date.now(), 
                            Name: data.Name, 
                            State: "Tagsız Kayıtsıza Atıldı" 
                        } 
                    } 
                }, { upsert: true });
            }
            
            // Global fonksiyon çağrıları (Varlıkları varsayılmıştır)
            if (typeof uye.Delete === 'function') uye.Delete();
            if (typeof uye.removeStaff === 'function') uye.removeStaff();
        });

        // Bilgilendirme mesajı gönderme
        message.channel.send({
            embeds: [embed.setDescription(`Sunucuda kayıtlı olup tagı olmayan **\`${tagsızlar.size}\`** üye başarıyla kayıtsız'a atıldı!`)]
        }).then(x => {
            // Mesajı silme
            setTimeout(() => {
                x.delete().catch(err => {});
            }, 7500);
        });

        // Emoji Tepkisi
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay); 
        if (onayEmoji) {
            message.react(onayEmoji).catch(err => {});
        } else if (emojiler.Onay) {
            message.react(emojiler.Onay).catch(err => {}); 
        }
    }
};