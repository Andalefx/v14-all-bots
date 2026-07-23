const { Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
// V14: MessageEmbed, MessageButton, MessageActionRow yerine yukarıdaki importlar kullanıldı.

const { genEmbed } = require("../../../../Global/İnit/Embed");
// Varsayım: 'roller', 'cevaplar' ve 'emojiler' değişkenlerinin erişilebilir olduğu varsayılmıştır.
const roller = global.roller || require("../../../../Global/Settings/Roles.json"); 
const cevaplar = global.cevaplar || require("../../../../Global/Settings/Reply"); 
const emojiler = global.emojiler || require("../../../../Global/Settings/Emoji.json");
module.exports = {
    Isim: "git",
    Komut: ["git", "izinligit"],
    Kullanim: "izinligit @andale/ID",
    Aciklama: "Belirlenen üyeye izin ile yanına gider.",
    Kategori: "diğer",
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
        // genEmbed'in EmbedBuilder döndürdüğü varsayılmıştır.
        let embed = new genEmbed();
        
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        // member değişkeni zaten 'uye' ile aynı, gerek yok ama kodun orijinaline sadık kalındı.
        let member = uye 
        
        // Hata Kontrolleri
        if (!message.member.voice.channel) return message.reply({content: `${cevaplar.prefix} Bir ses kanalında olman lazım.`}).then(x => { setTimeout(() => {x.delete().catch(e => {}) }, 7500)});
        if (!uye) return message.reply({content: `${cevaplar.prefix} Bir üye belirtmelisin.`}).then(x => { setTimeout(() => { x.delete().catch(e => {}) }, 7500)});
        if (message.member.id === uye.id) return message.reply({content: `${cevaplar.prefix} Kendinin yanına da gitmezsin!`}).then(x => { setTimeout(() => { x.delete().catch(e => {}) }, 7500)});
        if (message.member.voice.channel === uye.voice.channel) return message.reply({content: `${cevaplar.prefix} Belirttiğin üyeyle aynı kanaldasın!`}).then(x => { setTimeout(() => { x.delete().catch(e => {}) }, 7500)});
        if (!member.voice.channel) return message.reply({content: `${cevaplar.prefix} Belirtilen üye herhangi bir ses kanalında değil!`}).then(x => { setTimeout(() => { x.delete().catch(e => {}) }, 7500)});
        if (uye.user.bot) return message.reply({content: cevaplar.bot}).then(x => { setTimeout(() => {x.delete().catch(e => {}) }, 7500)});
        
        // Yönetici/Kurucu Kontrolü (İzin istemeden direk gitme)
        if (message.member.permissions.has('Administrator') || roller.kurucuRolleri.some(x => message.member.roles.cache.has(x))) {
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
            
            // Üyeyi taşımayı dene
            await message.member.voice.setChannel(uye.voice.channel.id).catch(err => {})
            
            return message.reply({embeds: [embed.setDescription(`${message.guild.emojiGöster(emojiler.Onay)} ${message.member} isimli yetkili ${uye} (\`${uye.voice.channel.name}\`) isimli üyenin odasına gitti!`)]}).then(x => setTimeout(() => {
                x.delete().catch(err => {})
            }, 7500))
        }

        // Normal Kullanıcı İşlemleri (İzin İstemeden Gitme)

        // V14 Butonları ve ActionRow
        let Row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId("kabulet")
            .setLabel("Kabul Et")
            .setEmoji(message.guild.emojiGöster(emojiler.Onay).id || message.guild.emojiGöster(emojiler.Onay)) // Emoji ID'si veya metin
            .setStyle(ButtonStyle.Secondary), // V14: String yerine Enum
            new ButtonBuilder()
            .setCustomId("reddet")
            .setLabel("Reddet")
            .setEmoji(message.guild.emojiGöster(emojiler.Iptal).id || message.guild.emojiGöster(emojiler.Iptal)) // Emoji ID'si veya metin
            .setStyle(ButtonStyle.Danger) // V14: String yerine Enum
        )    
        
        const requestEmbed = new genEmbed().setDescription(`${uye}, ${message.author} adlı üye \`${uye.voice.channel.name}\` adlı odanıza gelmek istiyor.\nKabul ediyor musun?`);
        
        message.channel.send({content: `${uye.toString()}`, embeds: [requestEmbed], components: [Row]}).then(async (msg) => {
            var filter = (i) => i.user.id == uye.id
            let collector = msg.createMessageComponentCollector({filter: filter, time: 30000})

            collector.on('collect', async (i) => {
                if(i.customId == "kabulet") {
                    // Buton etkileşimini bildir
                    await i.deferUpdate().catch(err => {})
                    
                    // Başarılı Mesajı
                    await msg.edit({content: `${message.member.toString()}`, embeds: [embed.setDescription(`${message.guild.emojiGöster(emojiler.Onay)} ${message.author}, ${uye} isimli üye senin odaya gelme isteğini kabul etti.`)], components: []}).catch(err => {})
                    
                    // Üyeyi taşı
                    await message.member.voice.setChannel(uye.voice.channel.id).catch(err => {})
                    
                    message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
                    
                    // Mesajı sil
                    setTimeout(() => {
                        msg.delete().catch(err => {})
                    }, 12000);
                }
                if(i.customId == "reddet") {
                    // Buton etkileşimini bildir
                    await i.deferUpdate().catch(err => {})
                    
                    // Reddetme Mesajı
                    await msg.edit({content: `${message.member.toString()}`, embeds: [embed.setDescription(`${message.guild.emojiGöster(emojiler.Iptal)} ${message.author}, ${uye} isimli üye senin odaya gelme isteğini reddetti!`)], components: []}).catch(err => {})
                    
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {})
                    
                    // Mesajı sil
                    setTimeout(() => {
                        msg.delete().catch(err => {})
                    }, 12000);
                }
                collector.stop(); // İşlem tamamlanınca koleksiyoncuyu durdur
            })

            collector.on('end', async (collected, reason) => {
                if(reason === 'time' && msg && msg.editable) {
                    // Zaman Aşımı Mesajı ve Butonu
                    let RowTwo = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                        .setCustomId("zaman_asimi") // ID değiştirildi
                        .setLabel("Zaman Aşımı!")
                        .setEmoji(message.guild.emojiGöster(emojiler.Iptal).id || message.guild.emojiGöster(emojiler.Iptal))
                        .setStyle(ButtonStyle.Secondary) 
                        .setDisabled(true),
                    )  
                    
                    await msg.edit({content: `${message.member.toString()}`, embeds: [embed.setDescription(`${message.guild.emojiGöster(emojiler.Iptal)} ${message.author}, ${uye} isimli üye tepki vermediğinden dolayı işlem iptal edildi. (Zaman aşımı)`)]
                    , components: [RowTwo]}).catch(err => {})
                    
                    setTimeout(() => {
                        msg.delete().catch(err => {})
                    }, 12000);
                }
                // i.delete() çağrısı koleksiyoncu bitince yapılamaz, mesaj zaten silinmiştir.
            })
        })

    }
};