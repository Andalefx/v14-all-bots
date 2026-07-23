const { Collection } = require('discord.js');
// Veritabanı şemaları (Değişmediği varsayılır)
const StatsSchema = require('../../../../Global/Databases/Client.Users.Stats');
const Upstaff = require('../../../../Global/Databases/Client.Users.Staffs');
const Tasks = require('../../../../Global/Databases/Client.Users.Tasks');

/**
 * Bu event, bot Discord'a başarıyla bağlandığında (hazır olduğunda) tetiklenir.
 *
 * @param { Client } client 
 */

module.exports = async () => {
    // ⚠️ Kontrol: client ve sistem objelerinin globalde tanımlı olduğu varsayılmıştır.
    if (!global.client || !global.sistem) return;
    
    // Sunucu ID'si ile Guild nesnesini al
    const guild = client.guilds.cache.get(sistem.SERVER.ID);
    
    // Sunucu bulunamazsa işlem yapma
    if (!guild) {
        return console.error(`[READY] Sunucu ID'si ${sistem.SERVER.ID} bulunamadı! Davet önbelleği başlatılamadı.`);
    }

    // --- DAVET ÖNBELLEĞİNİ BAŞLATMA ---
    try {
        // v14: invites.fetch() await gerektirir.
        const guildInvites = await guild.invites.fetch();
        
        const cacheInvites = new Collection();
        
        // Davet listesini döngüye al ve Collection'a kaydet
        guildInvites.forEach((inv) => {
             // v14 yapısına uygun davet verisi kaydı
            cacheInvites.set(inv.code, { 
                code: inv.code, 
                uses: inv.uses, 
                inviter: inv.inviter 
            });
        });

        // client.invites'i yeni verilerle başlat (client.invites'in globalde tanımlı olduğu varsayılır)
        client.invites.set(guild.id, cacheInvites);
        
        console.log(`[READY] Davet önbelleği başarıyla yüklendi. (${cacheInvites.size} adet davet kodu)`);

    } catch (error) {
        console.error(`[READY] Davet önbelleği yüklenirken hata oluştu: ${error.message}`);
    }
};

module.exports.config = {
    Event: "ready"
}