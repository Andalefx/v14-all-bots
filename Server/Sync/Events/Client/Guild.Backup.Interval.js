// Gerekli bağımlılıkları yükleyin
const { guildBackup } = require('../../../../Global/İnit/Guild.Backup');

// Cron zamanlayıcıyı veya uzun süreli aralığı yönetecek fonksiyon
const backupScheduler = async () => {
    // 1 saat (1000 milisaniye * 60 saniye * 60 dakika * 1 saat)
    const INTERVAL_TIME = 1000 * 60 * 60 * 1; 

    // setInterval'ı başlat
    setInterval(async () => {
        try {
            console.log(`[BACKUP] Sunucu Rol ve Kanal Yedekleme Başlatıldı...`);
            
            // Rolleri yedekle
            await guildBackup.guildRoles();
            
            // Kanalları yedekle
            await guildBackup.guildChannels();
            
            console.log(`[BACKUP] Yedekleme Başarıyla Tamamlandı.`);
        } catch (error) {
            console.error('[BACKUP HATA] Yedekleme işlemi sırasında bir hata oluştu:', error);
        }
    }, INTERVAL_TIME);
}

// Ana Modül Dışa Aktarımı
module.exports = backupScheduler;

// Olay Yapılandırması (Botun ready event'inde çalışacak)
module.exports.config = {
    name: "autoBackup", // Olay/Komut adı, isteğe bağlı
    Event: "ready" // Bot hazır olduğunda çalıştırılacak
};