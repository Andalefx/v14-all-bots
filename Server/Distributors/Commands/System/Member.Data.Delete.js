const { Client, Message, User } = require("discord.js"); // User importu eklendi, her ihtimale karşı
const Kullanıcı = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Stats = require('../../../../Global/Databases/Client.Users.Stats');

module.exports = {
    Isim: "üyesıfırla",
    Komut: ["date-user-delete", "kayıt-temizle", "register-data-delete","üyetemizle"],
    Kullanim: "kayıt-temizle",
    Aciklama: "Belirtilen ceza numarasının bütün bilgilerini gösterir.",
    Kategori: "-",
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
        // Üyeyi cache'ten bulma
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        
        // Eğer cache'te yoksa ve argüman varsa, ID ile kullanıcı/üye getirmeye çalış
        if (!uye && args[0]) {
            // Orijinal kodda client.getUser() kullanılmış. Bu, özel bir fonksiyondur. 
            // Eğer özel tanımlı değilse, standart v14 metodu client.users.fetch'dir.
            // Özel fonksiyonu koruyarak devam ediyoruz.
            uye = await client.getUser(args[0]) || await message.guild.members.fetch(args[0]).catch(e => { /* Hata görmezden gelindi */ });
        }
        
        if(!uye) return message.channel.send(`${message.guild.emojiGöster(emojiler.Iptal)} Bir üye belirtmelisin.`)
        
        // Veritabanı kontrolü ve silme işlemleri v14'ten bağımsızdır.
        if(!await Kullanıcı.findOne({ _id: uye.id })) return message.channel.send(`${cevaplar.prefix} ${uye} profiline sahip üyenin sunucu üzerinde verisi bulunamadı.`);
        
        // Varsayılan Kullanıcı modeline eklenmiş bir Delete() fonksiyonu olduğunu varsayıyoruz.
        if (uye.Delete) await uye.Delete(); 
        
        await Stats.deleteOne({userID: uye.id})
        await Kullanıcı.deleteOne({_id: uye.id});
        
        await message.channel.send({embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay)} ${uye} üyesinin tüm verileri ve tüm kayıt bilgileri sunucudan temizlendi.`)]})
        await message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined)
    }
};