const { VoiceState, ChannelType, Client } = require("discord.js");
const voiceAfks = new Map();
const streamerAfks = new Map();
const ms = require('ms');
const sure = "10m"
const streamersure = "15m"
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');

// Not: client objesi global kapsamda (örneğin index.js'te) tanımlanmış olmalıdır.
// Global sistem ve kanallar objelerine erişim varsayılmıştır.

// -------------------------------------------------------------------------------- //
// voiceStateUpdate Olayı (Client Listener) - Streamer Kategori Kontrolü
// -------------------------------------------------------------------------------- //
client.on("voiceStateUpdate", async (oldState, newState) => {
    // Mesaj objesi üzerinden client'a erişim
    const client = newState.client || oldState.client; 
    
    let _findServer = await GUILDS_SETTINGS.findOne({ guildID: sistem.SERVER.ID })
    ayarlar = _findServer.Ayarlar
    let ayar = ayarlar.otomatikSleep || false
    if(!ayar) return;
    
    let member = oldState.member || newState.member;
    if(!member || member.user.bot || !ayarlar || !kanallar.streamerKategorisi) return;

    // Kanal değişimi: Ses kanalından tamamen ayrılma durumunda Map'ten sil
    if(oldState.channelId && !newState.channelId) {
        if(streamerAfks.get(member.id)) await streamerAfks.delete(member.id)
        return;
    }
    
    // Ses kanalına girme veya kanalda kalma
    if(!newState.channelId) return await streamerAfks.delete(member.id);
    
    // Sadece Streamer Kategorisindeki kanalları kontrol et
    if(member.guild.channels.cache.get(newState.channelId)?.parentId != kanallar.streamerKategorisi) return;
    
    // AFK Kuralı: Hem sağır hem de susturulmuşsa zamanlayıcıyı başlat
    if(member.voice.selfDeaf && member.voice.selfMute) {
             streamerAfks.set(member.id, { channel: newState.channelId, date: Date.now()+ms(streamersure) })
    } else {
         await streamerAfks.delete(member.id)
    } 
})

// -------------------------------------------------------------------------------- //
// voiceStateUpdate Olayı (Module Export) - Public Kategori Kontrolü
// -------------------------------------------------------------------------------- //
/**
 * @param {VoiceState} oldState 
 * @param {VoiceState} newState 
 */
module.exports = async (oldState, newState) => {
    // Mesaj objesi üzerinden client'a erişim
    const client = newState.client || oldState.client; 
    
    let _findServer = await GUILDS_SETTINGS.findOne({ guildID: sistem.SERVER.ID })
    ayarlar = _findServer.Ayarlar
    let ayar = ayarlar.otomatikSleep || false
    if(!ayar) return;
    
    let member = oldState.member || newState.member;
    if(!member || member.user.bot || !ayarlar || !kanallar.sleepRoom || !kanallar.publicKategorisi) return;
    
    // Kanal değişimi: Ses kanalından tamamen ayrılma durumunda Map'ten sil
    if(oldState.channelId && !newState.channelId) {
        if(voiceAfks.get(member.id)) await voiceAfks.delete(member.id)
        return;
    }

    // Ses kanalına girme veya kanalda kalma
    if(!newState.channelId) return await voiceAfks.delete(member.id);
    
    // Sadece Public Kategorisindeki kanalları kontrol et
    if(member.guild.channels.cache.get(newState.channelId)?.parentId != kanallar.publicKategorisi) return;
    
    // Müzik odaları kontrolü (Müzik odalarındaki AFK durumu iptal edilir)
    if(kanallar.musicRooms && kanallar.musicRooms.some(x => x == newState.channelId)) {
        if(voiceAfks.get(member.id)) await voiceAfks.delete(member.id)
        return;
    };
    
    // AFK Kuralı: Sağır VEYA susturulmuşsa zamanlayıcıyı başlat
    if(member.voice.selfDeaf || member.voice.selfMute) {
             voiceAfks.set(member.id, { channel: newState.channelId, date: Date.now()+ms(sure) })
    } else {
         await voiceAfks.delete(member.id)
    } 
}

module.exports.config = {
    Event: "voiceStateUpdate"
}

