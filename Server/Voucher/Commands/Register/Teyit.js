const { 
    Client, 
    Message, 
    EmbedBuilder // V14: MessageEmbed yerine
} = require("discord.js");

const Kullanici = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");

// NOT: roller, cevaplar, ayarlar gibi global değişkenlerin tanımlı olduğu varsayılmıştır.

module.exports = {
    Isim: "teyit",
    Komut: ["Teyit", "kayıtbilgi","kayıt-bilgi"],
    Kullanim: "teyit <@andale/ID>",
    Aciklama: "Belirtilen üye ve komutu kullanan üyenin teyit bilgilerini gösterir.",
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
        
        let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]) || message.member;
        
        // V14 Uyumlu Yanıtlar için yardımcı fonksiyon
        const errorReply = (content, timeout = 5000) => message.reply({ content: content }).then(s => setTimeout(() => s.delete().catch(err => {}), timeout));
        
        if (!uye) return errorReply(cevaplar.üyeyok);
        
        // Üye nesnesini MessageMember olarak almak (her ihtimale karşı)
        uye = message.guild.members.cache.get(uye.id)
        
        // Yetki Kontrolü
        if(!roller.teyitciRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has('ADMINISTRATOR')) return errorReply(cevaplar.noyt);
        
        let teyit = await Kullanici.findOne({ _id: uye.id });
        let teyitBilgisi;
        
        if(teyit && teyit.Records) {
            let erkekTeyit = teyit.Records.filter(v => v.Gender === "Erkek").length
            let kizTeyit = teyit.Records.filter(v => v.Gender === "Kadın").length
            
            // Kayıt edilen üyelerden sunucuda olanlar
            let bazıları = teyit.Records.filter(v => message.guild.members.cache.get(v.User))
                                       .map((value, index) => message.guild.members.cache.get(value.User));
            
            let çıkanlar = teyit.Records.filter(v => !message.guild.members.cache.get(v.User)).length
            
            let taglılar = teyit.Records.filter(x => {
                let üye = message.guild.members.cache.get(x.User)
                return üye && üye.user.username.includes(ayarlar.tag)
            }).length

            let toplamKayıt = erkekTeyit + kizTeyit;
            let taglıBilgi = ayarlar.type ? `**${taglılar}** taglı, ` : ``;
            let bazılarıListesi = toplamKayıt > 0 
                ? bazıları.length > 10
                    ? `${bazıları.slice(0, 10).join(", ")} ve ${toplamKayıt - 10} daha fazla `
                    : bazıları.slice(0, 10).join(", ") 
                : '';

            teyitBilgisi = `${uye} toplam **${toplamKayıt}** kişi kayıt etmiş! (**${erkekTeyit}** erkek, **${kizTeyit}** kadın, ${taglıBilgi}**${çıkanlar}** çıkanlar)
${toplamKayıt > 0 ? `Kayıt edilen bazı kişiler: ${bazılarıListesi}` : ''}`;

        } else { 
            teyitBilgisi = `${uye} isimli üyenin teyit bilgisi bulunamadı.`;
        }
        
        // V14: Embed yanıtlama
        message.reply({
            embeds: [
                new genEmbed()
                    .setAuthor({name: uye.user.tag, iconURL: uye.user.displayAvatarURL({dynamic: true})}) // V14 Author formatı
                    .setDescription(teyitBilgisi)
            ]
        });
    }
};