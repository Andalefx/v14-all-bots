const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed"); // Bu dosyanın v14 uyumlu olduğunu varsayıyorum.

module.exports = {
    Isim: "ünlemkaldır",
    Komut: ["unlemkaldır", "isim-ünlemtemizle", "unlemkaldir", "ümlemlerikaldır"],
    Kullanim: "ünlemkaldır",
    Aciklama: "Sunucudaki nickname'inde ünlem veya nokta bulunan üyelerin isimlerini temizler.",
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
        // varsayilanlar: ayarlar.staff, roller.kurucuRolleri ve YÖNETİCİ yetkisi
        const isStaff = ayarlar.staff && ayarlar.staff.includes(message.member.id);
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
        const isKurucu = roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku));

        if (!isStaff && !isAdmin && !isKurucu) {
            const reply = await message.reply(cevaplar.noyt).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
                message.delete().catch(err => {}); // Komutu da silmek isterseniz
            }, 5000);
            return;
        }

        // Tüm üyeleri cache'den çekmek yerine fetch ile güncel veriyi almak daha iyidir (v14'te)
        await message.guild.members.fetch(); 
        
        // Hem ünlem hem de nokta içeren nickname'leri filtrele
        let ünlemliler = message.guild.members.cache.filter(x => x.displayName && (x.displayName.includes("!") || x.displayName.includes(".")));
        
        // Temizleme işlemi
        let başarılıTemizlemeSayısı = 0;
        
        for (const [id, uye] of ünlemliler) {
            try {
                // Sadece ünlem ve nokta içeren nickname'leri temizle, diğer karakterler için ekleme yapılmadı.
                let newNickname = uye.displayName
                    .replace(/!/g, "")
                    .replace(/\./g, "")
                    .trim(); // Baştaki ve sondaki boşlukları da kaldırır
                
                // Eğer temizleme sonrası isim değişecekse işlem yap
                if (newNickname !== uye.displayName) {
                    // Nickname 1 karakterden azsa (örneğin sadece '!' idi ve silindi) VEYA 32 karakterden uzunsa hata almamak için kontrol
                    if (newNickname.length < 1) {
                         newNickname = uye.user.username; // Kullanıcı adını kullan
                    } else if (newNickname.length > 32) {
                        newNickname = newNickname.substring(0, 32); // Max 32 karaktere düşür
                    }
                    
                    await uye.setNickname(newNickname);
                    başarılıTemizlemeSayısı++;
                }

            } catch (err) {
                // Hata durumunda (örneğin bot yetkisinin yetersiz olması)
                // Hata mesajını konsola yazdırabilirsiniz
                // console.error(`Hata: ${uye.user.tag} üyesinin ismi değiştirilemedi.`, err);
            }
        }

        // Başarılı bildirim
        const embed = new EmbedBuilder()
            .setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla \`${başarılıTemizlemeSayısı}\` üyenin isminde ki __ünlem veya nokta__ kaldırıldı.`);
        
        const sentMessage = await message.channel.send({ embeds: [embed] }).catch(err => {});
        
        if (message.guild.emojiGöster(emojiler.Onay)) {
            message.react(message.guild.emojiGöster(emojiler.Onay).id).catch(err => {});
        }
        
        if (sentMessage) {
            setTimeout(() => {
                sentMessage.delete().catch(err => {});
            }, 17500);
        }
    }
};