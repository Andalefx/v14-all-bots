const { MessageAttachment, EmbedBuilder, Client, PermissionsBitField, ChannelType } = require('discord.js');

const Mute = require('../../../../Global/Databases/Punitives.Mutes')
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');
const { genEmbed } = require('../../../../Global/İnit/Embed');
// Not: Aşağıdaki global objelerin (sistem, kanallar, emojiler, client) dışarıdan erişilebilir olduğu varsayılmıştır.
const usersMap = new Map();
const getLimit = new Map();
const LIMIT = 3;
const TIME = 10000;
const DIFF = 1000;

const capsEngel  = /[^A-ZĞÜŞİÖÇ]/g;
const küfürler =  ["amcık","orospu","piç","sikerim","sikik","amına","pezevenk","yavşak","anandır","orospu","evladı","sokuk","yarrak","oç","o ç","siktir","bacını","karını","amq","anaskm","AMK","YARRAK","sıkerım"];
// cdn.discordapp.com ve discord.app reklam olarak algılanmamalıdır, zira bunlar resim/dosya yükleme ve resmi discord domainleridir.
const reklamlar = ["http://","https://", "discord.gg","discordapp","discordgg", ".com", ".net", ".xyz", ".pw", ".io", ".gg", "www.", "https", "http", ".gl", ".org", ".com.tr", ".biz", ".party", ".rf.gd", ".az"]
const inviteEngel = new RegExp(/(https:\/\/)?(www\.)?(discord\.gg|discord\.me|discordapp\.com\/invite|discord\.com\/invite)\/([a-z0-9-.]+)?/i);

