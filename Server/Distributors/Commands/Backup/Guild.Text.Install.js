const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine EmbedBuilder
    ChannelType, // Kanal tipleri için
    PermissionsBitField, // İzinler için
} = require("discord.js");

// Varsayımlar: Global değişkenlerin ve Schemaların tanımlı olduğunu varsayıyoruz.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const TextChannels = require("../../../../Global/Databases/Guild.Text.Channels");

// Varsayımsal global fonksiyonlar
const tarihsel = global.tarihsel || ((date) => new Date(date).toLocaleString()); 
const cevaplar = global.cevaplar || { prefix: "[INFO]" };


module.exports = {
    Isim: "metinkur",
    Komut: ["metinkur"],
    Kullanim: "metinkur <Yedek Kanal ID>",
    Aciklama: "Yedeklenmiş bir metin kanalını kurar.",
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
        if (!args[0] || isNaN(args[0])) return message.reply("Lütfen Metin kanalı ID'si giriniz.");
        
        const oldChannelID = args[0];
        
        // Metin Kanalı Verisini Çekme (Promise tabanlı)
        const data = await TextChannels.findOne({ channelID: oldChannelID }).catch(e => null);

        if (!data) return message.channel.send(`${cevaplar.prefix} Belirtilen metin kanalı geçmişte bulunamadığından işlem iptal edildi.`).catch(e => {});
        
        // --- YENİ KANALI OLUŞTURMA ---
        
        let newChannel;
        try {
            newChannel = await message.guild.channels.create({
                name: data.name,
                type: ChannelType.GuildText, // V14 Tipi
                nsfw: data.nsfw,
                parent: data.parentID, // V14'te parentID yerine parent
                position: data.position,
                rateLimitPerUser: data.rateLimit, // V14'te rateLimit yerine rateLimitPerUser
            });
        } catch (error) {
            console.error("Metin kanalı oluşturulurken hata:", error);
            return message.channel.send(`${cevaplar.prefix} Metin kanalı kurulurken bir hata oluştu: \`${error.message}\``);
        }

        await message.channel.send({ embeds: [embed.setDescription(`**${newChannel.name}** isimli metin kanalının, \`${tarihsel(Date.now())}\` tarihli metin kanalı kurulmaya başladı.`)]});
        
        // --- İZİN AYARLARINI KURMA ---
        
        const newOverwrite = [];
        for (let veri of data.overwrites) {
            // PermissionsBitField kullanımı V14'e uyarlandı (BigInt ile)
            newOverwrite.push({
                id: veri.id,
                allow: new PermissionsBitField(BigInt(veri.allow)).toArray(),
                deny: new PermissionsBitField(BigInt(veri.deny)).toArray()
            });
        }
        
        // V14'te kanal oluşturulurken parent belirlendiği için bu adım artık gerekli değil, ancak orijinal mantığı koruyoruz:
        // if (data.parentID && message.guild.channels.cache.get(data.parentID)) {
        //     await newChannel.setParent(data.parentID).catch(e => console.error("Parent ayarlanırken hata:", e));
        // }
        
        await newChannel.permissionOverwrites.set(newOverwrite);
        
        // --- VERİTABANI GÜNCELLEME ---
        
        // client.queryManage fonksiyonunuzun var olduğunu varsayıyoruz
        if (client.queryManage) {
            await client.queryManage(oldChannelID, newChannel.id);
        }
        
        // Veritabanındaki kanal kaydının ID'sini yeni kanal ID'si ile güncelle
        data.channelID = newChannel.id;
        await data.save();

        message.react('✅').catch(err => {});
    }
};