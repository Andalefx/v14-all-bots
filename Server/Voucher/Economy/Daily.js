const { Client, Message, EmbedBuilder } = require("discord.js");
const Coins = require('../../../../Global/Databases/Client.Users'); // Veritabanı şemanız
const { genEmbed } = require("../../../../Global/İnit/Embed"); // Embed fonksiyonunuz (Bu fonksiyonun EmbedBuilder döndürdüğü varsayılmıştır)
const ayarlar = require("../../../../Global/Settings/System.json") // Sunucu Ayarları
const emojiler = require("../../../../Global/Settings/Emoji.json"); // Emoji Ayarları

// Kalan zamanı formatlayan yardımcı fonksiyon
const kalanzaman = (ms) => {
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / 1000 / 60) % 60);
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    let days = Math.floor(ms / (1000 * 60 * 60 * 24));

    let time = [];

    if (days > 0) time.push(`${days} gün`);
    if (hours > 0) time.push(`${hours} saat`);
    if (minutes > 0) time.push(`${minutes} dakika`);
    if (seconds > 0) time.push(`${seconds} saniye`);

    return time.join(", ");
}

// Emoji Gösterme Yardımcı Fonksiyonu
function getEmoji(guild, emojiNameOrId) {
    // Emoji ID değilse, doğrudan metin olarak döner.
    if (emojiNameOrId && emojiNameOrId.length < 18) return emojiNameOrId; 
    return guild.emojis.cache.get(emojiNameOrId) || emojiNameOrId;
}

module.exports = {
    Isim: "günlük",
    Komut: ["günlükcoin","maaş","daily"],
    Kullanim: "günlük",
    Aciklama: "24 Saatte bir belirli bir coin ödülü alırsınız.",
    Kategori: "eco",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) {

  },

   /**
   * @param {Client} client
   * @param {Message} message
   * @param {Array<String|Number>} args
   * @returns {Promise<void>}
   */

  onRequest: async function (client, message, args) {
    let embed = new genEmbed()
        
        let uye = message.guild.members.cache.get(message.member.id);
        
        // Veritabanı şeması ve mevcut sıralamaları çekme
        let Hesap = await Coins.findOne({_id: uye.id})
        
        // Tüm kullanıcıların streklerini çekme ve sıralama (Görseldeki Streaks Sıralaması için gerekli)
        // DİKKAT: Veritabanı modelinizde "Streak" adında bir alanın bulunduğu varsayılmıştır.
        let tümKullanıcılar = await Coins.find({ Streak: { $exists: true } }).sort({ Streak: -1 });
        let userRank = tümKullanıcılar.findIndex(x => x._id === uye.id) + 1;
        
        // 1. ZAMAN KONTROLÜ
        if(Hesap && Hesap.Daily) {
            let yeniGün = Hesap.Daily + (1*24*60*60*1000);
            if (Date.now() < yeniGün) {
                const iptalEmoji = getEmoji(message.guild, emojiler.Iptal);
                
                await message.react(iptalEmoji.id || iptalEmoji).catch(() => {})
                
                // Embed yerine basit yanıt gönderilmesi (görseldekinin tersi)
                return message.reply({content: `${getEmoji(message.guild, emojiler.Iptal)} Tekrardan günlük ödül alabilmen için **${kalanzaman(yeniGün - Date.now())}** beklemen gerekiyor.`}).then(x => {
                    setTimeout(() => {x.delete().catch(() => {})}, 7500)
                })
            }
        }
        
        // Ödül hesaplama (100 ile 5000 arasında)
        let Günlük = Math.random();
        Günlük = Günlük*(5000-100);
        Günlük = Math.floor(Günlük)+100

        // Streak kontrolü ve artırma (Eğer 24 saat geçtiyse)
        // Eğer günlük ödülü alıyorsa streaki artır.
        let yeniStreak = (Hesap && Hesap.Streak) ? Hesap.Streak + 1 : 1;
        
        // Veritabanı güncelleme (Günlük ödülü ve Streak'i kaydet)
        await Coins.updateOne({ _id: uye.id }, { $set: { "Daily": Date.now(), "Streak": yeniStreak }, $inc: { "Coin": Günlük } }, {upsert: true})
        
        const onayEmoji = getEmoji(message.guild, emojiler.Onay);
        await message.react(onayEmoji.id || onayEmoji).catch(() => {})

        // 2. EMBED OLUŞTURMA (Fotoğraftaki Yapıya Benzetildi)
        
        const FloryParasıEmoji = getEmoji(message.guild, emojiler.Coin); // Coin emojinizin ID'sinin 'Coin' adıyla tanımlandığı varsayılmıştır.
        const AtesEmoji = getEmoji(message.guild, emojiler.Atess || '🔥'); // Streak için bir ateş emojisi (varsayılan: 🔥)
        const CizgiEmoji = getEmoji(message.guild, emojiler.Cizgi || '📊'); // Sıralama için bir çizgi emojisi (varsayılan: 📊)
        
        let dailyEmbed = new EmbedBuilder()
            .setAuthor({ 
                name: `${message.member.user.username} ${ayarlar.SERVER.Name}`,
                iconURL: message.member.user.displayAvatarURL({ dynamic: true })
            })
            .setColor(message.member.displayHexColor || "#F8C300") // Üye rengini kullan
            .setDescription(`
**Başarıyla günlük ödülünüzü aldınız!**

Bugün ki ödülünüz: **${Günlük.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}** Majesty Parası <a:para:1516450532405805126>
Yarın tekrardan gelirsen daha güzel ödüllerle seni karşılayacağım. ${getEmoji(message.guild, emojiler.Onay)}

**Streak:** x${yeniStreak} ${AtesEmoji}
**Streak Sıralamanız:** ${userRank}. / ${tümKullanıcılar.length} ${CizgiEmoji}
            
[\`📊 Streak Sıralaması\`](https://www.youtube.com/watch?v=dQw4w9WgXcQ)
            `)
        
        // Yanıt mesajı gönderme (Görseldeki gibi sadece Embed ile)
        await message.reply({ 
            embeds: [dailyEmbed], 
            allowedMentions: { repliedUser: false } // Yanıtın görseldeki gibi sade olması için
        })
    }
};