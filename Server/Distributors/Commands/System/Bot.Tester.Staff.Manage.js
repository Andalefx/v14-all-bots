const { 
    Client, 
    Message, 
    EmbedBuilder, // V14 için EmbedBuilder
    Util
} = require("discord.js");

// Varsayımlar: Global değişkenlerin ve Schemaların tanımlı olduğunu varsayıyoruz.
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings')
const { genEmbed } = require('../../../../Global/İnit/Embed')

// Emojiler ve sistem ayarları global değişkenlerden geliyor.
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 
const sistem = global.sistem || { SERVER: { ID: "SUNUCU_ID" }, botOwner: "317518644705755138" }; // Orijinal koddaki sabit ID'yi buraya taşıdım.
const botYetkiliID = "327236967265861633"; // Komutu kullanabilme yetkisi olan sabit ID (Orijinal koddaki kontrol)

module.exports = {
    Isim: "staff",
    Komut: ["tester","developer"],
    Kullanim: "staff [update] [@uye/ID]",
    Aciklama: "Bot yetkililerini yönetir ve listeler.",
    Kategori: "-",
    Extend: true,
    
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array<String>} args 
     */
    onRequest: async function (client, message, args) {
        
        // --- DM KONTROLÜ ---
        if (!message.guild || !message.member) return;

        // Emoji Erişimi için Güvenli Fonksiyon
        const getEmoji = (emojiName) => {
             const emoji = emojiler[emojiName];
             if (message.guild.emojis.cache.has(emoji)) {
                 return message.guild.emojis.cache.get(emoji).toString();
             }
             return emojiName === 'Onay' ? '✅' : '❌';
        }
        const getEmojiID = (emojiName) => {
             const emoji = emojiler[emojiName];
             if (message.guild.emojis.cache.has(emoji)) {
                 return message.guild.emojis.cache.get(emoji).id;
             }
             return undefined; 
        }

        // --- YETKİ KONTROLÜ (SADECE SABİT ID) ---
        if(message.member.id != botYetkiliID) return;
        
        let embed = new genEmbed();
        
        // Veri çekme
        let data = await GUILDS_SETTINGS.findOne({guildID: sistem.SERVER.ID});
        let ayar = data ? data.Ayarlar : { staff: [] };

        // --- GÜNCELLEME İŞLEMİ ---
        if(args[0] == "update") {
            let uye = message.mentions.members.first() || message.guild.members.cache.get(args[1]);
            
            if(!uye) return message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌');
            
            const unixTime = String(Date.now()).slice(0, 10);
            
            if(ayar.staff.includes(uye.id)) {
                // Kaldır
                await GUILDS_SETTINGS.updateOne({guildID: sistem.SERVER.ID}, {$pull: {"Ayarlar.staff": uye.id}}, {upsert: true});
                
                message.channel.send({
                    embeds: [
                        embed.setDescription(`${getEmoji('Onay')} Başarıyla ${uye} isimli üye, <t:${unixTime}:R> bottan **kaldırıldı**.`)]
                }).then(x => {
                    setTimeout(() => { x.delete().catch(err => {}) }, 7500);
                });
                message.react(getEmojiID('Onay') ? getEmojiID('Onay') : '✅');

            } else {
                // Ekle
                await GUILDS_SETTINGS.updateOne({guildID: sistem.SERVER.ID}, {$push: {"Ayarlar.staff": uye.id}}, {upsert: true});
                
                message.channel.send({
                    embeds: [
                        embed.setDescription(`${getEmoji('Onay')} Başarıyla ${uye} isimli üye, <t:${unixTime}:R> bot'a \`Tester\` olarak **eklendi**.`)]
                }).then(x => {
                    setTimeout(() => { x.delete().catch(err => {}) }, 7500);
                });
                message.react(getEmojiID('Onay') ? getEmojiID('Onay') : '✅');
            }
        } 
        
        // --- LİSTELEME İŞLEMİ ---
        else {
            embed.setColor("White"); // Orijinal kodda string "WHITE"

            const developerID = sistem.botOwner || "317518644705755138"; // Owner ID
            const developer = message.guild.members.cache.get(developerID) || developerID;
            
            const testerList = ayar.staff
                ? ayar.staff
                    .filter(x => x != developerID)
                    .map((id, index) => {
                        const member = message.guild.members.cache.get(id);
                        return `\` ${index + 1} \` ${member ? member : id}`;
                    }).join("\n")
                : `${getEmoji('Iptal')} Tester Bulunamadı.`;

            embed.setDescription(`🛠 Aşağıda bot yöneticileri listelenmiştir. Botların yönetiminden sorumludurlar, ayrıca botların güvenliğini sağlarlar.

\`\`\`fix
Bot Developer (Owner)\`\`\`\` 1 \` ${developer} (\`👑\`)

\`\`\`fix
Tester (all)\`\`\`${testerList}`);

            return message.channel.send({embeds: [embed]});
        }
    }
};