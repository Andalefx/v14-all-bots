const Punitives = require('../../../../Global/Databases/Global.Punitives');
const table = require('table');
const { Client, Message, AttachmentBuilder } = require("discord.js"); // V14 için AttachmentBuilder eklendi

module.exports = {
    Isim: "cezalar",
    Komut: ["sicil"],
    Kullanim: "cezalar <@andale/ID>",
    Aciklama: "Belirlenen üyenin bütün ceza verisini tablo formatında gösterir.",
    Kategori: "diğer",
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
        
        let uye;
        
        // Üye çekme: Mention, ID (cache'ten)
        if (args[0]) {
            uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

            // Eğer cache'te bulunamazsa ID ile çekmeyi dene
            if (!uye) {
                try {
                    const fetchedUser = await client.users.fetch(args[0]);
                    if (fetchedUser) uye = fetchedUser;
                } catch (e) {
                    // Kullanıcı bulunamazsa hata verme, devam et
                }
            }
        }
        
        // Eğer hiçbir üye bulunamazsa, komutu kullananı al
        if (!uye) uye = message.member;

        // Not: "cevaplar" nesnesinin yukarıda veya globalde tanımlı olduğundan emin olun.
        if (!uye) return message.reply(typeof cevaplar !== 'undefined' ? cevaplar.üye : "Üye bulunamadı.").then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        const uyeId = uye.id;

        try {
            // Mongoose exec callback kaldırıldı, modern await yapısına geçildi
            const res = await Punitives.find({ Member: uyeId }).lean();

            if (!res || res.length === 0) {
                return message.reply(`${uye} üyesinin ceza-i bilgilerine ulaşılamadı.`).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
            }
            
            let data = [["ID", "🔵", "Ceza Tarihi", "Ceza Türü", "Ceza Sebebi"]];
            
            data = data.concat(res.map(value => {
                // Not: "tarihsel" fonksiyonunun globalde tanımlı olduğundan emin olun.
                const tarih = typeof tarihsel === 'function' ? tarihsel(value.Date) : value.Date;
                return [
                    `#${value.No || "—"}`,
                    `${value.Active == true ? "✅" : "❌"}`,
                    `${tarih}`,
                    `${value.Type || "—"}`,
                    `${value.Reason || "—"}`
                ];
            }));
            
            let veriler = table.table(data, {
                columns: { 0: { paddingLeft: 1 }, 1: { paddingLeft: 1 }, 2: { paddingLeft: 1 }, 3: { paddingLeft: 1, paddingRight: 1 }, },
                border : table.getBorderCharacters(`void`),
                drawHorizontalLine: function (index, size) {
                    return index === 0 || index === 1 || index === size;
                }
            });
            
            // Metin uzunluğu 2000 karakteri geçerse doğrudan catch bloguna düşmesi için kontrol ekleyelim
            if (veriler.length > 1900) {
                throw new Error("Yazı limiti aşıldı, dosyaya aktarılıyor...");
            }

            // Metin mesajı gönderme
            message.channel.send({ content: `:no_entry_sign: <@${uyeId}> üyesinin ceza bilgileri aşağıda belirtilmiştir. Tekli bir cezaya bakmak için \`.ceza ID\` komutunu uygulayınız.\n\`\`\`${veriler}\`\`\``}).then(x => {
                setTimeout(() => {
                    x.delete().catch(err => {})
                }, 60000);
            }).catch(err => {
                // Karakter sınırı aşılırsa burası tetiklenir
                gonderDosya(message, uyeId, veriler);
            });

        } catch (error) {
            // Karakter sınırı veya find hatası durumunda txt olarak gönder
            gonderDosya(message, uyeId, veriler);
        }
    }
};

// Dosya gönderme işlemini kolaylaştırmak için yardımcı fonksiyon
function gonderDosya(message, uyeId, veriler) {
    if (!veriler) return message.reply('Hata: `Bazı hatalar oluştu :(`').then(x => setTimeout(() => x.delete().catch(err => {}), 5000));
    
    // Node.js global Buffer'ı ve V14 AttachmentBuilder kullanıldı
    const attachment = new AttachmentBuilder(Buffer.from(veriler), { name: `${uyeId}-cezalar.txt` });
    
    message.channel.send({
        content: `:no_entry_sign: <@${uyeId}> üyesinin cezaları **Discord API** sınırını geçtiği için metin belgesi hazırlayıp gönderdim, oradan cezaları kontrol edebilirsin.\nTekli bir cezaya bakmak için \`.ceza bilgi ID\` komutunu uygulayınız.`, 
        files: [attachment]
    });
}