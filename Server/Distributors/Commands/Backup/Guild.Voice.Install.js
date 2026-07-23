const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine EmbedBuilder
    ChannelType, // Kanal tipleri için
    PermissionsBitField, // İzinler için
} = require("discord.js");

// Varsayımlar: Global değişkenlerin ve Schemaların tanımlı olduğunu varsayıyoruz.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const VoiceChannels = require("../../../../Global/Databases/Guild.Voice.Channels");

// Varsayımsal global fonksiyonlar
const tarihsel = global.tarihsel || ((date) => new Date(date).toLocaleString()); 
const cevaplar = global.cevaplar || { prefix: "[INFO]" };


module.exports = {
    Isim: "seskur",
    Komut: ["seskur"],
    Kullanim: "seskur <Yedek Kanal ID>",
    Aciklama: "Yedeklenmiş bir ses kanalını kurar.",
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
        if (!args[0] || isNaN(args[0])) return message.reply("Lütfen **Ses kanalı ID'si** giriniz.");
        
        const oldChannelID = args[0];
        
        // Ses Kanalı Verisini Çekme (Promise tabanlı)
        const data = await VoiceChannels.findOne({ channelID: oldChannelID }).catch(e => null);

        if (!data) return message.channel.send(`${cevaplar.prefix} Belirtilen ses kanalı geçmişte bulunamadığından işlem iptal edildi.`).catch(e => {});
        
        // --- YENİ KANALI OLUŞTURMA ---
        
        let newChannel;
        try {
            newChannel = await message.guild.channels.create({
                name: data.name,
                type: ChannelType.GuildVoice, // V14 Tipi
                bitrate: data.bitrate,
                parent: data.parentID, // V14'te parentID yerine parent
                position: data.position,
                userLimit: data.userLimit || 0
            });
        } catch (error) {
            console.error("Ses kanalı oluşturulurken hata:", error);
            return message.channel.send(`${cevaplar.prefix} Ses kanalı kurulurken bir hata oluştu: \`${error.message}\``);
        }

        await message.channel.send({ embeds: [embed.setDescription(`**${newChannel.name}** isimli ses kanalının, \`${tarihsel(Date.now())}\` tarihli ses kanalı kurulmaya başladı.`)]});
        
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
        
        // Kanal oluşturulurken parent zaten ayarlanmıştır, ancak emin olmak için:
        if (data.parentID && message.guild.channels.cache.get(data.parentID)) {
            // V14'te setParent'a gerek kalmaz eğer parent yukarıda belirtilmişse, ancak eski yapıyı koruyoruz.
             await newChannel.setParent(data.parentID).catch(e => {
                // Eğer parent ayarlanamazsa logla
                if(e) console.error("Ses kanalı parent ayarlanırken hata:", e);
             });
        }
        
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