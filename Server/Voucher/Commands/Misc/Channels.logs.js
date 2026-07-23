const { Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
// V14: MessageEmbed, MessageButton, MessageActionRow yerine yukarıdaki importlar kullanıldı.

const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");
 const roller = global.roller || require("../../../../Global/Settings/Roles.json");
 const cevaplar = global.cevaplar || require("../../../../Global/Settings/Reply");

module.exports = {
    Isim: "kanallog",
    Komut: ["kanallogu","kanal-logu","channellogs", "kanal-log"],
    Kullanim: "kanallog #kanal/ID",
    Aciklama: "Bir üyenin rol geçmişini görüntüler.",
    Kategori: "yönetim",
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
        // Yetki Kontrolü
        // Yetki kontrolü için 'roller' değişkeninin erişilebilir olduğu varsayılmıştır.
        const yetkiliRolleri = [
            ...(roller.Yetkiler || []), 
            ...(roller.üstYönetimRolleri || []), 
            ...(roller.kurucuRolleri || []), 
            ...(roller.altYönetimRolleri || []), 
            ...(roller.yönetimRolleri || [])
        ];
        
        const hasPermission = message.member.permissions.has('Administrator') || yetkiliRolleri.some(oku => message.member.roles.cache.has(oku));
        
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));

        // Kanal Bulma
        let kanal = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.guild.kanalBul(args[0]) // message.guild.kanalBul() fonksiyonunun var olduğu varsayılmıştır.
        if(!kanal) return message.reply(cevaplar.argümandoldur).then(s => setTimeout(() => s.delete().catch(err => {}), 5000)); 
        
        // Veri Çekme
        let _data = await Users.find({"Voices.channel": kanal.id, "Voices.state": "KATILDI"})

        let joined = []

        _data.forEach(async (x) => {
            // Sadece ilgili kanala katıldığı ilk/son kaydı bulmak için.
            let find = x.Voices.reverse().find(y => y.channel == kanal.id && y.state == "KATILDI")
            if(find) {
                await joined.push({ id: x._id, date: find.date})
            }
        })
        
        // Veriyi Hazırlama ve Formatlama
        let _dataFormatted = joined
            .filter(x => message.guild.members.cache.get(x.id)) // Sunucudan ayrılanları filtrele
            .slice(0, 15) // İlk 15 kaydı al
            .sort((a, b) => b.date - a.date) // En son girenleri üste al
            .map((value, index) => {
                let member = message.guild.members.cache.get(value.id)
                // V14 Tarih Formatı: <t:timestamp:R>
                const dateTimestamp = String(Date.parse(value.date)).slice(0, 10);
                return `\` ${index + 1} \` ${member} ${member.user.tag} (<t:${dateTimestamp}:R>)`
            }).join("\n")
        
        // Yanıt Mesajı
        let load = await message.reply({content: `\`${kanal.name}\` isimli kanalın giriş çıkışları kontrol ediliyor...`})
        
        if(joined.length <= 0) return load.edit({content: `${kanal} isimli kanalın giriş çıkışları kontrol edildi fakat daha önce bu kanala giriş yapan bulunamadı. ${cevaplar.prefix}`}).catch(e => {})

        await load.edit({
            content: null, 
            embeds: [
                // genEmbed'in EmbedBuilder döndürdüğü varsayılmıştır.
                new genEmbed().setDescription(`Aşağıda ${kanal} kanalına **son giriş yapan** ${joined.length > 15 ? 15 : joined.length} üye listelenmektedir. Toplamda bu kanala giriş yapan **${joined.length}** üye bulundu.

${_dataFormatted}`)
            ]
        }).catch(e => {})

        setTimeout(() => {
            load.delete().catch(err => {})
        }, 20000)
    }
};