// -------------------------------------------------------------------------------- //
// Flood (Spam) Kontrolü (messageCreate eventi ile başlar)
// -------------------------------------------------------------------------------- //
if (typeof client !== 'undefined') {
    client.on("messageCreate", async (message) => {
        // Mesaj bot, webhook, DM veya sunucudan gelmiyorsa işlemi durdur
        if(message.webhookId || message.author.bot || message.channel.type === ChannelType.DM || !message.guild) return;
        
        const clientObj = message.client;

        let _findServer = await GUILDS_SETTINGS.findOne({ guildID: sistem.SERVER.ID })
        if (!_findServer) return;
        const _set = _findServer.Ayarlar
        
        // Yetkili/İzinli Kontrolleri
        if(_set.staff.includes(message.member.id)) return;
        if(message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return; // V14 İzin Kontrolü
        if(_set.chatİzinliler && (_set.chatİzinliler.includes(message.member.id) || _set.chatİzinliler.some(x => message.channel.id == x) || _set.chatİzinliler.some(x => message.member.roles.cache.has(x)))) return;
        if(_set.kurucuRolleri && _set.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) return;
        if(_set && !_set.spamEngel) return;
        
        // Spam Kontrol Mekanizması
        if(usersMap.has(message.author.id)) {
            const userData = usersMap.get(message.author.id);
            const {lastMessage, timer} = userData;
            const difference = message.createdTimestamp - lastMessage.createdTimestamp;
            let msgCount = userData.msgCount;
            
                if(difference > DIFF) {
                    clearTimeout(timer);
                    userData.msgCount = 1;
                    userData.lastMessage = message;
                        userData.timer = setTimeout(() => {
                            usersMap.delete(message.author.id);
                        }, TIME);
                    usersMap.set(message.author.id, userData)
                } else {
                        msgCount++;
                        if(parseInt(msgCount) === LIMIT) {
                            let datas = await Mute.findOne({_id: message.member.id})
                            if(datas) return;
                            sonMesajlar(message, 30) // Flood mesajlarını sil
                            usersMap.delete(message.author.id);
                            await message.channel.send({content: `${message.guild.emojiGöster(emojiler.chatSusturuldu)} ${message.member} Sohbet kanallarında fazla hızlı mesaj gönderdiğiniz için \` 1 Dakika \` süresince susturuldunuz.`}).then(x => setTimeout(() => {
                                x.delete().catch(err => {})
                            }, 7500)).catch(err => {})
                          
                            return message.member.addPunitives(5, message.guild.members.cache.get(clientObj.user.id) ? message.guild.members.cache.get(clientObj.user.id) : message.member, "Metin Kanallarında Flood Yapmak!", message, "1m", true);
                         } else {
              userData.msgCount = msgCount;
              usersMap.set(message.author.id, userData)
            }}}
             else{
            let fn = setTimeout(() => {
              usersMap.delete(message.author.id)
            }, TIME);
            usersMap.set(message.author.id, {
            msgCount: 1,
            lastMessage: message,
            timer: fn
            
            })
            }
    });
}

// -------------------------------------------------------------------------------- //
// Genel Mesaj Koruması (messageCreate modül exportu)
// -------------------------------------------------------------------------------- //
module.exports = async (message) => {
    if(message.webhookId || message.author.bot || message.channel.type === ChannelType.DM || !message.guild) return;

    const clientObj = message.client;

    let _findServer = await GUILDS_SETTINGS.findOne({ guildID: sistem.SERVER.ID })
    if (!_findServer) return;
    const _set = _findServer.Ayarlar

    if(_set.staff.includes(message.member.id)) return;
    if(message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return; // V14 İzin Kontrolü
    if(_set.chatİzinliler && (_set.chatİzinliler.includes(message.member.id) || _set.chatİzinliler.some(x => message.channel.id == x) || _set.chatİzinliler.some(x => message.member.roles.cache.has(x)))) return;
    if(_set.kurucuRolleri && _set.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) return;

    // Resim kanalı kontrolü
    if (message.channel.id == kanallar.photoChatKanalı && message.attachments.size < 1) return await message.delete().catch(err => {});

    // Etiket Limiti
    if ((message.mentions.roles.size + message.mentions.users.size + message.mentions.channels.size) >= 3) return sendChat(message, "birden fazla etiket atmaktan vazgeç")
 
    // Küfür Engeli
    if (_set.kufurEngel === true && küfürler.some(word => new RegExp("(\\b)+(" + word + ")+(\\b)", "gui").test(message.content))) return sendChat(message, "küfür etmekten vazgeç")

    // Spotify Aktivite Kontrolü
    if (message.activity && message.channel.id !== _set.spotifyKanalı && message.activity.partyId?.startsWith("spotify:")) return message.delete().catch(err => {})

    // Uzun Mesaj Engeli
    if(message.content && message.content.length && message.content.length >= 165)  return sendChat(message, "uzun mesaj atmamaya özen göster")
    
    // Caps Lock Engeli
    const Caps = (message.content.match(/[A-ZĞÇÖIÜ]/gm) || []).length;
    if ((_set && _set.capsEngel) && (Caps / message.content.length) >= 0.7) return  sendChat(message, "Caps-Lock kullanmamalısın")

    // Invite Engeli (Davet bağlantıları)
    if (_set.reklamEngel === true && message.content.match(inviteEngel)) {
        // Sunucu davetlerinin kontrolü
        const invites = await message.guild.invites.fetch().catch(err => []);
        if ((message.guild.vanityURLCode && message.content.match(inviteEngel).some((i) => message.content.includes(message.guild.vanityURLCode))) || invites.some((x) => message.content.match(inviteEngel).some((i) => i === x.code))) return;
        return sendChat(message, "reklam yapmaktan vazgeç")
    }

    // Genel Reklam Engeli (Kelimeler)
    if(_set.reklamEngel === true && reklamlar.some(word => message.content.toLowerCase().includes(word))) return  sendChat(message, "reklam yapmaktan vazgeç")
}

module.exports.config = {
    Event: "messageCreate"
};

// -------------------------------------------------------------------------------- //
// messageUpdate Olayı (Mesaj Düzenleme)
// -------------------------------------------------------------------------------- //
if (typeof client !== 'undefined') {
    client.on('messageUpdate', async (oldMessage, newMessage) => {
        // Mesaj bot, webhook, DM veya içerik değişmemişse durdur
        if(newMessage.webhookId || newMessage.author.bot || newMessage.channel.type === ChannelType.DM || oldMessage.content === newMessage.content) return;
        
        let _findServer = await GUILDS_SETTINGS.findOne({ guildID: sistem.SERVER.ID })
        if (!_findServer) return;
        const _set = _findServer.Ayarlar 
        
        // Yetkili/İzinli Kontrolleri
        if(_set.staff.includes(newMessage.member.id)) return;
        if(_set.chatİzinliler && (_set.chatİzinliler.includes(newMessage.member.id) || _set.chatİzinliler.some(x => newMessage.channel.id == x) || _set.chatİzinliler.some(x => newMessage.member.roles.cache.has(x)))) return;
        if(newMessage.member.permissions.has(PermissionsBitField.Flags.Administrator)) return; // V14 İzin Kontrolü
        if(_set.kurucuRolleri && _set.kurucuRolleri.some(oku => newMessage.member.roles.cache.has(oku))) return;
        
        // Resim kanalı kontrolü
        if (newMessage.channel.id == kanallar.photoChatKanalı && newMessage.attachments.size < 1) await newMessage.delete().catch(err => {});
        
        // Küfür Engeli
        if (_set.kufurEngel === true && küfürler.some(word => new RegExp("(\\b)+(" + word + ")+(\\b)", "gui").test(newMessage.content))) newMessage.delete().catch(err => {});
        
        // Spotify Aktivite Kontrolü
        if (newMessage.activity && newMessage.channel.id !== _set.spotifyKanalı && newMessage.activity.partyId?.startsWith("spotify:")) newMessage.delete().catch(err => {})
        
        // Caps Lock Engeli (Düzenleme)
        const Caps = (newMessage.content.match(/[A-ZĞÇÖIÜ]/gm) || []).length;
        if ((_set && _set.capsEngel) && (Caps / newMessage.content.length) >= 0.7) {
            if (newMessage.content.length <= 15) return;
            if (newMessage.deletable) newMessage.delete().catch(err => {});
        }

        // Invite Engeli (Davet bağlantıları)
        if (_set.reklamEngel === true && newMessage.content.match(inviteEngel)) {
            const invites = await newMessage.guild.invites.fetch().catch(err => []);
            if ((newMessage.guild.vanityURLCode && newMessage.content.match(inviteEngel).some((i) => newMessage.content.includes(newMessage.guild.vanityURLCode))) || invites.some((x) => newMessage.content.match(inviteEngel).some((i) => i === x.code))) return;
            return newMessage.delete().catch(err => {});
        }
        
        // Genel Reklam Engeli (Kelimeler)
        if(_set.reklamEngel === true && reklamlar.some(word => newMessage.content.toLowerCase().includes(word))) return newMessage.delete().catch(err => {})
    });

    // -------------------------------------------------------------------------------- //
    // messageDelete Olayı (Mesaj Silme Log)
    // -------------------------------------------------------------------------------- //
    client.on("messageDelete", async (message) => {
        // Mesaj bot, webhook, DM ise veya sunucu yoksa durdur
        if(message.webhookId || message.author?.bot || message.channel.type === ChannelType.DM || !message.guild) return;
        
          let silinenMesaj = message.guild.kanalBul("mesaj-log")
          if(!silinenMesaj) return;
        
          const embed = new genEmbed()
          .setAuthor({name: `Mesaj Silindi`, iconURL: message.author?.avatarURL() || message.guild.iconURL()}) // V14: setAuthor kullanımı
          .setDescription(`${message.author?.tag || "Bilinmeyen Kullanıcı"} üyesi bir mesaj sildi.`) 
          .addFields( // V14: addField yerine addFields
            { name: "Kanal Adı", value: `${message.channel.name}`, inline: true },
            { name: "Silinen Mesaj", value: `${message.content ? `${message.content.length > 0 ? message.content : "Bir mesaj bulunamadı!"}` : "Bir mesaj bulunamadı!"}`, inline: true },
            { name: "Silinen Resimler", value: `${message.attachments.size > 0 ? message.attachments.map(({ proxyURL }) => proxyURL).join('\n') : "Silinen resim bulunamadı."}` }
          )
          .setThumbnail(message.author?.avatarURL() || message.guild.iconURL()) 
          silinenMesaj.send({ embeds: [embed]}).catch(err => {})
          
    });

    // -------------------------------------------------------------------------------- //
    // messageUpdate Olayı (Mesaj Düzenleme Log)
    // -------------------------------------------------------------------------------- //
    client.on("messageUpdate", async (oldMessage, newMessage) => {
        // Mesaj bot, webhook, DM ise, sunucu yoksa veya içerik değişmemişse durdur
        if(newMessage.webhookId || newMessage.author?.bot || newMessage.channel.type === ChannelType.DM || !newMessage.guild || oldMessage.content == newMessage.content) return;
        
          let guncellenenMesaj = newMessage.guild.kanalBul("mesaj-log")
          if(!guncellenenMesaj) return;
        
          let embed = new genEmbed()
          .setAuthor({name: `Mesaj Düzenlendi`, iconURL: newMessage.author?.avatarURL() || newMessage.guild.iconURL()}) // V14: setAuthor kullanımı
          .setDescription(`${newMessage.author} üyesi bir mesaj düzenledi`)
          .addFields( // V14: addField yerine addFields
            { name: "Eski Mesaj", value: `${oldMessage.content || "Mesaj içeriği boş"}`, inline: true },
            { name: "Yeni Mesaj", value: `${newMessage.content || "Mesaj içeriği boş"}`, inline: true },
            { name: "Kanal Adı", value: `${newMessage.channel.name}`, inline: true }
          )
          .setThumbnail(newMessage.author?.avatarURL() || newMessage.guild.iconURL()) 
          guncellenenMesaj.send({embeds: [embed]}).catch(err => {})
    });
}

// -------------------------------------------------------------------------------- //
// Yardımcı Fonksiyonlar
// -------------------------------------------------------------------------------- //

// Hata/Uyarı mesajı gönderme ve ceza uygulama mekanizması
async function sendChat(message, content) {
    if (getLimit.get(message.author.id) == 3) {
        let datas = await Mute.findOne({_id: message.member.id})
        if(datas) return;
        message.delete().catch(err => {})
        getLimit.delete(message.member.id)
        await message.channel.send({content: `${message.guild.emojiGöster(emojiler.chatSusturuldu)} ${message.member} Sohbet kanallarında ki kurallara uyum sağlanmadığı için \` 10 Dakika \` süresince susturuldunuz.`}).then(x => setTimeout(() => {
            x.delete().catch(err => {})
        }, 7500)).catch(err => {})
        return message.member.addPunitives(5, message.guild.members.cache.get(message.client.user.id) ? message.guild.members.cache.get(message.client.user.id) : message.member, "Sohbet Kurallarına Uyulmadı!", message, "10m", false, true) 
    } else {
        getLimit.set(`${message.member.id}`, (Number(getLimit.get(`${message.member.id}`) || 0)) + 1)
        message.delete().catch(err => {})
        let embed = new EmbedBuilder() // V14: MessageEmbed yerine EmbedBuilder
        message.channel.send({content: `${message.member}`, embeds: [embed.setDescription(`**Merhaba!** ${message.member.user.tag}
Sohbet kanalında **${content}**, aksi taktirde yaptırım uygulanacaktır.
    `)]}).then(x => {
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 6000);
        })
        setTimeout(() => {
            if(getLimit.get(`${message.member.id}`)) getLimit.set(`${message.member.id}`, (Number(getLimit.get(`${message.member.id}`) || 0)) - 1)
          },10000)
    }
}

// Toplu Mesaj Silme
async function sonMesajlar(message, count = 25) {
    let messages = await message.channel.messages.fetch({ limit: 100 }).catch(() => null);
    if (!messages) return;
    
    // V14 Collection yapısına uygun filtreleme ve ilk X mesajı alma
    let filtered = messages.filter((x) => x.author.id === message.author.id).first(count); 
    if(filtered.length > 0) {
        message.channel.bulkDelete(filtered, true).catch(err => {}); // True ile 14 günden eski mesajlar güvenle elenir
    }
}