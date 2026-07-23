const { Client, Message, EmbedBuilder } = require("discord.js"); // V14: MessageEmbed yerine EmbedBuilder
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Invite = require('../../../../Global/Databases/Global.Guild.Invites');

// NOT: 'ayarlar' değişkeninin Settings dosyasından geldiği varsayılmıştır.


module.exports = {
    Isim: "invite",
    Komut: ["davet","davetlerim"],
    Kullanim: "invite <@andale/ID>",
    Aciklama: "Belirtilen üye veya komutu kullanan üyenin davet bilgilerini görüntüler.",
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
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member
    const data = await Invite.findOne({ guildID: message.guild.id, userID: member.user.id });
    
    // Veri Kontrolleri
    const total = data?.total || 0;
    const regular = data?.regular || 0;
    const bonus = data?.bonus || 0;
    const leave = data?.leave || 0;
    const fake = data?.fake || 0;
    
    // Davet edilen üyeleri çekme
    const invMember = await Invite.find({ Inviter: member.user.id });
    
    // Davet ettiği kişilerin kullanıcı nesnelerini alma ve ilk 7'yi listeleme
    const bazıları = invMember ? invMember
        .filter(value => message.guild.members.cache.get(value.userID))
        .slice(0, 7)
        .map((value, index) => message.guild.members.cache.get(value.userID))
        .join(", ") : undefined

    // Günlük (24 saatten az sürede katılanlar)
    const daily = invMember ? message.guild.members.cache.filter((usr) => 
        invMember.some((x) => x.userID === usr.user.id) && Date.now() - usr.joinedTimestamp < 1000 * 60 * 60 * 24
    ).size : 0;
    
    // Haftalık (7 günden az sürede katılanlar)
    const weekly = invMember ? message.guild.members.cache.filter((usr) => 
        invMember.some((x) => x.userID === usr.user.id) && Date.now() - usr.joinedTimestamp < 1000 * 60 * 60 * 24 * 7
    ).size : 0;
    
    // Taglı olanlar (ayarlar.tag içerenler)
    const tagged = invMember ? message.guild.members.cache.filter((usr) => 
        invMember.some((x) => x.userID === usr.user.id) && usr.user.username.includes(ayarlar.tag)
    ).size : 0;
    
    // Embed'i oluşturma
    let descriptionText = `${member} isimli üye toplam **${total + bonus}** (**Bonus**: \` +${bonus} \`) davete sahip. `
    descriptionText += `(**${regular}** giren, ${ayarlar.type ? ` **${tagged}** taglı, ` : ``}**${leave}** ayrılmış, **${fake}** sahte, **${daily}** günlük, **${weekly}** haftalık)\n\n`
    descriptionText += `${bazıları ? `Davet ettiği bazı kişiler: ${bazıları}` : 'Davet ettiği kimse bulunamadı.'}`;

    // V14 UYUMU: setAuthor ve displayAvatarURL
    message.channel.send({
      embeds: [new genEmbed()
        .setAuthor({ 
            name: member.user.username, 
            iconURL: member.user.displayAvatarURL({ forceStatic: false }) // V14 UYUMU
        })
        .setDescription(descriptionText)]
    });

    }
};