const { Client, Message, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
// Global fonksiyonların ve dış kütüphanelerin importu korunmuştur.
const { genEmbed } = require("../../../../Global/İnit/Embed");

// Global değişkenlerin, client metodlarının (ayarlar, roller, cevaplar, emojiler) varlığı varsayılmıştır.
// const { ayarlar, roller, cevaplar, emojiler } = global; 

module.exports = {
    Isim: "toplutaşı",
    Komut: ["toplutasi"],
    Kullanim: "toplutaşı <Kanal ID>",
    Aciklama: "Bulunduğunuz ses kanalındaki tüm üyeleri belirtilen ses kanalına taşır.",
    Kategori: "kurucu",
    Extend: true,
    
    /**
    * @param {Client} client 
    */
    onLoad: function (client) {

    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, message, args) {
        // İzin Kontrolü
        const hasPermission = ayarlar.staff.includes(message.member.id) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)));
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        const currentVoiceChannel = message.member.voice.channel;
        const iptalEmoji = message.guild.emojis.cache.get(emojiler.Iptal) || '❌';
        
        // Hata kontrolü için yardımcı fonksiyon
        const checkFailure = (content) => {
             return message.reply({ content: content }).then(msg => {
                if (iptalEmoji) message.react(iptalEmoji).catch(err => {});
                setTimeout(() => {
                    msg.delete().catch(err => {});
                }, 7500);
            });
        };

        // 1. Ses Kanalı Kontrolü (Yetkili ses kanalında olmalı)
        if (!currentVoiceChannel) {
            return checkFailure(`${cevaplar.prefix} Ses kanalında olmadığın için işlem iptal edildi.`);
        }
        
        // 2. Kanal ID Argüman Kontrolü
        let channelId = args[0];
        if (!channelId) {
            return checkFailure(`${cevaplar.prefix} Ses kanalındaki üyeleri hangi kanala taşımamı istiyorsun?`);
        }
        
        // 3. Kanal Varlığı ve Tipi Kontrolü
        let targetChannel = message.guild.channels.cache.get(channelId);
        
        if (!targetChannel) {
            return checkFailure(`${cevaplar.prefix} Belirtilen argüman bir kanal değil veya bulunamadı, lütfen geçerli bir kanal ID'si girin!`);
        }
        
        // V14 ChannelType Kontrolü
        if (targetChannel.type !== ChannelType.GuildVoice) {
            return checkFailure(`${cevaplar.prefix} Belirtilen ${targetChannel} kanalı bir ses kanalı değil!`);
        }
        
        // 4. Taşıma İşlemi
        // V14'te .members bir Collection döndürür, .map(x => x.id) ile ID dizisi alınıp döngüde kullanılabilir.
        const channelMembers = currentVoiceChannel.members.map(x => x);
        
        for (let i = 0; i < channelMembers.length; i++) {
            const member = channelMembers[i];
            
            // Botun kendisini taşımamaya dikkat edelim
            if (member.id === client.user.id) continue;
            
            setTimeout(() => {
                // Taşıma işlemi sırasında üye kanaldan ayrılmış olabilir, kontrol edelim.
                if (member.voice.channelId === currentVoiceChannel.id) {
                    member.voice.setChannel(targetChannel.id).catch(err => {
                        console.error(`Taşıma hatası (${member.user.tag}): ${err.message}`);
                    });
                }
            }, (i + 1) * 1000);
        }

        // 5. Onay Mesajı
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay) || '✅';
        
        message.reply({ 
            content: `${onayEmoji} **\`${currentVoiceChannel.name}\`** adlı ses kanalındaki üyeler ${targetChannel} kanalına taşınmaya başlandı!`
        });
        
        // Onay Tepkisi
        if (typeof emojiler.Onay === 'string') {
            message.react(emojiler.Onay).catch(err => {});
        } else if (onayEmoji && onayEmoji.id) {
            message.react(onayEmoji.id).catch(err => {});
        }
    }
};