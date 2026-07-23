const { Client, Message, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require("discord.js");
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "seslog",
    Komut: ["voicelog","seslogu","voicelogs"],
    Kullanim: "seslog @andale/ID",
    Aciklama: "Bir üyenin ses geçmişini görüntüler.",
    Kategori: "yönetim",
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
        // v14 Yetki kontrolü güncellemesi (ADMINISTRATOR -> PermissionFlagsBits.Administrator)
        if(!roller.Yetkiler.some(oku => message.member.roles.cache.has(oku)) && 
           !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && 
           !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && 
           !roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && 
           !roller.Yetkiler.some(oku => message.member.roles.cache.has(oku)) && 
           !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && 
           !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        let uye = message.mentions.users.first() || 
                  message.guild.members.cache.get(args[0]) || 
                  (args.length > 0 ? client.users.cache.filter(e => e.username.toLowerCase().includes(args.join(" ").toLowerCase())).first() : message.author) || 
                  message.author;

        if(!uye) return message.reply(cevaplar.üyeyok).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        uye = message.guild.members.cache.get(uye.id) || message.member;

        // v14 ButtonBuilder ve ButtonStyle Güncellemeleri
        const button1 = new ButtonBuilder()
            .setCustomId('geri')
            .setLabel('◀ Geri')
            .setStyle(ButtonStyle.Primary);

        const buttonkapat = new ButtonBuilder()
            .setCustomId('kapat')
            .setEmoji("1517138914572238859")               
            .setStyle(ButtonStyle.Danger);
                
        const button2 = new ButtonBuilder()
            .setCustomId('ileri')
            .setLabel('İleri ▶')
            .setStyle(ButtonStyle.Primary);

        try {
            // Mongoose Callback kaldırıldı, modern async/await yapısına geçirildi.
            const res = await Users.findOne({ _id: uye.id });

            if (!res || !res.Voices || res.Voices.length === 0) {
                return message.channel.send({
                    embeds: [
                        new genEmbed()
                            .setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) })
                            .setDescription(`${uye} isimli üyenin geçmiş ses bilgileri bulunamadı.`)
                    ]
                }).then(x => setTimeout(() => { x.delete().catch(() => {}) }, 7500));
            }

            let pages = res.Voices.sort((a, b) => b.date - a.date).chunk(10);
            let currentPage = 1;

            if (!pages || !pages.length || !pages[currentPage - 1]) {
                return message.reply({
                    embeds: [
                        new genEmbed()
                            .setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) })
                            .setDescription(`${uye} isimli üyenin geçmiş ses bilgileri bulunamadı..`)
                    ]
                }).then(x => setTimeout(() => { x.delete().catch(() => {}) }, 7500));
            }

            // v14 setAuthor, setFooter ve Resim linkleri (extension: "png") obje formatına göre güncellendi.
            let embed = new genEmbed()
                .setColor("White")
                .setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) })
                .setFooter({ text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, iconURL: message.guild.iconURL({ extension: "png" }) });

            // v14 ActionRowBuilder Güncellemesi
            const row = new ActionRowBuilder().addComponents(button1, buttonkapat, button2);

            if (message.deferred === false && typeof message.deferReply === 'function') {
                await message.deferReply().catch(() => {});
            }

            const curPage = await message.channel.send({
                embeds: [embed.setDescription(`${uye}, üyesinin ses bilgisi yükleniyor... Lütfen bekleyin...`)],
                components: [row]
            }).catch(err => {});
        
            if (!curPage) return;

            await curPage.edit({
                embeds: [embed.setDescription(`${pages[currentPage - 1].map((x, index) => `\` ${index+1} \` ${message.guild.channels.cache.get(x.channel) ? message.guild.channels.cache.get(x.channel) : "#silinmiş-kanal"} <t:${String(x.date).slice(0, 10)}:R> [**${x.state}**] ${x.entry ? "(<@" + x.entry + ">)" : ""}`).join("\n")}`)]
            }).catch(err => {});

            const filter = (i) => i.user.id === message.member.id;

            const collector = curPage.createMessageComponentCollector({
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
                        await curPage.delete().catch(err => {});
                        const onayEmoji = message.guild.emojiGöster(emojiler.Onay);
                        if (onayEmoji) message.react(onayEmoji.id).catch(() => {});
                        return;
                }
                
                await i.deferUpdate().catch(() => {});
                await curPage.edit({
                    embeds: [
                        embed.setFooter({ text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, iconURL: message.guild.iconURL({ extension: "png" }) })
                             .setDescription(`${pages[currentPage - 1].map((x, index) => `\` ${index+1} \` ${message.guild.channels.cache.get(x.channel) ? message.guild.channels.cache.get(x.channel) : "#silinmiş-kanal"} <t:${String(x.date).slice(0, 10)}:R> [**${x.state}**] ${x.entry ? "(<@" + x.entry + ">)" : ""}`).join("\n")}`)
                    ]
                }).catch(err => {});
                collector.resetTimer();
            });

            collector.on("end", () => {
                if (curPage) {
                    curPage.edit({
                        embeds: [
                            embed.setFooter({ text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name}`, iconURL: message.guild.iconURL({ extension: "png" }) })
                                 .setDescription(`${uye} isimli üyesinin toplamda \`${res.Voices.length || 0}\` adet ses bilgisi mevcut.`)
                        ],
                        components: [],
                    }).catch(err => {});
                }
            });
        } catch (error) {
            console.error("Seslog komutunda hata meydana geldi:", error);
        }
    }
};