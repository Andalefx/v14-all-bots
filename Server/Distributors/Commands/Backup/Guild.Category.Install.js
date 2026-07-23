const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine EmbedBuilder
    ChannelType, // Kanal tipleri için
    PermissionsBitField, // İzinler için
} = require("discord.js");

// Varsayımlar: Global değişkenlerin tanımlı olduğunu varsayıyoruz.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const CategoryChannels = require("../../../../Global/Databases/Guild.Category.Channels");
const TextChannels = require("../../../../Global/Databases/Guild.Text.Channels");
const VoiceChannels = require("../../../../Global/Databases/Guild.Voice.Channels");

// Varsayımsal global fonksiyonlar
const tarihsel = global.tarihsel || ((date) => new Date(date).toLocaleString()); 

module.exports = {
    Isim: "kategorikur",
    Komut: ["kategorikur"],
    Kullanim: "kategorikur <Yedek Kategori ID>",
    Aciklama: "Yedeklenmiş bir kategori kanalını kurar ve altındaki mevcut kanalları taşır.",
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
        
        // Argüman Kontrolü
        if (!args[0] || isNaN(args[0])) return;
        
        const oldCategoryID = args[0];
        
        // Kategori Verisini Çekme (Promise tabanlı)
        const categoryData = await CategoryChannels.findOne({ channelID: oldCategoryID }).catch(e => null);

        if (!categoryData) return;
        
        // --- 1. YENİ KATEGORİYİ KURMA ---
        
        let newChannel;
        try {
            newChannel = await message.guild.channels.create({
                name: categoryData.name,
                type: ChannelType.GuildCategory, // V14 Tipi
                position: categoryData.position,
            });
        } catch (error) {
            console.error("Kategori oluşturulurken hata:", error);
            return;
        }


        await message.channel.send({ embeds: [embed.setDescription(`**${newChannel.name}** isimli kategorinin, \`${tarihsel(Date.now())}\` tarihli kategori yedeği kurulmaya başladı.`)]});
        
        // --- 2. ALT KANALLARI TAŞIMA VE VERİTABANI GÜNCELLEME ---

        // Metin Kanallarını Taşıma
        const textChannels = await TextChannels.find({ parentID: oldCategoryID });
        
        // Veritabanında eski parent ID'leri yeni parent ID ile güncelle
        await TextChannels.updateMany({ parentID: oldCategoryID }, { parentID: newChannel.id });
        
        for (const c of textChannels) {
            const textChannel = message.guild.channels.cache.get(c.channelID);
            // Eğer kanal hala mevcutsa, yeni kategori altına taşı
            if (textChannel) {
                await textChannel.setParent(newChannel.id, { lockPermissions: false }).catch(err => {
                    console.error(`Metin kanalı (${textChannel.name}) taşınırken hata:`, err);
                });
            }
        }
        
        // Ses Kanallarını Taşıma
        const voiceChannels = await VoiceChannels.find({ parentID: oldCategoryID });
        
        // Veritabanında eski parent ID'leri yeni parent ID ile güncelle
        await VoiceChannels.updateMany({ parentID: oldCategoryID }, { parentID: newChannel.id });
        
        for (const c of voiceChannels) {
            const voiceChannel = message.guild.channels.cache.get(c.channelID);
            // Eğer kanal hala mevcutsa, yeni kategori altına taşı
            if (voiceChannel) {
                await voiceChannel.setParent(newChannel.id, { lockPermissions: false }).catch(err => {
                    console.error(`Ses kanalı (${voiceChannel.name}) taşınırken hata:`, err);
                });
            }
        }
        
        // --- 3. İZİN AYARLARINI KURMA ---
        
        const newOverwrite = [];
        for (let veri of categoryData.overwrites) {
            // PermissionsBitField kullanımı V14'e uyarlandı (BigInt ile)
            newOverwrite.push({
                id: veri.id,
                allow: new PermissionsBitField(BigInt(veri.allow)).toArray(),
                deny: new PermissionsBitField(BigInt(veri.deny)).toArray()
            });
        }
        await newChannel.permissionOverwrites.set(newOverwrite);
        
        // --- 4. SON İŞLEMLER ---
        
        // client.queryManage fonksiyonunuzun var olduğunu varsayıyoruz
        if (client.queryManage) {
            await client.queryManage(oldCategoryID, newChannel.id);
        }
        
        // Veritabanındaki kategori kaydının ID'sini yeni kanal ID'si ile güncelle
        categoryData.channelID = newChannel.id;
        await categoryData.save();

        message.react('✅').catch(err => {});
    }
};