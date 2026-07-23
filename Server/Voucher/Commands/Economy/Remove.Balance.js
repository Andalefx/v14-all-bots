const { Client, Message, MessageEmbed } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Coins = require('../../../../Global/Databases/Client.Users');
const ayarlar = require("../../../../Global/Settings/System.json")
const cevaplar = require("../../../../Global/Settings/Reply")
const emojiler = require("../../../../Global/Settings/Emoji.json")
const sistem = require("../../../../Global/Settings/System.json")
// KRİTİK NOT: 'ayarlar', 'cevaplar', 'sistem', 'emojiler' gibi değişkenlerin global olarak tanımlı veya
// komut dosyasında require edilmiş olması gerekmektedir. Bu düzeltmede bu değişkenlerin erişilebilir olduğu varsayılmıştır.

module.exports = {
    Isim: "removebalance",
    Komut: ["balremove","bal-remove","ballrev","coinsil"],
    Kullanim: "removebalance <Altın/Para> <@andale/ID> <Miktar>",
    Aciklama: "",
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
        const embed = new genEmbed();
        const authorMember = message.member;

        // Yetki Kontrolü
        if (!ayarlar.staff.includes(authorMember.id)) {
            // Hata mesajını daha okunabilir ve güvenli hale getiriyoruz.
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => { }), 5000));
        }

        /**
         * Hata mesajlarını gönderen ve otomatik silen yardımcı fonksiyon.
         * @param {string} content - Gönderilecek hata mesajı.
         */
        const sendError = (content) => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
            return message.reply({ content }).then(x => {
                setTimeout(() => x.delete().catch(err => { }), 7500);
            });
        };

        const typeArg = args[0] ? args[0].toLowerCase() : null;
        const targetId = args[1];
        let amount = Number(args[2]);

        if (!typeArg) {
            return sendError(`${cevaplar.prefix} Lütfen hangi birimden geri alacağını belirt. (Örn: \`${sistem.botSettings.Prefixs[0]}removebalance <Altın/Para> <@kullanıcı/ID> <Miktar>\` )`);
        }

        // Kullanıcıyı bulma
        // Önce etiketlenen üyeyi, sonra ID ile cache'deki üyeyi arar.
        let targetMember = message.mentions.members.first() || message.guild.members.cache.get(targetId);

        if (!targetMember) {
            return sendError(`${cevaplar.prefix} Geri almak istediğiniz bir üyeyi belirtin.`);
        }

        // Miktar Kontrolü (Rakam mı?)
        if (isNaN(amount) || amount === null) {
            return sendError(`${cevaplar.prefix} Geri almak istediğiniz miktarı rakam olarak girin.`);
        }

        // KRİTİK DÜZELTME: Miktarı en yakın tam sayıya yuvarlar ve sayı türü olarak tutar.
        // Orijinal kodda `toFixed(0)` kullanılarak miktarın string'e dönmesi engellendi.
        amount = Math.floor(amount);

        if (amount <= 0) {
            return sendError(`${cevaplar.prefix} Geri alınacak rakam birden küçük veya sıfır olamaz.`);
        }

        let transferType; // 0: Altın (Gold), 1: Para (Money)
        let currencySymbol;
        let logMessage;

        if (typeArg === "para") {
            transferType = 1; 
            logMessage = "Havadan Giden Para";
            currencySymbol = ayarlar.serverName + " Parası";
        } else if (typeArg === "altın") {
            transferType = 0; 
            logMessage = "Havadan Giden Altın";
            // Emoji, orijinal kodda olduğu gibi global emojiler objesinden çekiliyor.
            currencySymbol = message.guild.emojiGöster(emojiler.Görev.Altın); 
        } else {
            return sendError(`${cevaplar.prefix} Lütfen geçerli bir birim belirtin. (Altın veya Para)`);
        }

        // Bakiye Geri Alma İşlemi
        try {
            // Bakiye Geri Alınıyor ("remove" işlemi)
            await client.Economy.updateBalance(targetMember.id, amount, "remove", transferType);

            // Transfer Kaydı Yapılıyor (Miktar artık Number türünde)
            await Coins.updateOne(
                { _id: targetMember.id },
                {
                    $push: {
                        "Transfers": {
                            Uye: authorMember.id,
                            Tutar: amount,
                            Tarih: Date.now(),
                            Islem: logMessage
                        }
                    }
                },
                { upsert: true }
            );

            // Başarılı Mesajı
            await message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
            await message.channel.send({
                embeds: [
                    embed.setDescription(`${message.guild.emojiGöster(emojiler.Onay)} ${targetMember} üyesinden başarıyla \`${amount}\` ${currencySymbol} geri alındı.`)
                ]
            });

        } catch (error) {
            console.error("Bakiye geri alma işleminde bir hata oluştu:", error);
            // Hata oluşursa kullanıcıya bildir.
            return sendError(`${cevaplar.prefix} İşlem sırasında bir hata oluştu. Lütfen konsolu kontrol edin.`);
        }
    }
};
