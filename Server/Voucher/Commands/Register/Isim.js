const { 
    Client, 
    Message,
    EmbedBuilder // V14: genEmbed'in temelini EmbedBuilder olarak varsayıyorum
} = require("discord.js");
// NOT: MessageButton ve MessageActionRow kaldırıldı, çünkü komut içinde kullanılmıyor.

const { genEmbed } = require("../../../../Global/İnit/Embed");
const Users = require('../../../../Global/Databases/Client.Users');

// NOT: roller, emojiler, cevaplar, ayarlar, sistem, tarihsel gibi global değişkenlerin tanımlı olduğu varsayılmıştır.

module.exports = {
    Isim: "isim",
    Komut: ["i","nick"],
    Kullanim: "isim <@andale/ID> <İsim/Nick>",
    Aciklama: "Belirtilen üyenin ismini ve yaşını güncellemek için kullanılır.",
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
        // V14 Uyumlu Yanıtlar için yardımcı fonksiyonlar (kodu daha temiz tutmak için)
        const errorReply = (content, timeout = 5000) => message.reply({ content: content }).then(s => setTimeout(() => s.delete().catch(err => {}), timeout));
        const embedReply = (embeds) => message.reply({ embeds: embeds });

        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])

        // Yetki Kontrolü
        if(!roller.teyitciRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has('ADMINISTRATOR')) return errorReply(cevaplar.noyt);
        
        // Üye Kontrolü
        if(!uye) return errorReply(cevaplar.üye);
        if(message.author.id === uye.id) return errorReply(cevaplar.kendi, 7500)
        if(uye.user.bot) return errorReply(cevaplar.bot);
        if(!uye.manageable) return errorReply(cevaplar.dokunulmaz, 7500)
        if(message.member.roles.highest.position <= uye.roles.highest.position) return errorReply(cevaplar.yetkiust, 7500)

        args = args.filter(a => a !== "" && a !== " ").splice(1);
        let setName;
        let isim = args.filter(arg => isNaN(arg)).map(arg => arg.charAt(0).replace('i', "İ").toUpperCase()+arg.slice(1)).join(" ");
        
        if(!isim) return errorReply(cevaplar.argümandoldur);
        
        let yas = args.filter(arg => !isNaN(arg))[0] || undefined;
        
        if(ayarlar.isimyas && !yas) return errorReply(cevaplar.argümandoldur);
        if (ayarlar.isimyas && yas < ayarlar.minYaş) return errorReply(cevaplar.yetersizyaş, 7500)
        
        if(ayarlar.isimyas) {
            setName = `${isim} | ${yas}`;
        } else {
            setName = `${isim}`;
        }
        
        // Takma ad (Nickname) ayarı ve hata yönetimi
        const newNickname = `${ayarlar.type ? uye.user.username.includes(ayarlar.tag) ? ayarlar.tag + " " : (ayarlar.tagsiz ? ayarlar.tagsiz + " " : (ayarlar.tag || "")) : ``}${setName}`;
        
        uye.setNickname(newNickname).catch(err => {
            message.channel.send({ content: cevaplar.isimapi }).catch(error => {}); // V14: Sadece string yerine object içinde content
        });
        
        // Kayıt verileri
        let isimveri = await Users.findById(uye.id)
        
        // V14: .map ile isimleri hazırlama
        let isimler = isimveri && isimveri.Names && isimveri.Names.length > 0 
            ? isimveri.Names.reverse().slice(0, 10).map((value, index) => 
                `\`${value.Name}\` (${value.State}) ${value.Staff ? "(<@"+ value.Staff + ">)" : ""}`
            ).join("\n") 
            : "Bulunamadı."

        // Özel fonksiyon çağırma (Değişmedi)
        uye.Rename(`${setName}`, message.member, "İsim Güncelleme")

        // İsim Log Kanalı
        let isimLog = message.guild.kanalBul("isim-log")
        if(isimLog) {
            isimLog.send({
                embeds: [
                    new genEmbed().setDescription(`${uye} isimli üyenin ismi ${message.member} tarafından \`${tarihsel(Date.now())}\` tarihinde "${ayarlar.isimyas ? `${isim} | ${yas}` : `${isim}`}" olarak güncellendi.`)
                ]
            }).catch(err => {})
        }

        // Ana yanıt mesajı
        let descriptionContent = `${uye} üyesinin ismi "${ayarlar.isimyas ? `${isim} | ${yas}` : `${isim}`}" olarak değiştirildi`;

        if (isimveri && isimveri.Names && isimveri.Names.length > 0) {
            descriptionContent += `, bu üye daha önce bu isimlerle kayıt olmuş.\n\n${uye} üyesinin toplamda **${isimveri.Names.length}** isim kayıtı bulundu.
__Aşağıda son 10 işlem listelenmekte__

${isimler}\n\nÖnceki isimlerine \`${sistem.botSettings.Prefixs[0]}isimler <@andale/ID>\` komutuyla bakarak kayıt işlemini\n gerçekleştirmeniz önerilir.`
        } else {
            descriptionContent += ".";
        }
        
        embedReply([
            new genEmbed().setDescription(descriptionContent)
        ]).then(msg => {
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
        })

    }
};