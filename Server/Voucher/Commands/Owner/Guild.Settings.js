const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

// Global değişkenlerin doğru import edildiği varsayılmıştır (ayarlar, roller, cevaplar, sistem, emojiler).
const { ayarlar, roller, cevaplar, sistem, emojiler } = global;

module.exports = {
    Isim: "sunucu",
    Komut: ["guild"],
    Kullanim: "sunucu <isim/afiş/resim> <Yeni İçerik>",
    Aciklama: "Sunucunun ismini, afişini (banner) veya resmini (ikon) değiştirir.",
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
        // İzin Kontrolü (ManageGuild izni gereklidir, ancak eski kod yapısı korundu)
        const hasPermission = ayarlar.staff.includes(message.member.id) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)));
                              
        if (!hasPermission) {
            const reply = await message.reply(cevaplar.noyt).catch(err => {});
            setTimeout(() => { reply.delete().catch(err => {}) }, 5000);
            return;
        }
        
        // İşlem türleri
        let process = ["isim", "afiş", "resim"]; 
        const islem = args[0] ? args[0].toLowerCase() : null;

        if (!process.includes(islem)) {
            return message.channel.send(cevaplar.argümandoldur + ` \`${sistem.botSettings.Prefixs[0]}${module.exports.Isim} <${process.map(x => x).join("/")}> <Yeni İçerik>\``).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
        }

        const yeniIcerik = args.slice(1).join(" ");
        const attachmentUrl = message.attachments.first()?.url;
        const hedefIcerik = yeniIcerik || attachmentUrl;
        const embed = new EmbedBuilder(); // V14 EmbedBuilder

        // --- İsim Değiştirme ---
        if (islem === "isim") {
            if (!yeniIcerik) return message.channel.send(`${cevaplar.prefix} Lütfen bir sunucu ismi belirleyin.`).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
            return setName(message.guild, message.member, message.channel, yeniIcerik, message.guild.name, embed);
        }

        // --- Afiş (Banner) Değiştirme ---
        if (islem === "afiş") {
            if (!hedefIcerik) return message.channel.send(`${cevaplar.prefix} Lütfen yeni afiş için bir bağlantı veya görsel ekleyin.`).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
            // Banner URL'yi V14'e uygun al
            const oldBanner = message.guild.bannerURL({ dynamic: true, size: 1024 }); 
            return setBanner(message.guild, message.member, message.channel, hedefIcerik, oldBanner, embed);
        }

        // --- Resim (Icon) Değiştirme ---
        if (islem === "resim") {
            if (!hedefIcerik) return message.channel.send(`${cevaplar.prefix} Lütfen yeni resim için bir bağlantı veya görsel ekleyin.`).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
            // Icon URL'yi V14'e uygun al
            const oldIcon = message.guild.iconURL({ dynamic: true, size: 1024 });
            return setIcon(message.guild, message.member, message.channel, hedefIcerik, oldIcon, embed);
        }
    }
};

/**
 * Sunucu resmini (ikonunu) değiştirir.
 */
async function setIcon(guild, member, channel, newIcon, oldIcon, embed) {
    embed.setDescription(`${member} (\`${member.id}\`) isimli yönetici sunucu resmini değiştirdi.`)
         .setThumbnail(oldIcon)
         .setImage(newIcon)
         .setColor("Random"); // V14'te color setter kullan
         
    try {
        await guild.setIcon(newIcon, `${member.user.tag} tarafından sunucu ikonu değiştirildi.`).catch(err => {}); // setIcon kullanıldı (Düzeltildi)
        await notifyAndReply(guild, member, channel, embed);
    } catch (err) {
        channel.send(`${cevaplar.prefix} Sunucu ikonu değiştirilirken hata oluştu: ${err.message}`).then(x => setTimeout(() => { x.delete().catch(e => {}) }, 7500));
    }
}

/**
 * Sunucu afişini (bannerını) değiştirir.
 */
async function setBanner(guild, member, channel, newBanner, oldBanner, embed) {
    embed.setDescription(`${member} (\`${member.id}\`) isimli yönetici sunucu afişini değiştirdi.`)
         .setThumbnail(oldBanner)
         .setImage(newBanner)
         .setColor("Random");

    try {
        await guild.setBanner(newBanner, `${member.user.tag} tarafından sunucu afişi değiştirildi.`).catch(err => {});
        await notifyAndReply(guild, member, channel, embed);
    } catch (err) {
        channel.send(`${cevaplar.prefix} Sunucu afişi değiştirilirken hata oluştu: ${err.message}`).then(x => setTimeout(() => { x.delete().catch(e => {}) }, 7500));
    }
}

/**
 * Sunucu ismini değiştirir.
 */
async function setName(guild, member, channel, newName, oldName, embed) {
    embed.setDescription(`${member} (\`${member.id}\`) isimli yönetici sunucu ismini \`${oldName}\` => \`${newName}\` olarak değiştirdi.`)
         .setColor("Random");

    try {
        await guild.setName(newName, `${member.user.tag} tarafından sunucu adı değiştirildi.`).catch(err => {});
        await notifyAndReply(guild, member, channel, embed);
    } catch (err) {
        channel.send(`${cevaplar.prefix} Sunucu adı değiştirilirken hata oluştu: ${err.message}`).then(x => setTimeout(() => { x.delete().catch(e => {}) }, 7500));
    }
}

/**
 * Log kanalına, bot sahiplerine ve komut kanalına mesaj gönderir.
 */
async function notifyAndReply(guild, member, channel, embed) {
    // Log kanalına gönder
    guild.kanalBul("guild-log")?.send({ embeds: [embed] }).catch(err => {});
    
    // Bot sahiplerine özel mesaj gönder
    if (ayarlar.staff) {
        ayarlar.staff.forEach(staffId => {
            const botOwner = guild.members.cache.get(staffId);
            if (botOwner) botOwner.send({ embeds: [embed] }).catch(x => {});
        });
    }

    // Sunucu sahibine özel mesaj gönder
    const owner = guild.members.cache.get(guild.ownerId);
    if (owner && owner.id !== member.id) { // Eğer komutu kullanan sunucu sahibi değilse
        owner.send({ embeds: [embed] }).catch(err => {});
    }

    // Komutun kullanıldığı kanala yanıt ver ve sil
    const reply = await channel.send({ embeds: [embed] }).catch(err => {});
    if (reply) {
        setTimeout(() => { reply.delete().catch(err => {}) }, 7500);
    }
}