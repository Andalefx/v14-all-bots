const { Message, AttachmentBuilder, ChannelType } = require("discord.js");
const Stats = require("../../../../Global/Databases/Client.Users.Stats");
const GUILD_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');
const Seens = require('../../../../Global/Databases/Guild.Users.Seens');
let tm = require('../../../../Global/Plugins/Time.Manager');

const veriler = new Map();
const verileriki = new Map();

/**
 * @param {Message} message 
 */
module.exports = async (message) => {
    // 1. Temel Filtreler ve Güvenlik Kontrolleri
    if (!message || !message.guild || message.author.bot || message.webhookId) return;
    
    // Prefix kontrolü (Eğer mesaj komutsa istatistiğe ekleme)
    if (global.sistem && global.sistem.botSettings && global.sistem.botSettings.Prefixs.some(x => message.content.startsWith(x))) return;

    // Cezalı/Kayıtsız Rol Kontrolleri (Güvenli kontrol)
    if (global.roller) {
        if (message.member.roles.cache.has(global.roller.jailRolü) || 
            message.member.roles.cache.has(global.roller.şüpheliRolü) || 
            message.member.roles.cache.has(global.roller.yasaklıTagRolü) || 
            (global.roller.kayıtsızRolleri && global.roller.kayıtsızRolleri.some(rol => message.member.roles.cache.has(rol)))) {
            return;
        }
    }

    const serverID = global.sistem?.SERVER?.ID || message.guild.id;

    // 2. Son Görülme ve Mesaj Kaydı (Async/Await)
    try {
        await Seens.updateOne({ userID: message.author.id }, {
            $set: {
                "lastSeen": Date.now(),
                "lastMessage": Date.now(),
                "last": {
                    type: "MESSAGE",
                    date: Date.now(),
                    channel: message.channel.id,
                    text: message.content ? message.content.slice(0, 1024) : "İçerik Bulunamadı!",
                }
            }
        }, { upsert: true });
    } catch (err) {
        console.error("Son görülme güncellenirken hata oluştu:", err);
    }

    // 3. Yetkili Puan Sistemi Detayları
    if (message.content && message.content.length >= 5 && global.kanallar && message.channel.id === global.kanallar.chatKanalı) {
        if (global._statSystem && global._statSystem.staffs && global._statSystem.staffs.some(x => message.member.roles.cache.has(x.rol))) {
            const veri = veriler.get(message.author.id);
            if (veri && (veri % 1) === 0) { 
                veriler.set(message.author.id, veri + 1);
                if (client.Upstaffs && client.Upstaffs.addPoint) {
                    await client.Upstaffs.addPoint(message.author.id, global._statSystem.points.message, "Mesaj").catch(() => {});
                }
            } else {
                veriler.set(message.author.id, veri ? veri + 1 : 1);
            }
        }
    }

    // 4. İstatistik ve Veritabanı Kayıt Bölümü (Modernize Edildi)
    try {
        let kanalID = message.channel.parentId || message.channel.id; 
        let data = await Stats.findOne({ guildID: serverID, userID: message.author.id });

        if (!data) {
            let voiceMap = new Map();
            let chatMap = new Map();
            let voiceCameraMap = new Map();
            let voiceStreamingMap = new Map();
            chatMap.set(kanalID, 1);
            
            data = new Stats({
                guildID: serverID,
                userID: message.author.id,
                messageLevel: 1,
                messageXP: 0,
                voiceLevel: 1,
                voiceXP: 0,
                voiceStats: voiceMap,
                taskVoiceStats: voiceMap,
                upstaffVoiceStats: voiceMap,
                voiceCameraStats: voiceCameraMap,
                voiceStreamingStats: voiceStreamingMap,    
                totalVoiceStats: 0,
                allVoice: {},
                allMessage: {},
                allCategory: {},
                chatStats: chatMap,
                upstaffChatStats: chatMap,
                totalChatStats: 1,
                lifeVoiceStats: voiceMap,
                lifeTotalVoiceStats: 0,
                lifeChatStats: chatMap,
                lifeTotalChatStats: 1,
            });
            await data.save();
        } else {
            let lastData = data.chatStats.get(kanalID) || 0;
            let lastLifeData = data.lifeChatStats.get(kanalID) || 0;
            let lastStaffData = data.upstaffChatStats.get(kanalID) || 0;
            
            data.totalChatStats = (data.totalChatStats || 0) + 1;
            data.lifeTotalChatStats = (data.lifeTotalChatStats || 0) + 1;
            data.chatStats.set(kanalID, Number(lastData) + 1);
            data.lifeChatStats.set(kanalID, Number(lastLifeData) + 1);
            
            // Seviye Sistemi Açık mı Kontrolü
            let datacikcik = await GUILD_SETTINGS.findOne({ guildID: serverID });
            let guildData = datacikcik ? datacikcik.Ayarlar : null;
            
            if (guildData && guildData.seviyeSistemi) {
                await messageXP(message.author.id, message, data);
            }
            
            // Yetkili Rol İstatistiği Kontrolü
            if (global._statSystem && global._statSystem.system && global._statSystem.staffs && global._statSystem.staffs.some(x => message.member.roles.cache.has(x.rol))) {
                data.upstaffChatStats.set(kanalID, Number(lastStaffData) + 1);
            }
            
            await data.save();
        }

        // Günlük İstatistik Tetikleyicisi
        await dayStatsUpdate(message.author.id, message.channel.id, serverID);

    } catch (error) {
        console.error("Mesaj istatistiği işlenirken hata oluştu:", error);
    }
};

