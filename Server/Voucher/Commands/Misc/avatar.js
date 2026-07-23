const { Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    Isim: "avatar",
    Komut: ["av", "pp"],
    Kullanim: "avatar <@andale/ID>",
    Aciklama: "Belirtilen üyenin profil resmini büyültür.",
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
        let victim;

        // 1. Hedef Kullanıcıyı Belirleme (Sunucuda Olmayanları da Dahil Et)

        const mentionOrID = message.mentions.users.first() || client.users.cache.get(args[0]);
        
        if (mentionOrID) {
            victim = mentionOrID;
        } else if (args[0]) {
            // Argüman varsa ancak cache'te bulunamadıysa: ID ile direkt fetch etmeyi dene (Global User)
            try {
                victim = await client.users.fetch(args[0], { force: false });
            } catch (e) {
                // Geçersiz ID veya kullanıcı bulunamadı
                return message.reply({ content: "Geçersiz kullanıcı ID'si veya kullanıcı bulunamadı.", ephemeral: true });
            }
        } else {
            // Argüman yoksa komutu kullanan
            victim = message.author;
        }
        
        // Bu noktada `victim` her zaman bir Global User nesnesidir.
        
        // 2. Avatar URL'lerini Alma
        const globalAvatarURL = victim.displayAvatarURL({ dynamic: true, size: 2048, extension: 'png' });
        
        // Sunucu Avatarı Kontrolü (Sadece sunucuda olan üyeler için geçerlidir)
        const member = message.guild.members.cache.get(victim.id);
        const guildAvatarURL = member?.displayAvatarURL({ dynamic: true, size: 2048, extension: 'png' });
        
        // 3. Embed Oluşturma
        const embed = new EmbedBuilder()
            // Üye sunucudaysa rengini kullan, değilse veya renk yoksa mavi
            .setColor(member?.displayColor || victim.accentColor || "#0099FF") 
            .setAuthor({ name: `${victim.tag} Adlı Kullanıcının Avatarı`, iconURL: globalAvatarURL })
            .setImage(globalAvatarURL) // İlk olarak Global Avatarı göster
            .setFooter({ text: `Kullanıcı ID: ${victim.id}` })
            .setTimestamp();
            
        // 4. Düğmeleri Oluşturma
        const row = new ActionRowBuilder();
        
        // a) Global Avatar URL Düğmesi (Zorunlu)
        const globalButton = new ButtonBuilder()
            .setURL(globalAvatarURL)
            .setLabel(`Global Resim Adresi`)
            .setStyle(ButtonStyle.Link);
            
        row.addComponents(globalButton);

        // b) Sunucu Avatarı Düğmesi (Sunucuya özel avatarı varsa VE sunucuda ise)
        if (guildAvatarURL && guildAvatarURL !== globalAvatarURL && member) {
            embed.setDescription(`Bu kullanıcının hem **Sunucuya Özel** hem de **Global** avatarı bulunmaktadır.`);
            
            const guildButton = new ButtonBuilder()
                .setURL(guildAvatarURL)
                .setLabel(`Sunucu Resim Adresi`)
                .setStyle(ButtonStyle.Link);
                
            row.addComponents(guildButton);
        }

        // 5. Mesajı Gönderme
        await message.reply({ 
            embeds: [embed], 
            components: [row] 
        });
    }
};