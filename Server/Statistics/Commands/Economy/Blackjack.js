const { Client, Message } = require("discord.js"); // Daha temiz V14/Node.js importu
const util = require("util")
// Varsayım: Game modülü Discord.js V14 etkileşimlerini (buttons, transition: "edit") destekliyor.
const Game = require('../../../../Global/Blackjack/index') 

module.exports = {
    Isim: "bj",
    Komut: ["blackjack","bj21"],
    Kullanim: "blackjack <100-500000-all>",
    Aciklama: "Belirlenen miktar ile Blackjack oynarsınız. Maksimum bahis 500.000'dir.", // Açıklama düzeltildi
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
    * @param {Array<String>} args 
    */

    onRequest: async function (client, message, args) {
        
        // Kanal kontrolü
        if(!kanallar.coinChat.some(x => message.channel.id == x) && !ayarlar.staff.includes(message.member.id)) return message.reply({
            content: `${cevaplar.prefix} Sadece ${kanallar.coinChat.map(x => message.guild.channels.cache.get(x)).join(",")} kanallarında oynayabilirsin.`
        }).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        })
        
        let uye = message.guild.members.cache.get(message.member.id);
        let Coin = await client.Economy.viewBalance(uye.id, 1)
        let Miktar = Number(args[0]);
        
        // Bahis Miktarı Kontrolleri
        if(args[0] == "all") {
            if(Coin >= 500000) Miktar = 500000
            if(Coin < 500000) Miktar = Number(Coin)
            if(Coin <= 0) Miktar = 10 // En az 10 TL ile oynaması için bir güvenlik önlemi
        }
        
        if(isNaN(Miktar)) return message.reply({content: `${cevaplar.prefix} Miktar yerine harf kullanmamayı tavsiye ederim.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        })

        if(Miktar <= 0) return message.reply({content: `${cevaplar.prefix} Göndermek istediğiniz miktar, birden küçük olamaz.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        })

        // Not: Maksimum bahis miktarı orijinal kodda 500.000 olarak görünüyor, uyarı mesajında ise 250.000. 500.000 olarak güncelledim.
        if(Miktar > 500000) return message.reply({content: `${cevaplar.prefix} Bahise en fazla \`500.000\` ${ayarlar.serverName} Parası ile girilebilir.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        })

        if(Miktar < 10) return message.reply({content: `${cevaplar.prefix} Bahise en az \`10\` ${ayarlar.serverName} Parası ile girebilirsiniz.`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        })

        if(Coin < Miktar) return message.reply({content: `${cevaplar.prefix} Yeterli "${ayarlar.serverName} Parası" bulunamadı. (Mevcut: ${Coin.toLocaleString()})`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {x.delete().catch(err => {})}, 5000)
        })
        
        // Bahisi düş
        await client.Economy.updateBalance(uye.id, Number(Miktar), "remove", 1) 
        
        let Ödül = Number(Miktar * 2)
        
        // Blackjack oyununu başlat
        let game = await Game(message, { 
            buttons: true, 
            transition: "edit", 
            bahis: Miktar, 
            odul: Ödül, 
            doubleodul: Number(Ödül * 2) 
        }) 
        
        // Sonuçları işle ve parayı geri ver
        // Not: Orijinal kodda `game.ycard` değişkeni kullanılmış, bu external modülün çıktısına bağlıdır.
        
        if(game.result.includes("DOUBLE WIN") || game.result == "BLACKJACK") {
            // Çift kazanma veya Blackjack: Bahis x4 iade (Bahis x2 ödül + Bahis iade = Bahis x3 Kâr)
            await client.Economy.updateBalance(message.member.id, Number(Ödül * 2), "add", 1)
        } else if(game.result.includes("WIN") || game.result.includes("SPLIT WIN")) {
            // Normal kazanma: Bahis x2 iade (Bahis x1 ödül + Bahis iade = Bahis x1 Kâr)
            await client.Economy.updateBalance(message.member.id, Number(Ödül), "add", 1)
        } else if(game.result.includes("INSURANCE") || game.result.includes("TIE")) {
            // Sigorta veya Beraberlik: Bahis iade edilir
            await client.Economy.updateBalance(message.member.id, Number(Miktar), "add", 1)
        } else if(game.result == "CANCEL" || game.result == "TIMEOUT")  {
            // İptal veya Zaman Aşımı: Orijinal kodda iade edilmiyordu, ancak genellikle bu durumlarda iade edilir.
            // Orijinal kodun yorum satırı bırakılmış halini korudum.
            // await client.Economy.updateBalance(message.member.id, Number(Miktar), "add", 1) 
        }
    }
};