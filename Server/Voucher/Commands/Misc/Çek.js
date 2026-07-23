const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine
    ActionRowBuilder, // MessageActionRow yerine
    ButtonBuilder, // MessageButton yerine
    ButtonStyle, // Buton stilleri için
    PermissionsBitField
} = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

// Varsayım: 'cevaplar', 'emojiler', ve 'roller' global olarak erişilebilir durumdadır.


module.exports = {
    Isim: "çek",
    Komut: ["çek", "izinliçek","cek","izinlicek"],
    Kullanim: "izinliçek @andale/ID",
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
        // V14: EmbedBuilder kullanımı
        let embed = new genEmbed();
        
        // Üye ve ses kanalı kontrolleri
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        const uye = member; // Kolaylık için uye değişkeni aynı üyeyi işaret ediyor

        if (!message.member.voice.channel) return message.reply(`${global.cevaplar.prefix} Bir ses kanalında olman lazım.`).then(x => { setTimeout(() => {x.delete().catch(err => {}) }, 7500)});
        if (!member) return message.reply(`${global.cevaplar.prefix} Bir üye belirtmelisin.`).then(x => { setTimeout(() => { x.delete().catch(err => {}) }, 7500)});
        if (message.member.id === member.id) return message.reply(`${global.cevaplar.prefix} Kendini çekemezsin!`).then(x => { setTimeout(() => { x.delete().catch(err => {}) }, 7500)});
        if (message.member.voice.channel.id === member.voice.channel.id) return message.reply(`${global.cevaplar.prefix} Belirttiğin üyeyle aynı kanaldasın!`).then(x => { setTimeout(() => { x.delete().catch(err => {}) }, 7500)});
        if (!member.voice.channel) return message.reply(`${global.cevaplar.prefix} Belirtilen üye herhangi bir ses kanalında değil!`).then(x => { setTimeout(() => { x.delete().catch(err => {}) }, 7500)});
        if (member.user.bot) return message.reply(global.cevaplar.bot).then(x => { setTimeout(() => {x.delete().catch(err => {}) }, 7500)});

        // ROL KARŞILAŞTIRMASI (ÇEKİLECEK ÜYE > ÇEKEN ÜYE)
        if (message.member.roles.highest.position < uye.roles.highest.position) { 
            
            // V14: ButtonBuilder ve ActionRowBuilder kullanımı
            let Row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setCustomId("kabulet")
                .setLabel("Kabul Et")
                .setEmoji(message.guild.emojiGöster(global.emojiler.Onay).id || "✅")
                .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                .setCustomId("reddet")
                .setLabel("Reddet")
                .setEmoji(message.guild.emojiGöster(global.emojiler.Iptal).id || "❌")
                .setStyle(ButtonStyle.Danger)
            );
            
            message.channel.send({
                content: `${uye.toString()}`, 
                embeds: [embed.setDescription(`${member}, ${message.author} adlı üye \`${message.member.voice.channel.name}\` odasına seni çekmek istiyor.\nKabul ediyor musun?`)], 
                components: [Row]
            }).then(async (msg) => {
                var filter = (i) => i.user.id == uye.id;
                let collector = msg.createMessageComponentCollector({filter: filter, time: 30000});

                collector.on('collect', async (i) => {
                    if(i.customId == "kabulet") {
                        await i.deferUpdate().catch(err => {});
                        collector.stop(); // Koleksiyonu durdur

                        await msg.edit({
                            content: `${message.member.toString()}`, 
                            embeds: [embed.setDescription(`${message.guild.emojiGöster(global.emojiler.Onay)} ${uye}, isimli üye senin odaya çekme isteğini kabul etti.`)], 
                            components: []
                        }).catch(err => {});
                        
                        await uye.voice.setChannel(message.member.voice.channel.id).catch(err => {});
                        message.react(message.guild.emojiGöster(global.emojiler.Onay) ? message.guild.emojiGöster(global.emojiler.Onay).id : undefined).catch(err => {});
                        
                        setTimeout(() => { msg.delete().catch(err => {}) }, 12000);
                    }
                    
                    if(i.customId == "reddet") {
                        await i.deferUpdate().catch(err => {});
                        collector.stop(); // Koleksiyonu durdur

                        await msg.edit({
                            content: `${message.member.toString()}`, 
                            embeds: [embed.setDescription(`${message.guild.emojiGöster(global.emojiler.Iptal)} ${uye}, isimli üye senin odaya çekme isteğini reddetti!`)], 
                            components: []
                        }).catch(err => {});
                        
                        message.react(message.guild.emojiGöster(global.emojiler.Iptal) ? message.guild.emojiGöster(global.emojiler.Iptal).id : undefined).catch(err => {});
                        
                        setTimeout(() => { msg.delete().catch(err => {}) }, 12000);
                    }
                });
                
                collector.on('end', async (collected, reason) => {
                    if (reason === 'time') {
                        let RowTwo = new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                            .setCustomId("zaman_asimi")
                            .setLabel("Zaman Aşımı!")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                        );
                        
                        await msg.edit({
                            content: `${message.member.toString()}`, 
                            embeds: [embed.setDescription(`${message.guild.emojiGöster(global.emojiler.Iptal)} ${message.author}, ${uye} isimli üye tepki vermediğinden dolayı işlem iptal edildi.`)], 
                            components: [RowTwo]
                        }).catch(err => {});
                        
                        setTimeout(() => { msg.delete().catch(err => {}) }, 12000);
                    }
                });
            });

        // ROL KARŞILAŞTIRMASI (ÇEKEN ÜYE > ÇEKİLECEK ÜYE VEYA KURUCU/ADMİN)
        } else {
            // Yeterli yetkiye sahipse (Daha yüksek rol, Kurucu Rolü veya Yönetici izni)
            if (global.roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                
                await uye.voice.setChannel(message.member.voice.channel.id).catch(err => {});
                message.react(message.guild.emojiGöster(global.emojiler.Onay) ? message.guild.emojiGöster(global.emojiler.Onay).id : undefined).catch(err => {});
                
                return message.channel.send({
                    embeds: [embed.setDescription(`${message.guild.emojiGöster(global.emojiler.Onay)} ${message.member} isimli yetkili ${member} isimli üyeyi \`${message.member.voice.channel.name}\` isimli odaya çekti!`)]
                }).then(x => setTimeout(() => {
                    x.delete().catch(err => {})
                }, 7500));
            } else {
                // Not: Eğer buraya düşüyorsa, rolü düşük olduğu halde *izinli çek* mekanizması dışında bir şekilde komutu kullanmıştır. 
                // Normalde ilk if bloğu bunu yakalar, ama ekstra güvenlik için.
                message.reply(`${global.cevaplar.prefix} Bu üyeyi çekmek için yeterli yetkiye sahip değilsiniz veya izin isteme mekanizması çalışmadı.`).then(x => { setTimeout(() => { x.delete().catch(err => {}) }, 7500)});
            }
        }
    }
};