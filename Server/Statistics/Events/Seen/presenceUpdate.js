const { GuildMember, User, EmbedBuilder } = require("discord.js"); // V14 uyumlu importlar
const fs = require('fs');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Stats = require('../../../../Global/Databases/Client.Users.Stats');
const Seens = require('../../../../Global/Databases/Guild.Users.Seens');

// Main Export: presenceUpdate (Çevrimiçi/Çevrimdışı Takibi)
module.exports = async (oldPresence, newPresence) => {
    if(!newPresence) return;
    if(!newPresence.member) return;
    let uye = newPresence.guild.members.cache.get(newPresence.member.user.id) 
    if(!uye) return;
    // V14'te global.sistem.SERVER.ID kullanımı aynı kalmıştır.
    if(uye.guild.id != global.sistem.SERVER.ID) return; 
    
    // Çevrimdışı olma durumu
    if(uye && uye.presence && uye.presence.status == "offline") {
        await Seens.updateOne({userID: uye.id}, {$set: {"lastOffline": Date.now(),
        "last": {
            type: "OFFLINE",
            date: Date.now(),
        }}}, {upsert: true})
    } 
    // Çevrimiçi olma durumu (offline dışında herhangi bir durum)
    else if(uye && uye.presence && uye.presence.status != "offline") {
        await Seens.updateOne({userID: uye.id}, {$set: {"lastOnline": Date.now(), "lastSeen": Date.now(), "last": {
            type: "ONLINE",
            date: Date.now(),
        }}}, {upsert: true})
    }
}

module.exports.config = {
    Event: "presenceUpdate"
}


// userUpdate: Avatar ve Kullanıcı Adı Değişikliklerini Yönetir
client.on("userUpdate", async (oldUser, newUser) => {
    // Sadece sunucudaki üye ise işlem yap (opsiyonel ancak daha verimli)
    const guild = client.guilds.cache.get(global.sistem.SERVER.ID);
    if (!guild || !guild.members.cache.has(newUser.id)) return;
    
    // 1. Avatar Güncelleme Kontrolü
    if (oldUser.avatar !== newUser.avatar) {
        await Seens.updateOne({userID: newUser.id}, {$set: {
            "lastSeen": Date.now(),
            "lastAvatar": Date.now(),
            "last": {
                type: "AVATAR",
                date: Date.now(),
                new: newUser.avatarURL({dynamic: true}),
                old: oldUser.avatarURL({dynamic: true}),
            }
        }}, {upsert: true})
    }

    // 2. Kullanıcı Adı Güncelleme Kontrolü
    // V14'te hashtag'ler (discriminator) büyük ölçüde kaldırıldığı için sadece username kontrolü yapılır.
    // Orijinal koddaki userUsernameUpdate ve userDiscriminatorUpdate bu kontrol ile birleştirildi.
    if (oldUser.username !== newUser.username) {
        await Seens.updateOne({userID: newUser.id}, {$set: {
            "lastSeen": Date.now(),
            "lastUsername": Date.now(), // Hem kullanıcı adı hem de hashtag değişikliği için kullanılıyor
            "last": {
                type: "USERNAME",
                date: Date.now(),
                new: newUser.username,
                old: oldUser.username,
            }
        }}, {upsert: true})
    }
});


// voiceStateUpdate: Ses Kanalı Girişini Takip Eder
client.on("voiceStateUpdate", async (oldState, newState) => {
    // Sunucu kontrolü
    if(newState.guild.id != global.sistem.SERVER.ID) return;

    // Sadece kanala yeni katılımı (join) kontrol ediyoruz.
    // oldState.channelId boş VEYA oldState.channelId ve newState.channelId farklı (kanal değiştirme)
    if (newState.channelId && (!oldState.channelId || oldState.channelId !== newState.channelId)) {
        await Seens.updateOne({userID: newState.member.id}, {$set: {
            "lastSeen": Date.now(),
            "lastVoice": Date.now(),
            "last": {
                type: "VOICE",
                date: Date.now(),
                channel: newState.channelId,
            }
        }}, {upsert: true})
    }
});