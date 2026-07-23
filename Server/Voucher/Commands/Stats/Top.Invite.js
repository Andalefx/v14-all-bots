const {
    Client,
    Message,
    EmbedBuilder // V14: MessageEmbed yerine EmbedBuilder
} = require("discord.js");
// NOT: Databasenizin doğru yolunu kontrol edin. Varsayılan şema yolu kullanıldı.
const Invite = require('../../../../Global/Databases/Global.Guild.Invites'); 
const {
    genEmbed
} = require("../../../../Global/İnit/Embed");
const { cevaplar } = require('../../../../Global/Settings/Reply'); // 'cevaplar.prefix' için eklenmiştir.

module.exports = {
    Isim: "topdavet",
    Komut: ["topinvite"],
    Kullanim: "topinvite",
    Aciklama: "Sunucu içerisindeki tüm davet sıralaması görüntülenir",
    Kategori: "stat",
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
        // V14 UYUMU: message.reply() kullanıldı
        let load = await message.reply({
            content: `${message.guild.name} sunucusuna ait davet sıralaması yükleniyor. Lütfen bekleyin!`
        })

        // V14 UYUMU: genEmbed bir EmbedBuilder instance'ı olmalı
        let embed = new genEmbed()
        let findedIndex = '';

        // Davet verilerini çek
        let data = await Invite.find({ guildID: message.guild.id }); // Sadece bu sunucunun davetlerini çeker
        
        // Sadece sunucuda aktif olan ve total daveti olan kullanıcıları filtrele
        let filteredData = data.filter(x => message.guild.members.cache.get(x.userID) && x.total > 0);

        // Davet sayısına göre sıralama yap
        let sortedData = filteredData.sort((uye1, uye2) => {
            return uye2.total - uye1.total;
        });

        // İlk 20 davetçiyi listele
        let topTagli = sortedData.slice(0, 20).map((m, index) => {
            if(m.userID === message.member.id) findedIndex = index;

            return `\`${index + 1}.\` <@${m.userID}> toplam **${m.total}** üye davet etmiş. ${m.userID === message.member.id ? `**(Siz)**` : ``}`;
        }).join('\n');


        // Eğer kullanıcı ilk 20'de değilse ve listede varsa, onun sırasını ekle
        let userRank = "";
        let userIndex = sortedData.findIndex(x => x.userID === message.member.id);

        if (userIndex > 19) {
            let userData = sortedData[userIndex];
             userRank = `\n\n\`${userIndex + 1}.\` <@${userData.userID}> toplam **${userData.total}** üye davet etmiş. **(Siz)**`;
        } else if(userIndex === -1 && message.member.id) {
            userRank = `\n\nDavet veriniz bulunmamaktadır.`;
        }

        let description = `Aşağı da **${message.guild.name}** sunucusunun en iyi davet yapanların sıralaması belirtilmiştir.\n\n`;

        if (topTagli) {
            description += `${topTagli}${userRank}`;
        } else {
            // 'cevaplar' objesinin nereden geldiğini bilmediğim için, varsayılan bir yol kullandım.
            description = `Sunucuda davet verisi bulunmamaktadır.`; 
        }

        // V14 UYUMU: load.edit() kullanıldı.
        load.edit({
            content: null,
            embeds: [embed.setDescription(description)]
        }).then(x => {
            // V14 UYUMU: Message.delete() promis tabanlıdır, catch eklenmiştir.
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 20000);
        })


    }
};