const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require('../../../../Global/İnit/Embed');
const { GuildMember } = require('discord.js');

/**
 * Bu event, bir üye sunucuya takviye yaptığında (Boost) tetiklenir (Özel event olduğu varsayılır).
 *
 * @param {GuildMember} member
 */

module.exports = async (member) => {
    // ⚠️ Kontrol: client objesinin globalde tanımlı olduğu varsayılır.
    if (!global.client) return;

    // client.Economy.updateBalance metodunun globalde tanımlı olduğu varsayılır.
    await client.Economy.updateBalance(member.id, 1, "add", 0).catch(err => {
        console.error(`[BOOST] ${member.user.tag} üyesine altın eklenirken hata oluştu: ${err.message}`);
    });

    // Chat kanalını bul
    // kanallar.chatKanalı'nın globalde tanımlı olduğu varsayılır.
    const kanalBul = member.guild.kanalBul(global.kanallar.chatKanalı); 
    
    if (kanalBul) {
        // Kanal listesi için filtreleme yap
        const rolKanalları = member.guild.channels.cache
            .filter(x => !x.name.includes("log") && (x.name.includes("rol-al") || x.name.includes("rol-alma")))
            .map(x => x); // Haritalamayı sadeleştirdik

        // Mesajı gönder
        kanalBul.send({
            content: `${member}, Sunucumuza takviye yaptığınız için teşekkür ederiz.
Bizde sana ufak bir hediye vermek istedik. **+1 Altın**
Ayrıca sunucumuzda bulunan ${rolKanalları.length > 0 ? rolKanalları.join(", ") : "ilgili"} kanallarına göz atmayı unutma.`
        }).then(x => {
            // Mesajı otomatik sil
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 7500);
        }).catch(err => {
            console.error(`[BOOST] Chat kanalına mesaj gönderilemedi: ${err.message}`);
        });
    }
}

module.exports.config = {
    Event: "guildMemberBoost"
}