// -------------------------------------------------------------------------------- //
// ready Olayı ve Interval Fonksiyonları
// -------------------------------------------------------------------------------- //
client.on("ready", async () => {
    // Client'a erişim
    const client = global.client;

    let _findServer = await GUILDS_SETTINGS.findOne({ guildID: sistem.SERVER.ID })
    ayarlar = _findServer.Ayarlar
    let ayar = ayarlar.otomatikSleep || false
    if(!ayar) return;
    
    let guild = client.guilds.cache.get(global.sistem.SERVER.ID)
    if(!guild || !ayarlar || !kanallar.sleepRoom || !kanallar.publicKategorisi || !kanallar.streamerKategorisi) return;
    
    // STREAMER KATEGORİSİ İÇİN AFK KONTROLÜ
    guild.channels.cache.filter(e => 
        e.type == ChannelType.Voice && // V14: "GUILD_VOICE" yerine
        e.members.size > 0 &&
        e.parentId == kanallar.streamerKategorisi).forEach(channel => {
        channel.members.filter(member => !member.user.bot && member.voice.selfDeaf && member.voice.selfMute).forEach(async (member) => {
             if(!streamerAfks.get(member.id)) return streamerAfks.set(member.id, { channel: channel.id, date: Date.now()+ms(streamersure) });
        })
    }) 
    
    // PUBLIC KATEGORİSİ İÇİN AFK KONTROLÜ
    guild.channels.cache.filter(e => 
        e.type == ChannelType.Voice && // V14: "GUILD_VOICE" yerine
        e.members.size > 0 &&
        e.parentId == kanallar.publicKategorisi &&
        e.id != kanallar.sleepRoom &&
        kanallar.musicRooms.some(x => e.id != x)).forEach(channel => {
        channel.members.filter(member => !member.user.bot && (member.voice.selfDeaf || member.voice.selfMute)).forEach(async (member) => {
         
             if(!voiceAfks.get(member.id)) return voiceAfks.set(member.id, { channel: channel.id, date: Date.now()+ms(sure) });
        })
    }) 

    setInterval(() => {
        checkAfk()
        checkStreamer()
    }, 20000);
});


async function checkStreamer() {
    // Client'a erişim
    const client = global.client; 
    
    let _findServer = await GUILDS_SETTINGS.findOne({ guildID: sistem.SERVER.ID })
    ayarlar = _findServer.Ayarlar
    let ayar = ayarlar.otomatikSleep || false
    if(!ayar) return;
    
    let guild = client.guilds.cache.get(global.sistem.SERVER.ID)
    if(!guild || !ayarlar || !kanallar.sleepRoom || !kanallar.streamerKategorisi) return;
    
    guild.channels.cache.filter(e => 
        e.type == ChannelType.Voice && // V14: "GUILD_VOICE" yerine
        e.members.size > 0 &&
        e.parentId == kanallar.streamerKategorisi).forEach(channel => {
        channel.members.filter(member => !member.user.bot && streamerAfks.get(member.id)).forEach(async (member) => {
                 let data = streamerAfks.get(member.id);
                      if(data && Date.now() >= data.date) {
                          await streamerAfks.delete(member.id);
                          if(member) member.send({content: `**${channel.name}** sohbet kanalında afk olduğunu fark ettik.
Seni otomatik olarak "**${member.guild.channels.cache.get(kanallar.sleepRoom).name}**" kanalına gönderdim.`}).catch(err => {})
                          // Kanal taşıma
                          if(member && member.voice.channel) return member.voice.setChannel(kanallar.sleepRoom).catch(err => {})
                      }
        })
    }) 
}

async function checkAfk() {
    // Client'a erişim
    const client = global.client;
    
    let _findServer = await GUILDS_SETTINGS.findOne({ guildID: sistem.SERVER.ID })
    ayarlar = _findServer.Ayarlar
    let ayar = ayarlar.otomatikSleep || false
    if(!ayar) return;
    
    let guild = client.guilds.cache.get(global.sistem.SERVER.ID)
    if(!guild || !ayarlar || !kanallar.sleepRoom || !kanallar.publicKategorisi) return;
    
    guild.channels.cache.filter(e => 
        e.type == ChannelType.Voice && // V14: "GUILD_VOICE" yerine
        e.members.size > 0 &&
        e.parentId == kanallar.publicKategorisi &&
        e.id != kanallar.sleepRoom &&
        kanallar.musicRooms.some(x => e.id != x)).forEach(channel => {
        channel.members.filter(member => !member.user.bot && voiceAfks.get(member.id)).forEach(async (member) => {
                 let data = voiceAfks.get(member.id);
                      if(data && Date.now() >= data.date) {
                          await voiceAfks.delete(member.id);
                          if(member) member.send({content: `**${channel.name}** sohbet kanalında afk olduğunu fark ettik.
Seni otomatik olarak "**${member.guild.channels.cache.get(kanallar.sleepRoom).name}**" kanalına gönderdim.`}).catch(err => {})
                          // Kanal taşıma
                          if(member && member.voice.channel) return member.voice.setChannel(kanallar.sleepRoom).catch(err => {})
                      }
        })
    }) 
}