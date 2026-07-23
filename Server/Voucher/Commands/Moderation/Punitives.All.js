const { 
    Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits
} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const moment = require('moment');
require('moment-duration-format');
require('moment-timezone');
const ms = require('ms');

module.exports = {
    Isim: "tümcezalar",
    Komut: ["tümcezalar","soncezalar","son-cezalar","tumcezalar"],
    Kullanim: "soncezalar",
    Aciklama: "Sunucudaki son cezaların listesini gösterir (Sayfalı).",
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
        // V14 Yetki Kontrolü
        const hasAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        if(!roller.Yetkiler.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !hasAdmin) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // V14 ButtonBuilder Kullanımı
        const button1 = new ButtonBuilder()
            .setCustomId('geri')
            .setLabel('◀ Geri')
            .setStyle(ButtonStyle.Primary); // V14 Enum
            
        const buttonkapat = new ButtonBuilder()
            .setCustomId('kapat')
            // Burada emoji ID'si kullanılmış. Eğer emoji sunucuda varsa çalışır, yoksa sadece isim kullanılabilir.
            .setEmoji("929001437466357800") 
            .setStyle(ButtonStyle.Danger); // V14 Enum
            
        const button2 = new ButtonBuilder()
            .setCustomId('ileri')
            .setLabel('İleri ▶')
            .setStyle(ButtonStyle.Primary); // V14 Enum
            
        let res = await Punitives.find();
        if (!res || res.length === 0) return message.reply({embeds: [new genEmbed().setDescription(`${message.guild.name} sunucusunda ceza uygulanmadı.`)]}).then(x => setTimeout(() => {x.delete()}, 7500))
        
        let data = res;
        // Chunk fonksiyonu varsayılmaktadır.
        let pages = data.sort((a, b) => b.Date - a.Date).chunk(10); 

        var currentPage = 1
        if (!pages || !pages.length || !pages[currentPage - 1]) return message.reply({embeds: [new genEmbed().setDescription(`${message.guild.name} sunucusunda ceza uygulanmadı.`)]}).then(x => setTimeout(() => {x.delete()}, 7500))
        
        // V14 EmbedBuilder ve setFooter({ text, iconURL }) kullanımı
        let embed = new genEmbed().setColor("White").setFooter({
            text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`,
            iconURL: message.guild.iconURL({dynamic: true})
        });

        // V14 ActionRowBuilder Kullanımı
        const row = new ActionRowBuilder().addComponents([button1, buttonkapat, button2]);
        
        // DeferReply ve Reply/Edit akışı V14'e uygun hale getirildi.
        const curPage = await message.reply({
            embeds: [embed.setDescription(`${message.guild.name} sunucusunun son atılan ceza listesi yükleniyor...`)],
            components: [row], 
            fetchReply: true,
        }).catch(err => {});
        
        // İlk sayfa içeriğinin yüklenmesi
        await curPage.edit({embeds: [embed.setDescription(`${pages[currentPage - 1].map((x, index) => 
            `\` ${x.No} \` <@${x.Member}> <t:${String(Date.parse(x.Date)).slice(0, 10)}:R> [**${x.Type}**] (<@${x.Staff}>)`).join("\n")}`)]}).catch(err => {})

        const filter = (i) => i.user.id == message.member.id

        const collector = await curPage.createMessageComponentCollector({
            filter,
            time: 30000,
        });

        collector.on("collect", async (i) => {
            switch (i.customId) {
                case "ileri":
                    if (currentPage == pages.length) break;
                    currentPage++;
                    break;
                case "geri":
                    if (currentPage == 1) break;
                    currentPage--;
                    break;
                case "kapat": 
                    await i.update({ components: [] }).catch(err => {}); // Butonları kaldır
                    curPage.delete().catch(err => {})
                    return message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅');
            }
            
            // Güncellenmiş embed ve butonları gönder
            await i.deferUpdate();
            
            await curPage.edit({
                embeds: [embed.setFooter({
                    text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, 
                    iconURL: message.guild.iconURL({dynamic: true})
                }).setDescription(`${pages[currentPage - 1].map((x, index) => 
                    `\` ${x.No} \` <@${x.Member}> <t:${String(Date.parse(x.Date)).slice(0, 10)}:R> [**${x.Type}**] (<@${x.Staff}>)`).join("\n")}`)]
            }).catch(err => {});
            
            collector.resetTimer();
        });

        collector.on("end", () => {
            // Süre dolduğunda embed'i sonlandırma
            if(curPage) curPage.edit({
                embeds: [embed.setFooter({
                    text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name}`, 
                    iconURL: message.guild.iconURL({dynamic: true})
                }).setDescription(`${message.guild.name} sunucusunda toplamda \`${res.length || 0}\` adet ceza uygulandı.`)],
                components: [], // Butonları kaldır
            }).catch(err => {});
        })
    }
};