const { Collection, Invite } = require('discord.js');

/**
 * Bu event, sunucudaki bir davet silindiğinde tetiklenir.
 *
 * @param {Invite} invite 
 */

module.exports = async (invite) => {
    // ⚠️ Kontrol: client objesinin globalde tanımlı olduğu varsayılmıştır.
    if (!global.client) return;

    // Davetlerin tam olarak güncellenmesi için kısa bir gecikme eklenir (5000ms'den 500ms'e düşürüldü, genellikle yeterlidir)
    await new Promise(resolve => setTimeout(resolve, 500)); 

    // Davet önbelleğini (cache) API'den çek ve güncelle
    try {
        // Davet silinse bile, API'den güncel listeyi çekmek için fetch kullanılır.
        const guildInvites = await invite.guild.invites.fetch();
        
        const cacheInvites = new Collection();
        
        // Güncel davet listesini Collection'a kaydet
        guildInvites.forEach((inv) => {
            // v14 yapısına uygun davet verisi kaydı
            cacheInvites.set(inv.code, { 
                code: inv.code, 
                uses: inv.uses, 
                inviter: inv.inviter // Davet eden kullanıcı nesnesi
            });
        });

        // client.invites'i yeni verilerle güncelle (client.invites'in globalde tanımlı olduğu varsayılır)
        client.invites.set(invite.guild.id, cacheInvites);
        
    } catch (error) {
        console.error(`Davet önbelleği güncellenirken hata oluştu (inviteDelete): ${error.message}`);
    }
}

module.exports.config = {
    Event: "inviteDelete"
}