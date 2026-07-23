const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine EmbedBuilder
    Util
} = require("discord.js");

// Varsayımlar: Global değişkenlerin ve Schemaların tanımlı olduğunu varsayıyoruz.
const StatsSchema = require('../../../../Global/Databases/Client.Users.Stats');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const ms = require('ms')

// Emojiler ve tarihsel global değişkenlerden geliyor.
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 
const tarihsel = global.tarihsel || ((date) => new Date(date).toLocaleString()); 


module.exports = {
    Isim: "stattemizle",
    Komut: ["stat-temizle"],
    Kullanim: "",
    Aciklama: "",
    Kategori: "-",
    Extend: true,
    
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array<String>} args 
     */
    onRequest: async function (client, message, args) {
        
        // --- DM KONTROLÜ ---
        if (!message.guild || !message.member) return;
        
        // Emoji Erişimi için Güvenli Fonksiyon (Orijinal koddaki gibi)
        const getEmojiID = (emojiName) => {
            const emoji = emojiler[emojiName];
            if (message.guild.emojis.cache.has(emoji)) {
                return message.guild.emojis.cache.get(emoji).id;
            }
            // Eğer emoji ID değilse veya bulunamazsa undefined dönmeli (Orijinal mantık)
            return undefined;
        }

        try {
            const x = await message.channel.send({
                embeds: [
                    // new genEmbed() kullanıldı (Orijinal kodun kullandığı Embed sınıfı)
                    new genEmbed()
                        .setDescription(`✅ Başarıyla **${tarihsel(Date.now() - ms("7d"))}** tarihinden itibaren olan tüm veriler temizlendi.`)
                        .setFooter({ text: "işlemi geri almak için bot yapımcısına başvurun." })
                ]
            });

            // Orijinal kodun sıralaması ve tekrar eden sorguları korundu:
            
            // 1. İstatistik Alanlarını Sıfırla (Map'ler ve Toplamlar)
            await StatsSchema.updateMany({ guildID: message.guild.id }, { voiceStats: new Map(), chatStats: new Map(), totalVoiceStats: 0, totalChatStats: 0 });
            
            // 2. Sunucudan Ayrılan Üyelerin Kayıtlarını Silme
            let stats = await StatsSchema.find({ guildID: message.guild.id});
            stats.filter(s => !message.guild.members.cache.has(s.userID)).forEach(async s => {
                await StatsSchema.findByIdAndDelete(s._id);
            });
            
            // 3. Tekrar Sıfırlama (Orijinal kodda olduğu gibi)
            await StatsSchema.updateMany({ guildID: message.guild.id }, { voiceStats: new Map(), chatStats: new Map(), totalVoiceStats: 0, totalChatStats: 0 });
            
            // 4. Tekrar Sıfırlama (Orijinal kodda olduğu gibi)
            await StatsSchema.updateMany({ guildID: message.guild.id }, { voiceStats: new Map(), chatStats: new Map(), totalVoiceStats: 0, totalChatStats: 0 });
            
            // 5. TÜM İSTATİSTİKLERİ SİLME (Orijinal kodda olduğu gibi, dikkatli olunmalı)
            await StatsSchema.deleteMany({ guildID: message.guild.id})
            
            // 6. Başarılı Tepkisi
            message.react(getEmojiID('Onay')).catch(err => {});
            
            // 7. Mesajı silme
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 13500);

        } catch (error) {
            console.error("İstatistik temizleme sırasında hata:", error);
            // Hata durumunda mesaj silinmeli ve tepki iptal edilmeli, ancak orijinal kodda bu yönetim yok.
        }
    }
};