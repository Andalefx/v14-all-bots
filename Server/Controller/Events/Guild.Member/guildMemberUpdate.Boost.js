const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require('../../../../Global/İnit/Embed');
const { GuildMember } = require('discord.js');

/**
 * Bu event, bir üyenin bilgileri (roller, nickname vb.) güncellendiğinde tetiklenir.
 * Boost çekme kontrolü bu event içinde yapılır.
 *
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */

module.exports = async (oldMember, newMember) => {
    // Botun sadece belirlenen sunucuda çalışmasını sağla
    if (!global.sistem || newMember.guild.id !== sistem.SERVER.ID) return;
    
    // roller ve ayarlar değişkenlerinin globalden erişilebilir olduğu varsayılır.
    if (!global.roller || !global.ayarlar) return;
    
    // Sadece boost rolü çekilmişse işlem yap (Boost rolü daha önce vardı, şimdi yok)
    if (oldMember.roles.cache.has(roller.boosterRolü) && !newMember.roles.cache.has(roller.boosterRolü)) {
        
        // Kurucu rolüne sahipse işlemi atla
        if (roller.kurucuRolleri.some(x => newMember.roles.cache.has(x))) return;

        try {
            // MongoDB sorgusu callback yerine async/await ile yapıldı (v14 için önerilen yapı)
            const UserData = await Users.findOne({ _id: newMember.id });
            
            const user = newMember;
            const guild = newMember.guild;
            const kanalcik = guild.kanalBul(global.kanallar.chatKanalı); // global.kanallar'dan çekildi

            // --- İsim Düzeltme Yardımcı Fonksiyonu ---
            const setNickname = async (member, template) => {
                if (!member || !member.manageable) return;
                
                let newNickname = template;
                let tagPrefix = ayarlar.type ? (member.user.username.includes(ayarlar.tag) ? ayarlar.tag : (ayarlar.tagsiz ? ayarlar.tagsiz : (ayarlar.tag || ""))) : "";

                if (newNickname === "İsim | Yaş") {
                    newNickname = ayarlar.type ? `${tagPrefix} İsim | Yaş` : `İsim | Yaş`;
                } else if (newNickname === "Kayıtsız") {
                    newNickname = ayarlar.type ? `${tagPrefix} Kayıtsız` : `Kayıtsız`;
                } else if (UserData && UserData.Name) {
                    newNickname = ayarlar.type ? `${tagPrefix} ${UserData.Name}` : UserData.Name;
                }
                
                // Kayıtsız tag prefix'i (Nickname'i "Kayıtsız" şablonuna göre ayarla)
                if (newNickname.includes("Kayıtsız") || newNickname.includes("İsim | Yaş")) {
                     const kayitsizPrefix = user.user.username.includes(ayarlar.tag) ? ayarlar.tag : (ayarlar.tagsiz ? ayarlar.tagsiz : (ayarlar.tag || ""));
                     if (ayarlar.type) newNickname = `${kayitsizPrefix} ${newNickname.replace(kayitsizPrefix, '').trim()}`;
                }
                
                await member.setNickname(newNickname).catch(err => {});
            };
            
            // --- Ana İşlem Mantığı ---

            // 1. Taglı Alım Açık VE Tag Yoksa -> Kayıtsıza At
            if (ayarlar.taglıalım && !user.user.username.includes(ayarlar.tag)) {
                if(kanalcik) kanalcik.send({embeds: [new genEmbed().setColor("#df2f8f").setDescription(`${user} üyesinin takviyesi çekildiğinden dolayı kayıtsız'a atıldı!`)]}).catch(err => {});
                
                await user.voice.disconnect().catch(err => {});
                
                // Nickname'i kayıtsız şablonuna göre ayarla
                const nickTemplate = ayarlar.isimyas ? "İsim | Yaş" : "Kayıtsız";
                await setNickname(user, nickTemplate);
                
                // Kayıtsız rolünü ver
                return await user.setRoles(roller.kayıtsızRolleri).catch(err => {});
            }
            
            // 2. Taglı Alım Açık VE Tag Var VE Kayıtlı Veri Varsa -> İsim Düzelt
            if (ayarlar.taglıalım && user.user.username.includes(ayarlar.tag) && UserData && UserData.Name && UserData.Names && UserData.Gender) {
                if(kanalcik) kanalcik.send({embeds: [new genEmbed().setColor("#df2f8f").setDescription(`${user} üyesinin takviyesi çekildiğinden dolayı isim ve yaşı düzeltildi.`)]}).catch(err => {});
                
                // Kayıtlı isme göre nickname'i düzelt
                await setNickname(user, UserData.Name);
            }
            
            // 3. Taglı Alım Açık VE Tag Var VE Kayıtlı Veri Yoksa -> Kayıtsız Şablonu
            if (ayarlar.taglıalım && user.user.username.includes(ayarlar.tag) && !UserData) {
                const nickTemplate = ayarlar.isimyas ? "İsim | Yaş" : "Kayıtsız";
                await setNickname(user, nickTemplate);
            }
            
            // 4. Taglı Alım Kapalı VE Kayıtlı Veri Varsa -> İsim Düzelt
            if (!ayarlar.taglıalım && UserData && UserData.Name && UserData.Names && UserData.Gender) {
                if(kanalcik) kanalcik.send({embeds: [new genEmbed().setColor("#df2f8f").setDescription(`${user} üyesinin takviyesi çekildiğinden dolayı isim ve yaşı düzeltildi.`)]}).catch(err => {});
                
                // Kayıtlı isme göre nickname'i düzelt
                await setNickname(user, UserData.Name);
            }

            // 5. Taglı Alım Kapalı VE Kayıtlı Veri Yoksa -> Kayıtsız Şablonu
            if (!ayarlar.taglıalım && !UserData) {
                const nickTemplate = ayarlar.isimyas ? "İsim | Yaş" : "Kayıtsız";
                await setNickname(user, nickTemplate);
            }

        } catch (error) {
            client.logger.log(`Boost çekildiğinde isim düzeltilmesinde sorun oluştu: ${error.message}`,"error");
        }
    }
}

module.exports.config = {
    Event: "guildMemberUpdate"
}