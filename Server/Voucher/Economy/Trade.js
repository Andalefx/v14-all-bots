const { 
    Client, 
    Message, 
    EmbedBuilder, // V14: MessageEmbed yerine
    ActionRowBuilder, // V14: MessageActionRow yerine
    ButtonBuilder, // V14: MessageButton yerine
    ButtonStyle, // V14: ButtonStyle için
    ComponentType // V14: Collector için 
} = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Coins = require('../../../../Global/Databases/Client.Users');

let zaman = new Map();
let bugDeneme = new Map()

// NOT: sistem, ayarlar, kanallar, emojiler, cevaplar gibi global değişkenlerin tanımlı olduğu varsayılmıştır.

module.exports = {
    Isim: "bozdur",
    Komut: ["döviz","doviz","çevir","cevir"],
    Kullanim: "doviz <Altın/Para>",
    Aciklama: "Altın/Para birimlerini döviz kuru üzerinden dönüştürür.",
    Kategori: "eco",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) {
    // CronJob ve Dolar kuru başlatma V14'e tamamen uyumludur.
    client.dovizAltın = Math.floor(Math.random() * 3000) + 893
    client.eskiDovizAltın = client.dovizAltın - 854
    
    var CronJob = require('cron').CronJob
    let dovizCheck = new CronJob('0 0 * * *', async function() { 
        let guild = client.guilds.cache.get(sistem.SERVER.ID);
        if (!guild) return console.log("Guild bulunamadı, döviz güncellenemedi.");

        client.eskiDovizAltın = client.dovizAltın
        client.dovizAltın = Math.floor(Math.random() * 3000) + 893
        
        let chatKanalı = guild.channels.cache.get(kanallar.chatKanalı) || guild.kanalBul(kanallar.chatKanalı); // hem cache hem de kanalBul denendi
        
        if(kanallar.chatKanalı && chatKanalı) {
            chatKanalı.send({content: `:tada: **${ayarlar.serverName} Dovizden Haber! (${client.eskiDovizAltın < client.dovizAltın ? "Yeniden yükselen Altın": "Düşüyor gönlümün efendisi"})**
${client.eskiDovizAltın < client.dovizAltın ? `:chart: **Altının** değeri güncellendi! **${client.eskiDovizAltın} ${ayarlar.serverName}** Parasından, **${client.dovizAltın} ${ayarlar.serverName}** Parasına Yükseldi!
`: `:chart_with_downwards_trend:  **Altının** değeri güncellendi! **${client.eskiDovizAltın} ${ayarlar.serverName}** Parasından, **${client.dovizAltın} ${ayarlar.serverName}** Parasına Düştü!`}
**Hemen Altınlarını Çevir!** Çevirmek için ${kanallar.coinChat.map(x => guild.channels.cache.get(x) || `#${x}`)} kanalından \`${sistem.botSettings.Prefixs[0]}doviz\` komutunu kullanabilir ve çevirdiğin altını anında harcamak için oyun komutlarımıza "\`${sistem.botSettings.Prefixs[0]}yardım\` > Ekonomi Komutları" kısmından bakabilirsiniz.`,
            }).catch(err => console.log("Döviz CronJob mesajı gönderilemedi:", err));
        } 
        console.log("Doviz Güncellendi!")
    }, null, true, 'Europe/Istanbul')
    dovizCheck.start()
  },

    /**
    * @param {Client} client
    * @param {Message} message
    * @param {Array<String|Number>} args
    * @returns {Promise<void>}
    */

    onRequest: async function (client, message, args) {
        
        if(bugDeneme.get(message.member.id)) return message.reply({content: `Şuanda aktif bir "Doviz" paneliniz açık! ${cevaplar.prefix}`}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 5000);
        });
        
        bugDeneme.set(message.member.id, true)
        
        let uye = message.guild.members.cache.get(message.member.id);
        
        // V14 EmbedBuilder güncellendi
        let embed = new genEmbed()
            .setAuthor({name: uye.user.tag, iconURL: uye.user.displayAvatarURL({dynamic: true})});

        let para = await client.Economy.viewBalance(uye.id, 1)
        let altın = await client.Economy.viewBalance(uye.id, 0)
        let Altıncık = Number(client.dovizAltın)
        let Paracık = 1 // 1 altın için

        // V14: ActionRowBuilder ve ButtonBuilder kullanıldı.
        const Row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("gold")
                .setLabel(altın < Paracık ? "Yetersiz Altın" : `1 Altın 💱 ${client.dovizAltın} ${ayarlar.serverName} Parası`)
                .setDisabled(altın < Paracık)
                .setEmoji("1516450459265531914")
                .setStyle(altın < Paracık ? ButtonStyle.Danger : ButtonStyle.Secondary), // V14: ButtonStyle.Danger/Secondary
            new ButtonBuilder()
                .setCustomId("topluPara")
                .setLabel(altın < Paracık ? "Yetersiz Altın" : `Tüm Altını Paraya Çevir!`)
                .setDisabled(altın < Paracık)
                .setEmoji("1517145556269400256")
                .setStyle(altın < Paracık ? ButtonStyle.Danger : ButtonStyle.Secondary), // V14: ButtonStyle.Danger/Secondary
        )
        
        const Row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("para")
                .setLabel(para < Altıncık ? "Yetersiz Para" : `${client.dovizAltın} ${ayarlar.serverName} Parası 💱 1 Altın`)
                .setDisabled(para < Altıncık)
                .setEmoji("1517145556269400256")
                .setStyle(para < Altıncık ? ButtonStyle.Danger : ButtonStyle.Secondary), // V14: ButtonStyle.Danger/Secondary
            new ButtonBuilder()
                .setCustomId("topluAltın")
                .setLabel(para < Altıncık ? "Yetersiz Para" : `Tüm Paranı Altına Çevir!`)
                .setDisabled(para < Altıncık)
                .setEmoji("1516450459265531914")
                .setStyle(para < Altıncık ? ButtonStyle.Danger : ButtonStyle.Secondary), // V14: ButtonStyle.Danger/Secondary
        )

        // Embed İçeriği
        const embedDescription = `**Merhaba!** __${ayarlar.serverName}__ Doviz işlemleri menüsüne hoş geldiniz.
**${ayarlar.serverName} Doviz**'de gün içerisinde artan ve çıkan altın arttırımlarını buradan dönüştürebilir veya da işlemde bulunabilirsiniz. :currency_exchange:
Şuan ki duruma göre 1 Altın, **${client.dovizAltın} ${ayarlar.serverName} Parasına** eş değer olarak kabul edildi!

${client.eskiDovizAltın < client.dovizAltın ? `**Altının** değeri: 
**${client.eskiDovizAltın} ${ayarlar.serverName}** Parasından
💹 
**${client.dovizAltın} ${ayarlar.serverName}** Parasına Yükselmiş!
`: `
**Altının** değeri: 
**${client.eskiDovizAltın} ${ayarlar.serverName}** Parasından 
📉 
**${client.dovizAltın} ${ayarlar.serverName}** Parasına Düşmüş!`}
`;
        
        // V14: Mesaj gönderme
        message.reply({
            components: [Row2, Row], 
            embeds: [embed.setDescription(embedDescription)]
        }).then(async (msg) => {
            const filter = i => i.user.id == message.member.id 
            
            // V14: ComponentType kullanıldı
            const collector = msg.createMessageComponentCollector({ 
                filter,  
                time: 30000 
            })

            collector.on('collect', async i => {
                await i.deferUpdate().catch(err => {}); // Etkileşim yanıtı hemen gönderildi.

                // Hız Limiti Kontrolü
                if (zaman.get(message.author.id) >= 1) {
                    msg.delete().catch(err => {});
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                    return i.followUp({content: `${cevaplar.prefix} Doviz işlemleri sadece **15 Saniye** aralığla yapılabilir. **Lütfen Daha Sonra Tekrar Deneyin!**`, ephemeral: true});
                }
                
                let işlemMiktarı;
                let islemAciklama;
                let logIslem;
                let yeniPara = await client.Economy.viewBalance(uye.id, 1)
                let yeniAltın = await client.Economy.viewBalance(uye.id, 0)
                
                // --- Tek Altın Satın Alma (Para harcayıp Altın alma) ---
                if(i.customId == "para" && yeniPara >= Altıncık) {
                    await client.Economy.updateBalance(uye.id, Altıncık, "remove", 1)
                    await client.Economy.updateBalance(uye.id, Paracık, "add", 0)
                    işlemMiktarı = Paracık;
                    islemAciklama = `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla \`${Altıncık} ${ayarlar.serverName} Parası => ${Paracık.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} Altın\` olarak doviz kuru tarafıyla dönüştürüldü.`;
                    logIslem = "Altın (Dönüştürülen Para)";
                } 
                // --- Tek Altın Satma (Altın harcayıp Para alma) ---
                else if(i.customId == "gold" && yeniAltın >= Paracık) {
                    await client.Economy.updateBalance(uye.id, Paracık, "remove", 0)
                    await client.Economy.updateBalance(uye.id, Altıncık, "add", 1)
                    işlemMiktarı = Number(Altıncık);
                    islemAciklama = `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla \`${Paracık.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} Altın => ${Altıncık} ${ayarlar.serverName} Parası\` olarak doviz kuru tarafıyla dönüştürüldü.`;
                    logIslem = "Para (Dönüştürülen Altın)";
                }
                // --- Toplu Altın Satma (Tüm Altını Paraya Çevir) ---
                else if(i.customId == "topluPara" && yeniAltın >= Paracık) { 
                    let alıncakAltın = yeniAltın // Tüm altın
                    let verilcekPara = Math.floor(alıncakAltın * Altıncık) // Altın * Kur
                    
                    if (verilcekPara === 0) return i.followUp({content: `Hiç Altınınız bulunmamaktadır.`, ephemeral: true})

                    await client.Economy.updateBalance(uye.id, Number(alıncakAltın), "remove", 0)
                    await client.Economy.updateBalance(uye.id, Number(verilcekPara), "add", 1)
                    işlemMiktarı = verilcekPara;
                    islemAciklama = `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla \`${alıncakAltın.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} Altın => ${verilcekPara} ${ayarlar.serverName} Parası\` olarak doviz kuru tarafıyla dönüştürüldü.`;
                    logIslem = `Para (Toplu Doviz) [${alıncakAltın} Altın]`;
                }
                // --- Toplu Altın Satın Alma (Tüm Parayı Altına Çevir) ---
                else if(i.customId == "topluAltın" && yeniPara >= Altıncık) {
                    let alıncakPara = yeniPara // Tüm para
                    let verilcekAltın = Math.floor(alıncakPara / Altıncık) // Para / Kur

                    if (verilcekAltın === 0) return i.followUp({content: `Altın satın almak için yeterli paranız bulunmamaktadır. (1 Altın = ${Altıncık} Para)`, ephemeral: true})
                    
                    await client.Economy.updateBalance(uye.id, Number(alıncakPara), "remove", 1)
                    await client.Economy.updateBalance(uye.id, Number(verilcekAltın), "add", 0)
                    işlemMiktarı = verilcekAltın;
                    islemAciklama = `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla \`${alıncakPara.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} ${ayarlar.serverName} Parası => ${verilcekAltın} Altın\` olarak doviz kuru tarafıyla dönüştürüldü.`;
                    logIslem = `Altın (Toplu Doviz) [${alıncakPara} Para]`;
                } else {
                    return i.followUp({content: `Yeterli bakiyeniz bulunmamaktadır.`, ephemeral: true});
                }

                // Başarılı İşlem Sonrası
                if(işlemMiktarı) {
                    await Coins.updateOne({_id: uye.id}, { $push: { "Transfers": { Uye: uye.id, Tutar: işlemMiktarı, Tarih: Date.now(), Islem: logIslem } }}, {upsert: true}).catch(err => {});
                    await message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
                    msg.delete().catch(err => {})
                    await message.channel.send({embeds: [embed.setDescription(islemAciklama)]}).catch(err => {});
                    
                    // Cooldown Uygulama
                    zaman.set(message.author.id, (zaman.get(message.author.id) || 1));
                    bugDeneme.delete(message.member.id)
                    setTimeout(() => {
                        zaman.delete(message.author.id)
                    }, 1000 * 15) // 15 saniye cooldown
                }
            })

            collector.on("end", i => {
                msg.delete().catch(err => {})
                bugDeneme.delete(message.member.id)
            })
        })
    }
};