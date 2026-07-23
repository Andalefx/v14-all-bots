const { 
    Client, 
    Message, 
    ButtonBuilder, 
    ActionRowBuilder, 
    ButtonStyle, 
    UserFlags
} = require("discord.js");

const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "transferler",
    Komut: ["transferlerim"],
    Kullanim: "transferler <@andale/ID>",
    Aciklama: "Belirtilen veya komutu kullanan üyenin son transferlerini gösterir.",
    Kategori: "eco",
    Extend: true,
    
    /**
     * @param {Client} client 
     */
    onLoad: function (client) {
        // Chunk metodu Array Prototype'a eklenmiş olmalı.
    },

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array<String>} args 
     */
    onRequest: async function (client, message, args) {
        // Üye bulma
        let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]) || message.member;
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        uye = message.guild.members.cache.get(uye.id);

        // Butonları V14 Builder formatında oluşturma
        const button1 = new ButtonBuilder()
            .setCustomId('geri')
            .setLabel('◀ Geri')
            .setStyle(ButtonStyle.Primary);

        const buttonkapat = new ButtonBuilder()
            .setCustomId('kapat')
            .setEmoji("929001437466357800")
            .setStyle(ButtonStyle.Danger);

        const button2 = new ButtonBuilder()
            .setCustomId('ileri')
            .setLabel('İleri ▶')
            .setStyle(ButtonStyle.Primary);

        // Mongoose Callback Kaldırıldı -> Try/Catch ve Await Yapısı Getirildi
        try {
            let res = await Users.findOne({ _id: uye.id });

            if (!res || !res.Transfers || res.Transfers.length === 0) {
                const noDataEmbed = new genEmbed()
                    .setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) })
                    .setDescription(`${uye} isimli üyenin transfer bilgisi bulunamadı.`);
                
                return message.channel.send({ embeds: [noDataEmbed] }).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
            }
            
            // Veri Sayfalama (chunk metodu dışarıdan gelmelidir)
            let pages = res.Transfers.sort((a, b) => b.Tarih - a.Tarih).chunk(20);
            var currentPage = 1;

            if (!pages || !pages.length || !pages[currentPage - 1]) {
                const noPageEmbed = new genEmbed()
                    .setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) })
                    .setDescription(`${uye} isimli üyenin transfer bilgisi bulunamadı.`);
                return message.channel.send({ embeds: [noPageEmbed] }).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
            }

            // Embed oluşturma (V14 formatı ve dynamic yerine extension: "png" kullanımı)
            let embed = new genEmbed()
                .setColor("White")
                .setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) })
                .setFooter({ 
                    text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, 
                    iconURL: message.guild.iconURL({ extension: "png" }) 
                });

            // Action Row oluşturma
            const row = new ActionRowBuilder().addComponents(button1, buttonkapat, button2);
            
            // Yükleniyor mesajı gönderme
            const curPage = await message.channel.send({
                embeds: [embed.setDescription(`${uye}, üyesinin transfer bilgisi yükleniyor... Lütfen bekleyin...`)],
                components: [row], fetchReply: true,
            }).catch(err => {});
            
            if(!curPage) return;

            // İlk sayfanın içeriği
            await curPage.edit({
                embeds: [embed.setDescription(`${uye} isimli üyesinin toplamda \`${res.Transfers.length || 0}\` adet transferi mevcut.

${pages[currentPage - 1].map((value, index) => 
    `\` ${index + 1} \` ${message.guild.members.cache.get(value.Uye) ? message.guild.members.cache.get(value.Uye) : `<@${value.Uye}>`} \`${value.Tutar} ${value.Islem}\` (\`${tarihsel(value.Tarih)}\`)`
).join("\n")} `)],
            }).catch(err => {})

            const filter = (i) => i.user.id == message.member.id;

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
                        await i.deferUpdate().catch(err => {});
                        await curPage.delete().catch(err => {})
                        return message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
                }
                
                await i.deferUpdate().catch(err => {});
                
                // Sayfa güncellenirken footer ve description tekrar ayarlanmalı
                await curPage.edit({
                    embeds: [embed.setFooter({
                        text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, 
                        iconURL: message.guild.iconURL({ extension: "png" })
                    }).setDescription(`${uye} isimli üyesinin toplamda \`${res.Transfers.length || 0}\` adet transferi mevcut.

${pages[currentPage - 1].map((value, index) => 
    `\` ${index + 1} \` ${message.guild.members.cache.get(value.Uye) ? message.guild.members.cache.get(value.Uye) : `<@${value.Uye}>`} \`${value.Tutar} ${value.Islem}\` (\`${tarihsel(value.Tarih)}\`)`
).join("\n")}`)],
                }).catch(err => {});
                
                collector.resetTimer();
            });

            collector.on("end", () => {
                if(curPage) curPage.edit({
                    embeds: [embed.setFooter({
                        text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name}`, 
                        iconURL: message.guild.iconURL({ extension: "png" })
                    }).setDescription(`${uye} isimli üyesinin toplamda \`${res.Transfers.length || 0}\` adet transferi mevcut.`)],
                    components: [], // Süre bitince butonları kaldırır
                }).catch(err => {});
            });

        } catch (err) {
            console.error("Veritabanı veya İşlem Hatası:", err);
            message.channel.send({ content: "Transfer bilgileri yüklenirken bir hata oluştu." }).catch(e => {});
        }
    }
};