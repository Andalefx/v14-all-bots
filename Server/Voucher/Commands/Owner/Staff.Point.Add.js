const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
// Global fonksiyonların ve dış kütüphanelerin importu korunmuştur.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const moment = require('moment');
require('moment-duration-format');
require('moment-timezone');

// Global değişkenlerin ve client metodlarının (client.Upstaffs.addPoint) varlığı varsayılmıştır.
// const { ayarlar, roller, cevaplar, emojiler } = global; 

module.exports = {
    Isim: "yetkipuan",
    Komut: ["altyetkipuan", "yetkipuanekle"],
    Kullanim: "yetkipuan <@üye/ID> <Puan>",
    Aciklama: "Belirlenen üyeye terfi sistemi için bonus puan ekler.",
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

        // İzin Kontrolü (Kurucu rolleri veya ayarlar.staff)
        const hasPermission = ayarlar.staff.includes(message.member.id) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)));
                              
        if (!hasPermission) {
            // İzin yoksa sessizce çıkılır (orijinal kodda return; vardı)
            return;
        }

        // Üye Bulma
        // args[1] yerine args[0] kullanılmalıdır, komut ismi de sayılır.
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(x => x.user.username.toLowerCase() === args.slice(0).join(" ") || x.user.username === args[0]);

        if (!uye) {
            return message.reply({ content: cevaplar.üye }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Kendi Kontrolü
        if (message.author.id === uye.id) {
            return message.reply({ content: cevaplar.kendi }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Tag Kontrolü (ayarlar.type aktifse)
        if (ayarlar.type && !uye.user.username.includes(ayarlar.tag)) {
            return message.reply({
                content: `Belirtilen üyenin üzerinde ${ayarlar.tag} sembolü bulunmadığından işleme devam edilemiyor. ${cevaplar.prefix}`
            }).then(x => {
                setTimeout(() => {
                    x.delete().catch(err => {})
                }, 7500);
            });
        }
        
        // Yasaklı Tag Kontrolü
        if ((ayarlar && ayarlar.yetkiliYasaklıTag) && ayarlar.yetkiliYasaklıTag.filter(x => x != ayarlar.tag).some(x => uye.user.username.includes(x))) {
            return message.reply({
                content: `Belirtilen üyenin üzerinde bir yasaklı tag bulunmakta! Bu nedenden dolayı yetki işlemine devam edilemiyor. ${cevaplar.prefix}`
            }).then(x => {
                setTimeout(() => {
                    x.delete().catch(err => {})
                }, 7500);
            });
        }

        // Puan Argümanını Alma
        let yetkiKodu = parseInt(args[1]); // Puan, üye argümanından sonra gelmeli

        if (isNaN(yetkiKodu) || yetkiKodu < 1) { // Puanın pozitif sayı olup olmadığını kontrol et
            return message.reply({ content: cevaplar.argümandoldur }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Puanı Ekleme (Global client metodu kullanılır)
        await client.Upstaffs.addPoint(uye.id, yetkiKodu, "Bonus");
        
        // Log Kanalına Gönderme
        const logKanal = message.guild.channels.cache.find(x => x.name === "terfi-log"); // Kanalı isme göre bulma
        
        if (logKanal) {
            logKanal.send({ 
                embeds: [embed.setDescription(`${message.member} (\`${message.member.id}\`) isimli yönetici ${uye} (\`${uye.id}\`) isimli üyeye \`${yetkiKodu}\` yetki bonusu ekledi.`)]
            }).catch(err => {});
        } else {
             // Eğer terfi-log kanalı bulunamazsa mevcut kanala da gönderebiliriz (isteğe bağlı)
             message.channel.send({ 
                embeds: [embed.setDescription(`${message.member} (\`${message.member.id}\`) isimli yönetici ${uye} (\`${uye.id}\`) isimli üyeye \`${yetkiKodu}\` yetki bonusu ekledi. (Terfi log kanalı bulunamadı)`)]
            }).then(s => setTimeout(() => s.delete().catch(err => {}), 10000));
        }

        // Onay Tepkisi Ekleme
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay); 
        if (onayEmoji) {
            message.react(onayEmoji).catch(err => {});
        } else if (emojiler.Onay) {
            message.react(emojiler.Onay).catch(err => {}); 
        }
    }
};