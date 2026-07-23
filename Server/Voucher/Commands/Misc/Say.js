const { Client, Message, EmbedBuilder, Guild } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "say",
    Komut: ["istatistik"],
    Kullanim: "say",
    Aciklama: "Sunucunun bütün verilerini gösterir",
    Kategori: "yönetim",
    Extend: true,
    
    onLoad: function (client) {
        // Bu bölüm boş kalabilir.
    },
    
    onRequest: async function (client, message, args, guild) {
        
        // Yetki Kontrolü
        const hasPermission = roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              message.member.permissions.has('Administrator');
                              
        if(!hasPermission) {
            return message.reply({content: cevaplar.noyt}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined)
        
        // --- ANDALE SAYI EMOJİSİ ÇEVİRİCİ FONKSİYON ---
        const emojiSayi = (num) => {
            const sayiYazilari = ["sifir", "bir", "iki", "uc", "dort", "bes", "alti", "yedi", "sekiz", "dokuz"];
            
            return num.toString().split("").map(rakam => {
                const index = parseInt(rakam);
                const emojiYazisi = sayiYazilari[index];
                
                // Sunucudan "andale_sifir", "andale_bir" vb. isimli emojiyi çeker
                // (Eğer emojilerinde Türkçe karakter varsa "uc" yerine "üç", "dort" yerine "dört" yapabilirsin)
                const emoji = message.guild.emojiGöster(`andale_${emojiYazisi}`);
                return emoji ? emoji : rakam; // Emoji bulunamazsa normal rakam yazar.
            }).join("");
        };
        // ----------------------------------------------

        // Ses kanallarındaki toplam üye sayısı (Botlar dahil)
        const totalVoiceMembers = message.guild.channels.cache
            .filter(channel => channel.type === 2) // GUILD_VOICE (2)
            .map(channel => channel.members.size)
            .reduce((a, b) => a + b, 0);

        // Ses kanallarındaki bot sayısı
        const totalVoiceBots = message.guild.members.cache.filter(x => x.user.bot && x.voice.channel).size;
        
        // Ses kanallarındaki toplam üye sayısı (Botlar hariç)
        const totalVoiceUsers = totalVoiceMembers - totalVoiceBots;

        // Aktif üye sayısı (Offline olmayanlar)
        const activeMembers = message.guild.members.cache.filter(m => m.presence && m.presence.status !== "offline").size;

        // Taglı üye sayısı
        const taggedMembers = message.guild.members.cache.filter(u => u.user.username.includes(ayarlar.tag)).size;

        // V14 Düzeltmesi: premiumTier artık sayı (0, 1, 2, 3) olarak döner.
        const premiumTierValue = message.guild.premiumTier;
        const tierMap = { 1: "1", 2: "2", 3: "3" };
        
        // Boost seviyesi formatlama
        const boostLevel = premiumTierValue > 0 
            ? `(\`${tierMap[premiumTierValue]}. Lvl\`)` 
            : `(0. Lvl)`;
        
        // Booster rolüne sahip üye sayısı
        const boosterRoleMembers = message.guild.roles.cache.get(roller.boosterRolü)?.members.size || 0;

        // Embed içeriği
        const embedDescription = `${message.guild.emojiGöster(emojiler.Tag)} Sunucumuzda **${emojiSayi(message.guild.memberCount)}** üye bulunmakta.
${message.guild.emojiGöster(emojiler.Tag)} Sunucumuzda **${emojiSayi(activeMembers)}** aktif üye bulunmakta. ${ayarlar.type ? `\n${message.guild.emojiGöster(emojiler.Tag)} Sunucumuzda **${emojiSayi(taggedMembers)}** taglı üye bulunmakta.` : ``}
${message.guild.emojiGöster(emojiler.Tag)} Sunucumuzu boostlayan **${emojiSayi(boosterRoleMembers)}** ${boostLevel} üye bulunmakta.
${message.guild.emojiGöster(emojiler.Tag)} Ses kanallarında **${emojiSayi(totalVoiceUsers)}** (\`+${totalVoiceBots} Bot\`) üye bulunmakta.`;
        
        // Embed Gönderme
        message.channel.send({embeds: [new genEmbed()
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setDescription(embedDescription)
        ]}).catch(err => {});
    }
};