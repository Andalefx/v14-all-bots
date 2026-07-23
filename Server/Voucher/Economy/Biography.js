const { Client, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, MessageSelectMenu } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Upstaff = require('../../../../Global/Databases/Client.Users')
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings')

// Not: 'client.Economy', 'emojiler', 'cevaplar' gibi objelerin/metotların
// dışarıdan erişilebilir (global veya client'a eklenmiş) olduğunu varsayıyorum.

module.exports = {
    Isim: "bio",
    Komut: ["biyografi", "bio", "biography"],
    Kullanim: "biyografi <[En az: 5, En fazla: 120]>",
    Aciklama: "Kullanıcının biyografisini ayarlar, günceller veya altın karşılığı satar.",
    Kategori: "eco",
    Extend: true,
    
    /**
     * @param {Client} client 
     */
    onLoad: async function (client) {
        
    },

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array<String>} args 
     */

    onRequest: async function (client, message, args) {
        let currentGold = await client.Economy.viewBalance(message.member.id, 0) || 0;
        const requiredGoldForUpdate = 1;
        const requiredGoldForBuy = 5;
        const sellGold = 2;

        const canUpdate = currentGold >= requiredGoldForUpdate;

        // Butonları V14 Builder formatında oluşturma
        const updateButton = new ButtonBuilder()
            .setCustomId("değiştir")
            .setLabel(canUpdate ? "💭 Biyografi Güncelleme" : "Güncelleyemezsin! (1 Altın Gerekli)")
            .setDisabled(!canUpdate)
            .setStyle(ButtonStyle.Primary);

        const sellButton = new ButtonBuilder()
            .setCustomId("sat")
            .setLabel(`💵 ${sellGold} Altın'a Geri Sat`)
            .setStyle(ButtonStyle.Secondary);

        // Action Row oluşturma (V14 Builder formatı)
        let ownedbio = new ActionRowBuilder().addComponents(updateButton, sellButton);
        
        let acheck = await Upstaff.findOne({ _id: message.member.id });
        
        // --- BİYOGRAFİSİ VARSA (GÜNCELLEME/SATMA) ---
        if (acheck && acheck.Biography) {
            
            const bioEmbed = new genEmbed()
                .setDescription(`Daha önce biyografi satın almışsın! :tada:\nŞuan ki biyografin: \`${acheck.Biography}\``)
                .setColor("Yellow")
                .setAuthor({ name: message.member.user.tag, iconURL: message.member.user.displayAvatarURL({ dynamic: true }) });

            message.reply({ embeds: [bioEmbed], components: [ownedbio] }).then(async msg => {
                var filter = (i) => i.user.id == message.member.id && (i.customId == "sat" || i.customId == "değiştir");
                let collector = msg.createMessageComponentCollector({ filter: filter, time: 60000 });
                
                collector.on('collect', async (i) => {
                    if (i.customId == "sat") {
                        await client.Economy.updateBalance(message.member.id, sellGold, "add", 0); // Gold ekleme
                        await Upstaff.updateOne({ _id: message.member.id }, { $unset: { "Biography": "" } });
                        
                        await i.reply({ content: `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla **${sellGold} Altın** fiyatına biyografini sattın.`, ephemeral: true });
                        
                        msg.delete().catch(err => {});
                        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
                    }

                    if (i.customId == "değiştir") {
                        if (!canUpdate) {
                            return i.reply({ content: `${cevaplar.prefix} **Başarısız!** Biyografini değiştirmeye yeteri kadar altın bulunamadı.`, ephemeral: true }).catch(err => {});
                        }
                        
                        msg.delete().catch(err => {});
                        
                        const promptEmbed = new genEmbed()
                            .setAuthor({ name: message.member.user.tag, iconURL: message.member.user.displayAvatarURL({ dynamic: true }) })
                            .setColor("Green")
                            .setDescription(`${message.guild.emojiGöster(emojiler.Tag)} Lütfen yeni bir biyografi belirleyiniz. En az 5 karakter en fazla 120 karakter olmak üzere.`)
                            .setFooter({ text: `işlemi iptal etmek için "iptal" yazabilirsiniz.` });

                        message.channel.send({ embeds: [promptEmbed] }).then(mesaj => {
                            var filter = (m) => m.author.id == message.member.id;
                            let textCollector = mesaj.channel.createMessageCollector({ filter: filter, time: 60000, max: 1, errors: ["time"] });
                            
                            textCollector.on('collect', async (m) => {
                                if (m.content.toLowerCase() === "iptal") {
                                    mesaj.delete().catch(err => {});
                                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                                    return m.reply({ content: `${cevaplar.prefix} İşlem istek üzerine iptal edildi.`, ephemeral: true }).catch(err => {});
                                }

                                // Tekrar altın kontrolü
                                let newGoldCheck = await client.Economy.viewBalance(message.member.id, 0) || 0;
                                if (newGoldCheck < requiredGoldForUpdate) {
                                    mesaj.delete().catch(err => {});
                                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                                    return m.reply({ content: `${cevaplar.prefix} **Başarısız!** Biyografini değiştirmeye yeteri kadar altın bulunamadı.`, ephemeral: true }).catch(err => {});
                                }

                                // Karakter uzunluğu kontrolü
                                if (m.content.length < 5 || m.content.length > 120) {
                                    mesaj.delete().catch(err => {});
                                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                                    // Hatalı yazılan mreply düzeltildi: m.reply olmalı.
                                    return m.reply({ content: `${cevaplar.prefix} **Başarısız!** Çok kısa veya çok uzun bir biyografi seçildi ve işlem iptal edildi.`, ephemeral: true }).catch(err => {});
                                }

                                mesaj.delete().catch(err => {});
                                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
                                
                                // Altın düşürme ve biyografi güncelleme
                                await client.Economy.updateBalance(message.member.id, requiredGoldForUpdate, "remove", 0); // Gold düşürme
                                await Upstaff.updateOne({ _id: message.member.id }, { $set: { "Biography": m.content } }, { upsert: true });
                                
                                m.reply({ content: `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla yeni biyografiniz \`${m.content}\` olarak belirlendi. **(1 Altın Kesildi)**`, ephemeral: true }).catch(err => {});
                            });
                        });
                    }
                });
                
                // Koleksiyoncu zaman aşımına uğradığında mesajı sil
                collector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        msg.edit({ content: "İşlem süresi doldu.", components: [] }).catch(err => {});
                        setTimeout(() => msg.delete().catch(err => {}), 5000);
                    }
                });
            });

            return;
        }
        
        // --- BİYOGRAFİSİ YOKSA (SATIN ALMA) ---
        
        // Altın Kontrolü
        if (currentGold < requiredGoldForBuy) {
            return message.reply({ content: `${message.guild.emojiGöster(emojiler.Iptal)} **Başarısız!** Gereken **${requiredGoldForBuy} Altın** bulunamadığından satın alamazsın!`, ephemeral: true }).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                setTimeout(() => {
                    x.delete().catch(err => {});
                }, 7500);
            });
        }
        
        let bio = args.join(" ");

        // Biyografi Boş Kontrolü
        if (!bio) {
            return message.reply({ content: `${message.guild.emojiGöster(emojiler.Iptal)} **Başarısız!** Bir biyografi belirlenmedi! (**En az**: \` 5 \`, **En fazla**: \` 120 \`)`, ephemeral: true }).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                setTimeout(() => {
                    x.delete().catch(err => {});
                }, 7500);
            });
        }

        // Biyografi Uzunluk Kontrolü
        if (bio.length > 120) {
            return message.reply({ content: `${message.guild.emojiGöster(emojiler.Iptal)} **Başarısız!** Çok uzun bir biyografi mesajı! (**En az**: \` 5 \`, **En fazla**: \` 120 \`)`, ephemeral: true }).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                setTimeout(() => {
                    x.delete().catch(err => {});
                }, 7500);
            });
        }

        if (bio.length < 5) {
            return message.reply({ content: `${message.guild.emojiGöster(emojiler.Iptal)} **Başarısız!** Çok kısa bir biyografi mesajı! (**En az**: \` 5 \`, **En fazla**: \` 120 \`)`, ephemeral: true }).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
                setTimeout(() => {
                    x.delete().catch(err => {});
                }, 7500);
            });
        }

        // Altın düşürme ve biyografi kaydetme
        await client.Economy.updateBalance(message.member.id, requiredGoldForBuy, "remove", 0); // Gold düşürme
        await Upstaff.updateOne({ _id: message.member.id }, { $set: { "Biography": bio } }, { upsert: true });

        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
        message.reply({ embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla **${requiredGoldForBuy} Altın** karşılığı biyografin \`${bio}\` olarak ayarlandı.`)] }).then(x => {
            setTimeout(() => {
                x.delete().catch(err => {});
            }, 15000);
        });
    }
};

// Bu fonksiyon komut içinde kullanılmadığı için dışarıda bırakıldı veya silinebilir. 
// Orijinal kodda olduğu gibi dışarıda bırakılmıştır.
function secretOluştur(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}