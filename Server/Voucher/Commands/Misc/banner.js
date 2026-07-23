const { 
    Client, 
    Message, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require("discord.js");

module.exports = {
    Isim: "banner",
    Komut: ["arkaplan", "arkap" ],
    Kullanim: "banner <@andale/ID>",
    Aciklama: "Belirtilen üyenin arka plan resmini büyültür.",
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
        let targetUser;

        // 1. Hedef Kullanıcıyı Belirleme
        // message.mentions.users.first() -> Sunucuda/cache'te olanları bulur
        // client.users.cache.get(args[0]) -> Cache'te ID ile bulur
        // Hiçbiri yoksa komutu kullananı al
        const mentionOrID = message.mentions.users.first() || client.users.cache.get(args[0]);
        
        if (mentionOrID) {
            targetUser = mentionOrID;
        } else if (args[0]) {
            // Argüman varsa, ancak cache'te bulunamadıysa: ID ile direkt fetch etmeyi dene.
            try {
                targetUser = await client.users.fetch(args[0], { force: false });
            } catch (e) {
                // Fetch başarısız olursa (geçersiz ID)
                return message.reply({ content: "Geçersiz kullanıcı ID'si veya kullanıcı bulunamadı.", ephemeral: true });
            }
        } else {
            // Argüman yoksa komutu kullanan
            targetUser = message.author;
        }


        // 2. Kullanıcının Tam Verisini Çekme (Banner için zorunlu)
        // Kullanıcının banner verisini çekmek için Global User nesnesi üzerinden fetch kullanılır.
        let userProfile;
        try {
            userProfile = await targetUser.fetch({ force: true });
        } catch (error) {
            console.error(`[BANNER HATA] Kullanıcı verisi çekilemedi: ${error.message}`);
            return message.reply({ content: "Kullanıcı bilgileri (banner) alınırken bir hata oluştu.", ephemeral: true });
        }
        
        // 3. Banner URL'sini Alma ve Kontrol Etme
        const bannerURL = userProfile.bannerURL({ dynamic: true, size: 4096, extension: 'png' });

        if (!bannerURL) {
            return message.reply({ content: `**${userProfile.tag}** adlı kullanıcının ayarlanmış bir **Global Profil Afişi** bulunmamaktadır. 🖼️` });
        }

        // 4. Embed ve Bileşenleri Oluşturma
        
        // Renk için kullanıcının global profil rengini kullan (en doğru renk bu olacaktır)
        const embedColor = userProfile.hexAccentColor || "#0099FF"; 
        
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({ name: `${userProfile.tag} Profil Afişi`, iconURL: userProfile.displayAvatarURL() })
            .setImage(bannerURL) 
            .setFooter({ text: `Kullanıcı ID: ${userProfile.id}` })
            .setTimestamp();
            
        const row = new ActionRowBuilder();
        
        const bannerButton = new ButtonBuilder()
            .setURL(bannerURL)
            .setLabel(`Resim Adresi (4096px)`)
            .setStyle(ButtonStyle.Link);
            
        row.addComponents(bannerButton);

        // 5. Mesajı Gönderme
        await message.reply({ 
            embeds: [embed], 
            components: [row] 
        });
    }
};