// Günlük İstatistik Verisi Güncelleme Fonksiyonu
async function dayStatsUpdate(id, channel, serverID) {
    try {
        let days = await tm.getDay(serverID);
        let kanal = client.channels.cache.get(channel);
        
        if (kanal && global.kanallar && global.kanallar.chatKanalı && global.kanallar.chatKanalı === kanal.id) {
            let uye = kanal.guild.members.cache.get(id);
            if (uye && typeof uye.Leaders === 'function') {
                let veri = verileriki.get(id) || 0;
                if (veri >= 10) { 
                    uye.Leaders("chat", 0.10, { type: "MESSAGE", channel: kanal.id });
                    verileriki.delete(id);
                } else {
                    verileriki.set(id, veri + 1);
                }
            }
        }
        
        await Stats.updateOne(
            { userID: id, guildID: serverID }, 
            { $inc: { [`allMessage.${days}.${channel}`]: 1 } }
        );
    } catch (e) {
        console.error("dayStatsUpdate Hatası:", e);
    }
}

// Level XP Sistemi (Optimize ve Emniyetli)
async function messageXP(id, message, currentData) {
    try {
        let msgXp = [1, 2, 3, 4];
        let randomXP = msgXp[Math.floor(Math.random() * msgXp.length)];
        
        await Stats.updateOne({ guildID: message.guild.id, userID: id }, { $inc: { "messageXP": randomXP } }, { upsert: true });
        
        let _getStat = await Stats.findOne({ guildID: message.guild.id, userID: id });
        if (!_getStat) return;

        let yeniLevel = _getStat.messageLevel * 647;
        if (yeniLevel <= _getStat.messageXP) {
            
            await Stats.updateOne({ guildID: message.guild.id, userID: id }, { $set: { "messageXP": 0 }, $inc: { "messageLevel": 1 } }, { upsert: true });
        
            const { Canvas } = require('canvas-constructor');
            const { loadImage } = require('canvas');
            const path = require("path");
            
            // Çökme Emniyeti: Kullanıcının özel avatarı yoksa varsayılan resim atanır
            let avatarURL = message.author.displayAvatarURL({ extension: "jpg", forceStatic: true, size: 128 });
            const avatar = await loadImage(avatarURL).catch(() => null);
            
            // Arka plan resmi yolu projenize göre düzeltildi
            const bgPath = path.join(__dirname, '..', '..', 'Assets', 'img', 'seviye.png');
            const background = await loadImage(bgPath).catch(() => null);
                
            let xp = `${(_getStat.messageLevel + 1) * 879}`;
            const image = new Canvas(740, 128);
            
            if (background) image.printRoundedImage(background, 0, 0, 740, 128, 25);
            if (avatar) image.printRoundedImage(avatar, 621, 12, 105.5, 105.5, 10);
            
            image.setTextFont('14px Arial Black')
                .setColor("#fff")
                .printText(`+${(2500 * (_getStat.messageLevel + 1)).toLocaleString()} ${global.ayarlar?.serverName || 'Sunucu'} Parası`, 350, 70, 350)
                .setTextFont('14px Arial Black')
                .setColor("#fff")
                .printText(`+1 Değerli Altın`, 350, 105, 350);
                
            if (xp.toString().length > 4) { 
                image.setTextFont('16px Arial Black').setColor("#fff").printText(`${xp} XP`, 112, 115, 350);
            } else {
                image.setTextFont('16px Arial Black').setColor("#fff").printText(`${xp} XP`, 118, 115, 350);
            }
            
            if ((_getStat.messageLevel).toString().length == 1) {
                image.setTextFont('38px Arial Black').setColor("#fff").printText(`${_getStat.messageLevel}`, 53, 77, 350);
            } else {
                image.setTextFont('38px Arial Black').setColor("#fff").printText(`${_getStat.messageLevel}`, 40, 77, 350);
            }
            
            if ((_getStat.messageLevel + 1).toString().length == 1) {
                image.setTextFont('38px Arial Black').setColor("#fff").printText(`${_getStat.messageLevel + 1}`, 233, 77, 350);
            } else {
                image.setTextFont('38px Arial Black').setColor("#fff").printText(`${_getStat.messageLevel + 1}`, 220, 77, 350);
            }
            
            let attach = new AttachmentBuilder(image.toBuffer(), { name: "acar-seviye.png" });
            
            let replyMsg = await message.reply({
                content: `**Tebrikler!** ${message.member.user.tag}\nSohbet seviyeniz yükseldi ve ödülleri kaptınız.`,
                files: [attach]
            }).catch(() => null);

            if (replyMsg) {
                if (client.Economy && client.Economy.updateBalance) {
                    await client.Economy.updateBalance(message.author.id, Number(2500 * (_getStat.messageLevel + 1)), "add", 1).catch(() => {});
                    await client.Economy.updateBalance(message.author.id, Number(1), "add", 0).catch(() => {});  
                }
                replyMsg.react("998213747535523861").catch(() => {});
                setTimeout(() => {
                    replyMsg.delete().catch(() => {});
                }, 20000);
            }
        }
    } catch (e) {
        console.error("messageXP Hatası:", e);
    }
}

module.exports.config = {
    Event: "messageCreate"
};