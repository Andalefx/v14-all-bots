const { Client, Message, EmbedBuilder, PermissionsBitField, Guild } = require("discord.js");
// V14: MessageEmbed yerine EmbedBuilder ve PermissionsBitField kullanıldı.
const { genEmbed } = require("../../../../Global/İnit/Embed");
// Varsayım: 'roller', 'cevaplar' ve 'emojiler' değişkenlerinin erişilebilir olduğu varsayılmıştır.
const roller = global.roller || require("../../../../Global/Settings/Roles.json"); 
const cevaplar = global.cevaplar || require("../../../../Global/Settings/Reply"); 
const emojiler = global.emojiler || require("../../../../Global/Settings/Emoji.json");
module.exports = {
    Isim: "kilit",
    Komut: ["chatkilit", "kitle"],
    Kullanim: "kilit @andale/ID",
    Aciklama: "Komutun kullanıldığı metin kanalına yazmayı engeller.",
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
   * @param {Guild} guild
   */
  onRequest: async function (client, message, args, guild) {
        // genEmbed'in EmbedBuilder döndürdüğü varsayılmıştır.
        let embed = new genEmbed();
        
        // Yetki Kontrolü
        const requiredPermissions = [
            ...(roller.kurucuRolleri || []),
        ];
        
        const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || requiredPermissions.some(oku => message.member.roles.cache.has(oku));
        
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));

        let everyone = message.guild.roles.cache.find(a => a.name === "@everyone");
        
        // Kanalın herkes için "Yazma" iznini kontrol et (SEND_MESSAGES)
        // V14: message.channel.permissionsFor(everyone) kullanılır.
        const currentPerms = message.channel.permissionsFor(everyone);
        const isLocked = !currentPerms.has(PermissionsBitField.Flags.SendMessages);

        if (isLocked) { // Eğer kilitliyse (yani SEND_MESSAGES izni KAPALIYSA), aç.
             // V14: İzin düzenleme, izin enum'ları kullanılır.
            await message.channel.permissionOverwrites.edit(everyone.id, { 
                SendMessages: true 
            }).catch(e => {
                console.error("Kilit açılırken hata:", e);
                return message.reply(`Hata: Kanal kilidi açılırken bir sorun oluştu.`).catch(e => {});
            });

            await message.channel.send({ 
                embeds: [embed.setDescription(`${(emojiler.green)} \`#${message.channel.name}\` isimli metin kanalına yazmanız **açıldı**.`)] 
            });
            
        } else { // Eğer açıksa (yani SEND_MESSAGES izni AÇIKSA), kilitle.
            
            // V14: İzin düzenleme
            await message.channel.permissionOverwrites.edit(everyone.id, { 
                SendMessages: false 
            }).catch(e => {
                console.error("Kilitlenirken hata:", e);
                return message.reply(`Hata: Kanal kilitlenirken bir sorun oluştu.`).catch(e => {});
            });

            await message.channel.send({ 
                embeds: [embed.setDescription(`${(emojiler.red)} \`#${message.channel.name}\` isimli metin kanalına yazmanız **kapatıldı**.`)] 
            });
        };
    }
};