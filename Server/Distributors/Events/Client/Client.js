const CronJob = require('cron').CronJob;
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');
const { PermissionsBitField } = require('discord.js'); // V14 için PermissionsBitField importu

module.exports = async () => {
    // Cron zamanlaması: '00 00 00 * * 1' -> Her Pazartesi (1) gece yarısı (00:00:00).
    let Aylık_systemcik = new CronJob('00 00 00 * * 1', async function() {
        let Data = await GUILDS_SETTINGS.findOne({ _id: 1 })
        let systemcik = Data.Ayarlar
        let guild = client.guilds.cache.get(sistem.SERVER.ID)
        
        // Sunucu ve ayar kontrolleri
        if(!systemcik.aylikUye) return;
        
        // Rol ayarlanmadıysa, ayarı kapat. (GUILD_SETTINGS yerine GUILDS_SETTINGS kullandım)
        if(systemcik.aylikUye && !systemcik.birAy) return await GUILDS_SETTINGS.updateOne({_id: 1}, {$set: {[`Ayarlar.aylikUye`]: false}}).catch(e => console.log(e));
        if(systemcik.aylikUye && systemcik.birAy && !guild.roles.cache.has(systemcik.birAy)) return await GUILDS_SETTINGS.updateOne({_id: 1}, {$set: {[`Ayarlar.aylikUye`]: false}}).catch(e => console.log(e));
        
        // Üyeleri filtrele: Bot olmayan, 30 günden eski, cezalı olmayan ve kayıtsız olmayan.
        // İzin kontrolü için V14'e uygun PermissionsBitField.Flags.Administrator kullanıldı.
        guild.members.cache.filter(x => 
            !x.user.bot && 
            Date.now() - x.joinedAt > 1000 * 60 * 60 * 24 * 30 && // 30 günden eski
            !x.permissions.has(PermissionsBitField.Flags.Administrator) && // Admin değil
            !x.roles.cache.has(roller.jailRolü) && 
            !x.roles.cache.has(roller.şüpheliRolü)  && 
            !x.roles.cache.has(roller.yasaklıTagRolü) && 
            !roller.kayıtsızRolleri.some(rol => x.roles.cache.has(rol)) // Kayıtsız değil
        ).forEach(async (uye) => {
            const joinedDays = (Date.now() - uye.joinedAt) / (1000 * 60 * 60 * 24);
            
            // 1 Ay Rolü (30 Gün)
            if(joinedDays > 30 && joinedDays < 90) { // 30 gün üstü, 90 gün altı
                if(!uye.roles.cache.has(systemcik.birAy)) await uye.roles.add(systemcik.birAy).catch(err => {});
            }
            
            // 3 Ay Rolü (90 Gün)
            if(joinedDays >= 90 && joinedDays < 180) { // 90 gün ve üstü, 180 gün altı
                if(uye.roles.cache.has(systemcik.birAy)) await uye.roles.remove(systemcik.birAy).catch(err => {});
                if(!uye.roles.cache.has(systemcik.ucAy)) await uye.roles.add(systemcik.ucAy).catch(err => {}); // systemcik.ucAy kullanıldı (roller.ucAy yerine)
            }
            
            // 6 Ay Rolü (180 Gün)
            if(joinedDays >= 180 && joinedDays < 270) { // 180 gün ve üstü, 270 gün altı
                if(uye.roles.cache.has(systemcik.ucAy)) await uye.roles.remove(systemcik.ucAy).catch(err => {});
                if(!uye.roles.cache.has(systemcik.altiAy)) await uye.roles.add(systemcik.altiAy).catch(err => {});
            }
            
            // 9 Ay Rolü (270 Gün)
            if(joinedDays >= 270 && joinedDays < 365) { // 270 gün ve üstü, 365 gün altı
                if(uye.roles.cache.has(systemcik.altiAy)) await uye.roles.remove(systemcik.altiAy).catch(err => {});
                if(!uye.roles.cache.has(systemcik.dokuzAy)) await uye.roles.add(systemcik.dokuzAy).catch(err => {});
            }
            
            // 1 Yıl Rolü (365 Gün)
            if(joinedDays >= 365) { // 365 gün ve üstü
                if(uye.roles.cache.has(systemcik.dokuzAy)) await uye.roles.remove(systemcik.dokuzAy).catch(err => {});
                if(!uye.roles.cache.has(systemcik.birYil)) await uye.roles.add(systemcik.birYil).catch(err => {});
            }
        }).catch(err => console.log("Üye döngüsünde hata:", err));
        
    }, null, true, 'Europe/Istanbul');

    Aylık_systemcik.start();
}
module.exports.config = {
    Event: "ready"
};