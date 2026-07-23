const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine EmbedBuilder
    ChannelType, // Kanal tipleri için
    PermissionsBitField, // İzinler için
} = require("discord.js");

// Varsayımlar:
// Global dosyalardan gelen gerekli ayarların tanımlı olduğunu varsayıyoruz.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const CategoryChannels = require("../../../../Global/Databases/Guild.Category.Channels");
const TextChannels = require("../../../../Global/Databases/Guild.Text.Channels");
const VoiceChannels = require("../../../../Global/Databases/Guild.Voice.Channels");

// --- Düzeltildi: Tekrar emojiler global değişkeni kullanılıyor ---
const emojiler = global.emojiler || { Iptal: '❌' }; 
const cevaplar = global.cevaplar || { prefix: "[INFO]" };
const tarihsel = global.tarihsel || ((date) => new Date(date).toLocaleString()); 

module.exports = {
    Isim: "testkur",
    Komut: ["testkur"],
    Kullanim: "kanalkur <Kategori ID>",
    Aciklama: "Yedeklenen bir kategori ve altındaki kanalları yeniden kurar.",
    Kategori: "-",
    Extend: false,
    
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array<String>} args 
     */
    onRequest: async function (client, message, args) {
        // --- DM KONTROLÜ ---
        if (!message.guild || !message.member) return;
        
        const embed = new genEmbed()
        
        if (!args[0] || isNaN(args[0])) return message.reply("Lütfen bir kategori ID'si belirtin.")
        
        const categoryID = args[0];
        
        // Kategori Verisini Çekme (Promise tabanlı)
        const categoryData = await CategoryChannels.findOne({ channelID: categoryID }).catch(e => null);

        if (!categoryData) {
            return message.channel.send({ content: `${cevaplar.prefix} Belirtilen kategori kanalı geçmişte bulunamadığından işlem iptal edildi ` }).then(x => {
                // emojiler.Iptal kullanıldı
                message.react(emojiler.Iptal || '❌').catch(err => {})
            });
        }
        
        // --- 1. KATEGORİYİ KURMA ---
        
        try {
            const newChannel = await message.guild.channels.create({
                name: categoryData.name,
                type: ChannelType.GuildCategory, // V14 Tipi
                position: categoryData.position,
            });

            await message.channel.send({ embeds: [embed.setDescription(`**${newChannel.name}** isimli kategorinin, \`${tarihsel(Date.now())}\` tarihli kategori yedeği kurulmaya başladı.`)]});

            // --- 2. ALT KANALLARI KURMA ---

            // Metin Kanallarını Kurma
            const textChannels = await TextChannels.find({ parentID: categoryID });
            for (const c of textChannels) {
                await textKur(c.channelID, message, embed, newChannel.id);
            }

            // Ses Kanallarını Kurma
            const voiceChannels = await VoiceChannels.find({ parentID: categoryID });
            for (const c of voiceChannels) {
                await voiceKur(c.channelID, message, embed, newChannel.id);
            }
            
            // --- 3. İZİN AYARLARINI KURMA ---
            
            const newOverwrite = [];
            for (let veri of categoryData.overwrites) {
                // PermissionsBitField kullanımı V14'e uyarlandı
                newOverwrite.push({
                    id: veri.id,
                    allow: new PermissionsBitField(BigInt(veri.allow)).toArray(),
                    deny: new PermissionsBitField(BigInt(veri.deny)).toArray()
                });
            }
            await newChannel.permissionOverwrites.set(newOverwrite);

        } catch (error) {
            console.error("Kategori kurma sırasında hata:", error);
            message.channel.send({ content: `${cevaplar.prefix} Kategori ve kanalları kurarken bir hata oluştu: \`${error.message}\`` });
            message.react(emojiler.Iptal || '❌').catch(err => {});
        }
    }
};

/**
 * Ses Kanalını Kurma Fonksiyonu
 */
async function voiceKur(idcik, message, embed, parentID) {
    const voiceData = await VoiceChannels.findOne({ channelID: idcik }).catch(e => null);
    
    if (!voiceData) {
        return message.channel.send({ content: `${cevaplar.prefix} Belirtilen ses kanal geçmişte bulunamadığından işlem iptal edildi ` }).then(x => {
            // emojiler.Iptal kullanıldı
            message.react(emojiler.Iptal || '❌').catch(err => {})
        });
    }
    
    try {
        const newChannel = await message.guild.channels.create({
            name: voiceData.name,
            type: ChannelType.GuildVoice, // V14 Tipi
            bitrate: voiceData.bitrate,
            parent: parentID, 
            position: voiceData.position,
            userLimit: voiceData.userLimit || 0
        });

        await message.channel.send({ embeds: [embed.setDescription(`**${newChannel.name}** isimli ses kanalının, \`${tarihsel(Date.now())}\` tarihli ses kanalı kurulmaya başladı.`)]});

        const newOverwrite = [];
        for (let veri of voiceData.overwrites) {
            // PermissionsBitField kullanımı V14'e uyarlandı
            newOverwrite.push({
                id: veri.id,
                allow: new PermissionsBitField(BigInt(veri.allow)).toArray(),
                deny: new PermissionsBitField(BigInt(veri.deny)).toArray()
            });
        }
        
        await newChannel.permissionOverwrites.set(newOverwrite);
    } catch (error) {
        console.error(`Ses kanalı (${voiceData.name}) kurma sırasında hata:`, error);
    }
}

/**
 * Metin Kanalını Kurma Fonksiyonu
 */
async function textKur(idcik, message, embed, parentID) {
    const textData = await TextChannels.findOne({ channelID: idcik }).catch(e => null);

    if (!textData) {
        return message.channel.send({ content: `${cevaplar.prefix} Belirtilen metin kanal geçmişte bulunamadığından işlem iptal edildi ` }).then(x => {
            // emojiler.Iptal kullanıldı
            message.react(emojiler.Iptal || '❌').catch(err => {})
        });
    }
    
    try {
        const newChannel = await message.guild.channels.create({
            name: textData.name,
            type: ChannelType.GuildText, // V14 Tipi
            nsfw: textData.nsfw,
            parent: parentID, 
            position: textData.position,
            rateLimitPerUser: textData.rateLimit || 0, // V14'te rateLimit yerine rateLimitPerUser
        });

        await message.channel.send({ embeds: [embed.setDescription(`**${newChannel.name}** isimli metin kanalının, \`${tarihsel(Date.now())}\` tarihli metin kanalı kurulmaya başladı.`)]});
        
        const newOverwrite = [];
        for (let veri of textData.overwrites) {
            // PermissionsBitField kullanımı V14'e uyarlandı
            newOverwrite.push({
                id: veri.id,
                allow: new PermissionsBitField(BigInt(veri.allow)).toArray(),
                deny: new PermissionsBitField(BigInt(veri.deny)).toArray()
            });
        }
        
        await newChannel.permissionOverwrites.set(newOverwrite);
    } catch (error) {
        console.error(`Metin kanalı (${textData.name}) kurma sırasında hata:`, error);
    }
}