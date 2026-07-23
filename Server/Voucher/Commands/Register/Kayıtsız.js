const { 
    Client, 
    Message,
    EmbedBuilder // V14: genEmbed'in temelini EmbedBuilder olarak varsayıyorum
} = require("discord.js");
const Kullanici = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require('../../../../Global/İnit/Embed');
const getLimit = new Map();

// NOT: roller, emojiler, cevaplar, ayarlar gibi global değişkenlerin tanımlı olduğu varsayılmıştır.

module.exports = {
    Isim: "kayıtsız",
    Komut: ["unregistered","kayitsizyap","kayitsiz"],
    Kullanim: "kayıtsız <@andale/ID> <Sebep>",
    Aciklama: "Belirlenen üyeyi kayıtsız üye olarak belirler.",
    Kategori: "teyit",
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
        
        // V14 Uyumlu Yanıtlar için yardımcı fonksiyon
        const errorReply = (content, timeout = 5000) => message.reply({ content: content }).then(s => setTimeout(() => s.delete().catch(err => {}), timeout));
        
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        
        // Yetki Kontrolü
        if(!roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has('ADMINISTRATOR')) return errorReply(cevaplar.noyt);
        
        // Kayıtsız Limit Kontrolü
        if (getLimit.get(message.author.id) >= ayarlar.kayıtsızLimit) return errorReply(cevaplar.bokyolu, 7500);
        
        // Üye Kontrolleri
        if(!uye) return errorReply(cevaplar.üye);
        if(message.author.id === uye.id) return errorReply(cevaplar.kendi);
        if(uye.user.bot) return errorReply(cevaplar.bot);
        if(!uye.manageable) return errorReply(cevaplar.dokunulmaz);
        if(message.member.roles.highest.position <= uye.roles.highest.position) return errorReply(cevaplar.yetkiust);
        if(roller.kayıtsızRolleri.some(x => uye.roles.cache.has(x))) return errorReply(cevaplar.kayıtsız);
        
        let sebep = args.splice(1).join(" ");
        if(!sebep) return errorReply(cevaplar.sebep);
        
        // İsim Ayarlama
        let nickname;
        if(ayarlar.isimyas) {
            nickname = ayarlar.type 
                ? `${uye.user.username.includes(ayarlar.tag) ? ayarlar.tag : (ayarlar.tagsiz ? ayarlar.tagsiz : (ayarlar.tag || ""))} İsim | Yaş`
                : `İsim | Yaş`;
        } else {
            nickname = ayarlar.type 
                ? `${uye.user.username.includes(ayarlar.tag) ? ayarlar.tag : (ayarlar.tagsiz ? ayarlar.tagsiz : (ayarlar.tag || ""))} Kayıtsız`
                : `Kayıtsız`;
        }
        
        await uye.setNickname(nickname).catch(err => {});
        
        // Rol ve Kanal İşlemleri
        uye.setRoles(roller.kayıtsızRolleri).catch(err => {});
        if(uye.voice.channel) uye.voice.disconnect().catch(err => {});
        
        // Database İşlemleri
        let data = await Kullanici.findOne({_id: uye.id});
        if(data && data.Name) {
            await Kullanici.updateOne({_id: uye.id}, {
                $set: { "Gender": "Kayıtsız" }, 
                $push: { 
                    "Names": { 
                        Staff: message.member.id, 
                        Date: Date.now(), 
                        Name: data.Name, 
                        State: "Kayıtsıza Atıldı" 
                    } 
                } 
            }, { upsert: true }).catch(err => {});
        }
        
        // Özel Bot Fonksiyonları
        uye.Delete()
        uye.removeStaff()
        
        // Log ve Yanıt Mesajları
        let kayıtsızLog = message.guild.kanalBul("kayıtsız-log")
        if(kayıtsızLog) {
            kayıtsızLog.send({
                embeds: [ 
                    new genEmbed().setDescription(`${uye} isimli üye ${message.author} tarafından <t:${String(Date.now()).slice(0, 10)}:R> **${sebep}** nedeniyle \`${message.guild.name}\` sunucusunda kayıtsız üye olarak belirlendi.`)
                ]
            }).catch(err => {});
        }
        
        message.reply({
            embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay)} ${uye} üyesi, **${sebep}** nedeniyle başarıyla kayıtsız'a gönderildi.`)]
        }).catch(err => {});

        // DM Gönderme
        uye.send({
            embeds: [new genEmbed().setDescription(`${message.author} tarafından \`${sebep}\` sebebi ile <t:${String(Date.now()).slice(0, 10)}:R> kayıtsız'a atıldın.`)]
        }).catch(x => {
            // DM kapalıysa hata yoksayılır
        })
        
        // Kayıtsız Limit Sistemi
        if(Number(ayarlar.kayıtsızLimit) && ayarlar.kayıtsızLimit > 1) {
            if(!message.member.permissions.has('ADMINISTRATOR') && !ayarlar.staff.includes(message.member.id) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) {
                getLimit.set(`${message.member.id}`, (Number(getLimit.get(`${message.member.id}`) || 0)) + 1)
                setTimeout(() => {
                    getLimit.set(`${message.member.id}`, (Number(getLimit.get(`${message.member.id}`) || 0)) - 1)
                },1000*60*5) // 5 dakika sonra limiti düşür
            }
        }
        
        // Onay Reaksiyonu
        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
    }
};