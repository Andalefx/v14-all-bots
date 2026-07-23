const { 
    Client, 
    Message, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    PermissionFlagsBits,
    ChannelType 
} = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

// Global değişkenlerin doğru import edildiği varsayılmıştır (roller, cevaplar, sistem, emojiler, ayarlar).
const { roller, cevaplar, sistem, emojiler, ayarlar } = global; 

// Globalde tutulan kanal objesi (Modal'da kullanmak için)
let Select = null; 

module.exports = {
    Isim: "kanal",
    Komut: ["kanal-düzenle", "kanal-yönet", "kanal-ayarla"],
    Kullanim: "kanal [Kanal Etiketi/ID/İsim]",
    Aciklama: "Belirlenen kanalı düzenlemeye (isim, limit, sıra) yardımcı olur.",
    Kategori: "kurucu",
    Extend: true,
    
    /**
    * @param {Client} client 
    */
    onLoad: function (client) {
        // V14 yerleşik Modal etkileşimlerini dinleme
        client.on('interactionCreate', async (i) => {
            if (!i.isModalSubmit()) return;

            const guild = client.guilds.cache.get(i.guildId);
            if (!guild) {
                await i.reply({ content: `Sistemsel olarak bir hata oluştur`, ephemeral: true });
                return;
            }

            const uye = guild.members.cache.get(i.user.id);
            if (!uye) {
                await i.reply({ content: `Sistemsel hata oluştu.`, ephemeral: true });
                return;
            }

            const kanal = Select; // Globalden Select kanal objesini al

            if (i.customId === "kanal_ismi") {
                const isim = i.fields.getTextInputValue('name');
                if (isim && isim.length > 100) { // Kanal isim limiti 100'dür (42 değil, modal 120'ye izin veriyordu)
                    await i.reply({ content: `Belirtilen isim 100 karakterden uzun olduğu için işleme devam edilemiyor.`, ephemeral: true });
                    return;
                }
                
                await i.deferReply({ ephemeral: true });
                
                try {
                    if (kanal) await kanal.setName(isim);
                    
                    await i.editReply({ content: `Başarıyla **${kanal ? kanal.name : "Kanal"}** kanalının ismi **${isim}** olarak değiştirildi. ${guild.emojiGöster(emojiler.Onay)}` });
                    
                    const logKanalı = guild.channels.cache.find(c => c.name === "guild-log"); // kanalBul metodunu channels.cache.find ile değiştirdim
                    if (logKanalı) {
                        logKanalı.send({ 
                            embeds: [new EmbedBuilder()
                                .setFooter({ text: uye.user.tag, iconURL: uye.user.displayAvatarURL({ dynamic: true }) })
                                .setThumbnail(guild.iconURL({ dynamic: true }))
                                .setDescription(`**${guild.name}** sunucusuna ait ${kanal ? kanal : "#deleted-channel"} kanalı ${uye} tarafından "${kanal ? kanal.name : isim}" olan ismi "**${isim}**" olarak <t:${Math.floor(Date.now() / 1000)}:R> güncellendi.`)
                            ]
                        }).catch(err => {});
                    }
                } catch (error) {
                    await i.editReply({ content: `Kanal ismi değiştirilirken bir hata oluştu: ${error.message}`, ephemeral: true });
                }
                

            } else if (i.customId === "kanal_limit") {
                const limit = i.fields.getTextInputValue('limit');
                const limitSayi = parseInt(limit);

                if (isNaN(limitSayi)) {
                    await i.reply({ content: `Belirtilen limit rakam olmalıdır.`, ephemeral: true });
                    return;
                }
                if (limitSayi < 0 || limitSayi > 99) {
                    await i.reply({ content: `Belirtilen limit 0'dan büyük 99'da eşit veya küçük olmalıdır.`, ephemeral: true });
                    return;
                }

                await i.deferReply({ ephemeral: true });
                
                try {
                    if (kanal) await kanal.setUserLimit(limitSayi);

                    await i.editReply({ content: `Başarıyla ${kanal ? kanal : "#deleted-channel"} kanalının limiti "**${limitSayi}**" olarak değiştirildi. ${guild.emojiGöster(emojiler.Onay)}` });
                    
                    const logKanalı = guild.channels.cache.find(c => c.name === "guild-log");
                    if (logKanalı) {
                        logKanalı.send({ 
                            embeds: [new EmbedBuilder()
                                .setFooter({ text: uye.user.tag, iconURL: uye.user.displayAvatarURL({ dynamic: true }) })
                                .setThumbnail(guild.iconURL({ dynamic: true }))
                                .setDescription(`**${guild.name}** sunucusuna ait ${kanal ? kanal : "#deleted-channel"} kanalı ${uye} tarafından limiti **${limitSayi}** olarak <t:${Math.floor(Date.now() / 1000)}:R> güncellendi.`)
                            ]
                        }).catch(err => {});
                    }
                } catch (error) {
                    await i.editReply({ content: `Kanal limiti değiştirilirken bir hata oluştu: ${error.message}`, ephemeral: true });
                }
            }
        });
    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, message, args) {
        // İzin Kontrolü
        const hasPermission = (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator);
                              
        if (!hasPermission) {
            const reply = await message.reply(cevaplar.noyt).catch(err => {});
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
            setTimeout(() => { reply.delete().catch(err => {}) }, 7500);
            return;
        }

        // Kanal bulma (V14'e uygun metotlar)
        let kanal = message.mentions.channels.first() || 
                    message.guild.channels.cache.get(args[0]) || 
                    message.guild.channels.cache.find(x => x.name.includes(args[0])) || 
                    message.channel;

        if (!kanal) {
            const reply = await message.reply({ content: `Belirtilen argümanda bir kanal bulunamadı. ${cevaplar.prefix}`}).catch(err => {});
            setTimeout(() => { reply.delete().catch(err => {}) }, 7500);
            return;
        }

        // Global Select değişkenini ayarla
        Select = kanal; 

        let load = await message.reply({ content: `Düzenleme işlemi için **${message.guild.name}** sunucusundaki "${kanal}" kanalı hazırlanıyor. Lütfen Bekleyin!` }).catch(err => {});
        if (!load) return;

        // Butonlar (V14 ActionRowBuilder/ButtonBuilder)

        let Row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("_name")
                .setLabel(`İsim Güncelleme`)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("_limit")
                .setLabel("Limit Güncelleme")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(kanal.type !== ChannelType.Voice) // V14 Enum kullanımı
        );

        // Sıra Butonları
        let Row_Two = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("_yukarı")
                .setLabel("🔼")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("_aşağı")
                .setLabel("🔽")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("_iptal")
                .setEmoji(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : "❌")
                .setStyle(ButtonStyle.Secondary),
        );

        // Embed
        let embed = new EmbedBuilder()
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setDescription(`Aşağıda ${kanal} kanalını yönetmeniz için size düğme verildi.
Kanalın sırasını güncellemek için "🔼 Yukarı" ve "🔽 Aşağı" simgesini kullanarak kanalı taşıyabilirsiniz. Bu sizler için bir kolaylıktır.`);

        await load.edit({ content: null, embeds: [embed], components: [Row_Two, Row] }).catch(err => {});

        // Koleksiyoncu
        const filter = (i) => i.user.id === message.member.id;
        const collector = load.createMessageComponentCollector({ filter: filter, time: 30000 });

        collector.on('end', (c, reason) => {
            if (reason === "time" && load.editable) {
                load.delete().catch(err => {});
            }
        });

        collector.on('collect', async (i) => {
            if (i.customId === "_limit") {
                // V14 ModalBuilder kullanımı
                const modal = new ModalBuilder()
                    .setCustomId('kanal_limit')
                    .setTitle(`Ses Kanalı Limiti Değiştirme`)
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('limit')
                                .setLabel('Limit:')
                                .setStyle(TextInputStyle.Short)
                                .setMinLength(1)
                                .setMaxLength(2)
                                .setPlaceholder(`Örn: 5`)
                                .setRequired(true)
                        )
                    );

                await i.showModal(modal).catch(err => {}); // Modal'ı göster
                
            } else if (i.customId === "_name") {
                // V14 ModalBuilder kullanımı
                const modal = new ModalBuilder()
                    .setCustomId('kanal_ismi')
                    .setTitle(`Kanal İsim Değiştirme`)
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('name')
                                .setLabel('Yeni İsim Girin:')
                                .setStyle(TextInputStyle.Short)
                                .setMinLength(3)
                                .setMaxLength(100) // V14 max 100 karakter
                                .setPlaceholder(`${kanal.name}`)
                                .setRequired(true)
                        )
                    );
                
                await i.showModal(modal).catch(err => {});

            } else if (i.customId === "_iptal") {
                load.delete().catch(err => {});
                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
                i.deferUpdate().catch(err => {});
                collector.stop();

            } else if (i.customId === "_yukarı") {
                await kanal.setPosition(kanal.rawPosition - 1);
                
                embed.setFooter({ text: `Başarıyla ${kanal.name} kanalı yukarı taşındı. ✅` });
                Row_Two.components[0].setStyle(ButtonStyle.Success).setDisabled(true);
                await load.edit({ embeds: [embed], components: [Row_Two, Row] }).catch(err => {});

                // Loglama
                const logKanalı = message.guild.channels.cache.find(c => c.name === "guild-log");
                if (logKanalı) {
                    logKanalı.send({ embeds: [new EmbedBuilder()
                        .setFooter({ text: message.member.user.tag, iconURL: message.member.user.displayAvatarURL({ dynamic: true }) })
                        .setThumbnail(message.guild.iconURL({ dynamic: true }))
                        .setDescription(`**${message.guild.name}** sunucusuna ait ${kanal} kanalı ${message.member} tarafından <t:${Math.floor(Date.now() / 1000)}:R> **yukarı** taşındı.`)
                    ]}).catch(err => {});
                }

                await i.deferUpdate().catch(err => {});
                
                setTimeout(async () => {
                    embed.setFooter(null);
                    Row_Two.components[0].setStyle(ButtonStyle.Secondary).setDisabled(false);
                    await load.edit({ embeds: [embed], components: [Row_Two, Row] }).catch(err => {});
                }, 2250);

            } else if (i.customId === "_aşağı") {
                await kanal.setPosition(kanal.rawPosition + 1);
                
                embed.setFooter({ text: `Başarıyla ${kanal.name} kanalı aşağı taşındı. ✅` });
                Row_Two.components[1].setStyle(ButtonStyle.Success).setDisabled(true);
                await load.edit({ embeds: [embed], components: [Row_Two, Row] }).catch(err => {});
                
                // Loglama
                const logKanalı = message.guild.channels.cache.find(c => c.name === "guild-log");
                if (logKanalı) {
                    logKanalı.send({ embeds: [new EmbedBuilder()
                        .setFooter({ text: message.member.user.tag, iconURL: message.member.user.displayAvatarURL({ dynamic: true }) })
                        .setThumbnail(message.guild.iconURL({ dynamic: true }))
                        .setDescription(`**${message.guild.name}** sunucusuna ait ${kanal} kanalı ${message.member} tarafından <t:${Math.floor(Date.now() / 1000)}:R> **aşağı** taşındı.`)
                    ]}).catch(err => {});
                }

                await i.deferUpdate().catch(err => {});
                
                setTimeout(async () => {
                    embed.setFooter(null);
                    Row_Two.components[1].setStyle(ButtonStyle.Secondary).setDisabled(false);
                    await load.edit({ embeds: [embed], components: [Row_Two, Row] }).catch(err => {});
                }, 2250);
            }
        });
    }
    // "secretOluştur" fonksiyonu komut içinde kullanılmadığı için dışarıda bırakıldı.
};