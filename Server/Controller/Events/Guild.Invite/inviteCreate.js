const { Collection, Invite } = require('discord.js');

/**
 * Bu event, sunucuda yeni bir davet oluşturulduğunda tetiklenir.
 *
 * @param {Invite} invite 
 */

module.exports = async (invite) => {
    // ⚠️ Kontrol: client objesinin globalde tanımlı olduğu varsayılmıştır.
    if (!global.client) return;

    // Davet önbelleğini (cache) API'den çek ve güncelle
    try {
        // v14: fetch() artık await ile doğrudan kullanılabilir.
        const guildInvites = await invite.guild.invites.fetch();
        
        const cacheInvites = new Collection();
        
        // Yeni davet listesini Collection'a kaydet
        guildInvites.forEach((inv) => {
            // v14: Davet nesnesinde 'inviter' özelliği doğrudan mevcuttur.
            cacheInvites.set(inv.code, { 
                code: inv.code, 
                uses: inv.uses, 
                inviter: inv.inviter // Davet eden kullanıcı nesnesi
            });
        });

        // client.invites'i yeni verilerle güncelle (client.invites'in globalde tanımlı olduğu varsayılır)
        client.invites.set(invite.guild.id, cacheInvites);
        
    } catch (error) {
        console.error(`Davet önbelleği güncellenirken hata oluştu (inviteCreate): ${error.message}`);
    }
}

module.exports.config  = {
    Event: "inviteCreate"
}