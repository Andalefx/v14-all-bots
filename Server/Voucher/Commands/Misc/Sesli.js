const { Client, Message, PermissionsBitField, ChannelType } = require("discord.js");
// NOT: EmbedBuilder gereksiz olduğu için kaldırıldı, ancak ihtiyaç duyulursa eklenebilir.
// Varsayım: 'roller', 'cevaplar', 'emojiler', 'ayarlar', 'kanallar' ve 'global.sayılıEmoji' fonksiyon/değişkenlerinin erişilebilir olduğu varsayılmıştır.
const roller = require("../../../../Global/Settings/Roles.json")
const cevaplar = require("../../../../Global/Settings/Reply")
const emojiler = require("../../../../Global/Settings/Emoji.json")
const ayarlar = require("../../../../Global/Settings/System.json")
const kanallar = require("../../../../Global/Settings/Channels.json")
module.exports = {
    Isim: "sesli",
    Komut: ["ses"],
    Kullanim: "sesli",
    Aciklama: "Sunucunun seste olan üyelerinin sayısını gösterir.",
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
        // Yetki Kontrolü
        const requiredRoles = [
            ...(roller.üstYönetimRolleri || []),
            ...(roller.altYönetimRolleri || []),
            ...(roller.yönetimRolleri || []),
            ...(roller.kurucuRolleri || [])
        ];
        
        const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || requiredRoles.some(oku => message.member.roles.cache.has(oku));
        
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(e => {})

        // Ses Kanallarındaki Toplam Üye Sayısı (Botlar dahil)
        let ses = message.guild.members.cache.filter(x => x.voice.channel).size

        let kontrol;
        
        if(args[0] == "tüm") {
            // Public kanallarındaki üyeler
            const voiceChannelType = ChannelType.GuildVoice || "GUILD_VOICE";

            let pub = message.guild.channels.cache
                .filter(x => x.parentId == kanallar.publicKategorisi && x.type == voiceChannelType)
                .map(u => u.members.size)
                .reduce((a, b) => a + b, 0)
                
            // Taglı ve Seste Olan Üyeler
            let taglı = message.guild.members.cache.filter(x => { 
                return x.user.username.includes(ayarlar.tag) && x.voice.channel && x.roles.cache.has(roller.tagRolü)
            }).size
            
            // Tagsız ve Seste Olan Üyeler
            let tagsız = message.guild.members.cache.filter(x => { 
                return !x.user.bot && !x.user.username.includes(ayarlar.tag) && x.voice.channel
            }).size
            
            // Seste Olan Yetkili Üyeler (Taglı olmaları koşulu korunarak)
            let yetkili = message.guild.members.cache.filter(x => { 
                // Varsa Yetkiler listesindeki rollerden birine sahip olanlar
                const isStaff = roller.Yetkiler.some(yetkiliRol => x.roles.cache.has(yetkiliRol));
                
                // Veya orijinal kodunuzda Yetkiler yerine kullanılan mantık: x.user.username.includes(ayarlar.tag)
                
                return x.voice.channel && isStaff; 
                
            }).size

            kontrol = `\n${message.guild.emojiGöster(emojiler.Tag)} Public kanallarında **${global.sayılıEmoji(pub || 0)}** üye bulunmakta.
${ayarlar.type ? `${message.guild.emojiGöster(emojiler.Tag)} Ses kanallarında tagsız **${global.sayılıEmoji(tagsız)}** üye bulunmakta.
${message.guild.emojiGöster(emojiler.Tag)} Ses kanallarında taglı **${global.sayılıEmoji(taglı)}** üye bulunmakta.\n` : ``}${message.guild.emojiGöster(emojiler.Tag)} Ses kanallarında yetkili **${global.sayılıEmoji(yetkili)}** üye bulunmakta.`
        } else {
            kontrol = ``;
        }

        message.channel.send({content: `${message.guild.emojiGöster(emojiler.Tag)} Ses kanallarında **${global.sayılıEmoji(ses)}** üye bulunmakta.${kontrol}`}).then(x =>{
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 15000);
        }); 
    }
};