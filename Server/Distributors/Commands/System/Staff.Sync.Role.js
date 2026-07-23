const { 
    Client, 
    Message, 
    EmbedBuilder 
} = require("discord.js");
const Upstaffs = require('../../../../Global/Databases/Client.Users.Staffs')

const moment = require('moment');
const { genEmbed } = require("../../../../Global/İnit/Embed");
require('moment-duration-format');
require('moment-timezone');

// Varsayımlar: Global değişkenlerin tanımlı olduğunu varsayıyoruz.
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 
const ayarlar = global.ayarlar || { staff: [], tag: "tag" }; 
const roller = global.roller || { altilkyetki: "ALT_ILK_YETKI_ROL_ID" }; 
const cevaplar = global.cevaplar || { kendi: "Kendi yetkinizi senkronize edemezsiniz." }; 
const _statSystem = global._statSystem || { staffs: [] }; // Yetki kademelerini tutan yapı

module.exports = {
    Isim: "ysenk",
    Komut: ["yetkisenkronize","y"],
    Kullanim: "y u <@andale/ID> <Yetki S.Kodu> | y r <@rol/ID>",
    Aciklama: "Belirlenen üyeyi veya roldeki üyeleri terfi sistemine senkronize eder.",
    Kategori: "-",
    Extend: true,
    
    /**
     * @param {Client} client 
     */
    onLoad: function (client) {
      client.sureCevir = (date) => { return moment.duration(date).format('H [saat,] m [dakika,] s [saniye]'); };
    },

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array<String>} args 
     */
    onRequest: async function (client, message, args) {
        
        // --- DM KONTROLÜ ---
        if (!message.guild || !message.member) return;

        // Emoji Erişimi için Güvenli Fonksiyon
        const getEmojiID = (emojiName) => {
             const emoji = emojiler[emojiName];
             if (message.guild.emojis.cache.has(emoji)) {
                 return message.guild.emojis.cache.get(emoji).id;
             }
             return undefined; 
        }
        
        let embed = new genEmbed();
        
        // Yetki Kontrolü
        if(!ayarlar.staff.includes(message.member.id)) return;
        
        let işlem = args[0];
        if(işlem !== "u" && işlem !== "r") return;
        
        // --- KULLANICI SENKRONİZASYONU (U) ---
        if(işlem === "u") {
            let kullArgs = args.slice(1);
            // Mentions, ID, Username kontrolü
            let uye = message.mentions.members.first() || message.guild.members.cache.get(kullArgs[1]) || message.guild.members.cache.find(x => x.user.username.toLowerCase().includes(kullArgs.slice(1).join(" ").toLowerCase()) || x.user.username.includes(kullArgs[1]));

            if(!uye) return message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌');
            
            // Tag kontrolü
            if(!uye.user.username.includes(ayarlar.tag)) return message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌');
            
            // Kendini senkronize etme kontrolü
            if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
            
            let yetkiKodu = parseInt(args[2]);
            
            // Yetki Kodu Kontrolleri
            if(isNaN(yetkiKodu)) return message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌');
            if(yetkiKodu > _statSystem.staffs.length || yetkiKodu < 1) return message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌'); // Yetki kademesi sınırları
            
            // Veritabanı güncelleme (Terfi kaydını sıfırlama)
            await Upstaffs.updateOne({ _id: uye.id }, { 
                $set: { 
                    "staffNo": yetkiKodu, 
                    "staffExNo": yetkiKodu - 1, 
                    "Points": 0, 
                    "ToplamPuan": 0, 
                    "Baslama": Date.now() 
                } 
            }, {upsert: true}); 
            
            let yeniYetki = _statSystem.staffs.find(x => x.No == yetkiKodu - 1); // Bir alt yetkiyi bul
            
            if(yeniYetki) {
                // Rol verme işlemleri (V14 uyumlu)
                if(!uye.roles.cache.has(yeniYetki.rol)) await uye.roles.add(yeniYetki.rol).catch(e => {});
                if(!uye.roles.cache.has(roller.altilkyetki)) await uye.roles.add(roller.altilkyetki).catch(e => {});
            }
            
            message.react(getEmojiID('Onay') ? getEmojiID('Onay') : '✅');
            
            // Loglama
            message.guild.kanalBul("terfi-log").send({
                embeds: [
                    embed.setDescription(`${message.member} isimli yetkili **${uye}** isimli üyeyi <t:${String(Date.now()).slice(0, 10)}:R> **${yeniYetki ? message.guild.roles.cache.get(yeniYetki.rol) || "Bulunamadı!" : "Bulunamadı!"}** role senkronize etti.`)
                ]
            }).catch(e => {});
        } 
        
        // --- ROL SENKRONİZASYONU (R) ---
        else if(işlem === "r") {
            const rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
            
            if(!rol) return message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌');
            if(rol.members.size === 0) return message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌');
            
            let successCount = 0;
            
            // Roldeki tüm üyeler üzerinde iterasyon
            for (const [memberID, uye] of rol.members) {
                if (uye.user.bot) continue;

                if (_statSystem.staffs.some(x => uye.roles.cache.has(x.rol))) {
                    let acar = _statSystem.staffs.find(x => uye.roles.cache.has(x.rol));
                    let No = Number(acar.No);
                    
                    if(!uye.roles.cache.has(roller.altilkyetki)) await uye.roles.add(roller.altilkyetki).catch(e => {});

                    // Veritabanı güncelleme (Bir üst kademeye senkronize etme)
                    await Upstaffs.updateOne({ _id: uye.id }, { 
                        $set: { 
                            "staffNo": No + Number(1), 
                            "staffExNo": No, 
                            "Points": 0, 
                            "ToplamPuan": 0, 
                            "Baslama": Date.now() 
                        } 
                    }, {upsert: true}); 
                    
                    successCount++;
                }
            }

            if (successCount === 0) {
                 message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌');
            } else {
                 message.react(getEmojiID('Onay') ? getEmojiID('Onay') : '✅');
            }
            
            // Not: Orijinal kodda bu mesaj ve log satırları yoruma alınmış veya eksikti.
            // Sadece loglama yapılıyordu, onu aktif hale getiriyorum (varsayılan kanal üzerinden).
            message.channel.send({
                embeds: [embed.setDescription(`${getEmoji('Onay')} Başarıyla **${rol.name}** rolündeki **${successCount}** üye terfi sistemine senkronize edildi.`)]
            }).then(x => setTimeout(() => x.delete().catch(e => {}), 10000)).catch(e => {});
            
            message.guild.kanalBul("senk-log").send({
                 embeds: [embed.setDescription(`${message.member} isimli yetkili ${rol} isimli roldeki üyeleri senkronize etti.`)]
            }).catch(e => {});
        }
    }
};