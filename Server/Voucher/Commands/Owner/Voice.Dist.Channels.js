const { Client, Message, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
// Global fonksiyonların ve veritabanı modelinin doğru import edildiği varsayılmıştır.
const { genEmbed } = require("../../../../Global/İnit/Embed");

// Global değişkenlerin, client metodlarının (ayarlar, roller, cevaplar, emojiler, kanallar) varlığı varsayılmıştır.
// const { ayarlar, roller, cevaplar, emojiler, kanallar } = global; 

module.exports = {
    Isim: "dağıt",
    Komut: ["dagit"],
    Kullanim: "dağıt",
    Aciklama: "Bulunduğunuz ses kanalındaki üyeleri rastgele public ses kanallarına dağıtır.",
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

        const voiceChannel = message.member.voice.channel;
        
        // Ses Kanalı Kontrolü
        if (!voiceChannel) {
            return message.reply({ content: `${message.guild.emojis.cache.get(emojiler.Iptal) || cevaplar.prefix} Ses kanalında olmadığın için işlem iptal edildi.` }).then(x => {
                const iptalEmoji = message.guild.emojis.cache.get(emojiler.Iptal);
                if (iptalEmoji) message.react(iptalEmoji).catch(err => {});
                setTimeout(() => {
                    x.delete().catch(err => {});
                }, 7500);
            });
        }
        
        // Public Odaları Filtreleme (V14 ChannelType kullanımı)
        const publicRooms = message.guild.channels.cache.filter(c => 
            c.parentId === kanallar.publicKategorisi && 
            c.id !== kanallar.sleepRoom && 
            c.type === ChannelType.GuildVoice
        );
        
        if (publicRooms.size === 0) {
            return message.reply({ content: `${message.guild.emojis.cache.get(emojiler.Iptal) || cevaplar.prefix} Dağıtılabilecek uygun public ses kanalı bulunamadı.` });
        }
        
        // Dağıtım İşlemi
        // V14'te .members bir Collection döndürür, bu yüzden .array() yerine .forEach() kullanmak daha doğrudur.
        const membersToMove = voiceChannel.members.values(); // Üyeleri bir iteratör olarak alalım
        let index = 0;
        
        for (const member of membersToMove) {
             // Kendini dağıtmamasını sağlamak için ek kontrol
             if (member.id === client.user.id) continue;
             
             // Rastgele bir public oda seçimi (V14 Collection.random() kullanımı)
             const randomRoom = publicRooms.random();

             if (randomRoom) {
                 setTimeout(() => {
                    // Üye hala eski kanalda mı kontrolü yapılır (V14'te channelId erişimi)
                    if (member.voice.channelId === voiceChannel.id) {
                        member.voice.setChannel(randomRoom.id).catch(err => {
                            console.error(`Üye taşıma hatası (${member.user.tag}): ${err.message}`);
                        });
                    }
                 }, index * 1000);
             }
             index++;
        }

        // Onay Mesajı Gönderme
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay) || '✅';
        
        message.reply({ 
            content: `${onayEmoji} **\`${voiceChannel.name}\`** adlı ses kanalındaki üyeleri rastgele public odalara dağıtılmaya başladım!`
        }).catch(err => {});
        
        // Onay Tepkisi
        if (typeof emojiler.Onay === 'string') {
            message.react(emojiler.Onay).catch(err => {});
        } else if (onayEmoji && onayEmoji.id) {
            message.react(onayEmoji.id).catch(err => {});
        }
    }
};