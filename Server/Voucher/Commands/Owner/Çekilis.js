const { Client, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, Collection, ComponentType, PermissionFlagsBits } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");  // Embed builder'ın v14 uyumlu olduğu varsayılmıştır.
const ms = require('ms');

// Global değişkenler: sistem, roller, cevaplar, emojiler
const { sistem, roller, cevaplar, emojiler } = global; 

let kanal; // Modal etkileşiminde kullanılacak kanal değişkeni

module.exports = {
    Isim: "çekiliş",
    Komut: ["cekilis"],
    Kullanim: "cekilis",
    Aciklama: "Sunucuda çekiliş oluşturma, bitirme ve tekrar çekme işlemlerini yönetir.",
    Kategori: "kurucu",
    Extend: true,

    /**
    * @param {Client} client 
    */
    onLoad: function (client) {
        // V14 Modal Submit Listener
        client.on('interactionCreate', async (interaction) => {
            // Sadece Modal etkileşimlerini dinle
            if (!interaction.isModalSubmit()) return;

            // DeferReply yapılmadığı için interaction.reply'den önce defer gerekmez
            // Ancak, işlem uzun sürecekse deferReply yapılabilir. (Burada gerek yok)

            let guild = client.guilds.cache.get(sistem.SERVER.ID);
            if (!guild) {
                return interaction.reply({ content: `Sistemsel hata oluştu. (Sunucu bulunamadı)`, ephemeral: true });
            }
            let uye = guild.members.cache.get(interaction.user.id);
            if (!uye) {
                return interaction.reply({ content: `Sistemsel hata oluştu. (Üye bulunamadı)`, ephemeral: true });
            }

            if (interaction.customId === "cekilisOlustur") {
                const zaman = interaction.fields.getTextInputValue("zaman");
                const ödül = interaction.fields.getTextInputValue("ödül");
                const winnerCount = parseInt(interaction.fields.getTextInputValue("winner"));

                if (!kanal) {
                     return interaction.reply({ content: `Çekilişin yapılacağı kanal bilgisi kayboldu. Komutu tekrar deneyin.`, ephemeral: true });
                }

                client.giveawaysManager.start(kanal, {
                    time: ms(zaman),
                    prize: ödül,
                    duration: ms(zaman),
                    winnerCount: winnerCount,
                    lastChance: {
                        enabled: true,
                        content: '**KATILMAK İÇİN SON ŞANS !** ⚠️',
                        threshold: 5000,
                        embedColor: 'RED'
                    }
                }).then(() => {
                    // Başarılı başlangıç
                }).catch(err => {
                    console.error("Çekiliş başlatma hatası:", err);
                    return interaction.reply({ content: `Çekiliş başlatılırken bir hata oluştu: \`${err.message}\``, ephemeral: true });
                });

                return interaction.reply({ content: `Başarıyla ${kanal} kanalında çekiliş başlatıldı. ${guild.emojiGöster(emojiler.Onay)}`, ephemeral: true });
            }

            if (interaction.customId === "cekilişBitir") {
                const id = interaction.fields.getTextInputValue("id");
                client.giveawaysManager.end(id)
                    .then(() => {
                        interaction.reply({ content: `Başarıyla çekiliş bitirildi. ${guild.emojiGöster(emojiler.Onay)}`, ephemeral: true });
                    })
                    .catch(err => {
                        interaction.reply({ content: `Çekiliş bitirilirken hata oluştu. Mesaj ID'sini kontrol edin.`, ephemeral: true });
                    });
                return;
            }

            if (interaction.customId === "geRoll") {
                const id = interaction.fields.getTextInputValue("id");
                client.giveawaysManager.reroll(id)
                    .then(() => {
                        interaction.reply({ content: `Başarıyla çekiliş tekrarlandı. ${guild.emojiGöster(emojiler.Onay)}`, ephemeral: true });
                    })
                    .catch((err) => {
                        interaction.reply({ content: `Tekrardan kazanan belirlenmesi için çekilişin bitmesi gerek VEYA ID hatalı.`, ephemeral: true });
                    });
                return;
            }
        });
    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, message, args) {
        // İzin kontrolü
        const hasPermission = (roller.çekilişHakkı && roller.çekilişHakkı.some(x => message.member.roles.cache.has(x))) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(x => message.member.roles.cache.has(x)));
                              
        if (!hasPermission) {
            const reply = await message.reply({ content: `${cevaplar.noyt}` }).catch(err => {});
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
            }, 7500);
            return;
        }

        // V14 EmbedBuilder kullanımı
        let embed = new EmbedBuilder(); 

        // V14 ActionRowBuilder ve ButtonBuilder kullanımı
        let Row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("çekilişYap")
                .setLabel("Çekiliş Oluştur")
                .setStyle(ButtonStyle.Success)
                .setEmoji(message.guild.emojiGöster("acar_giveaway")),
            new ButtonBuilder()
                .setCustomId("gerollCekilis")
                .setLabel("Kazanan Tekrarla")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("cekilisBitir")
                .setLabel("Çekiliş Bitir")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("çekilişListele")
                .setLabel("Çekilişleri Listele")
                .setStyle(ButtonStyle.Secondary),
        );

        let load = await message.reply({ content: `Çekiliş sistemi yükleniyor... Lütfen bekleyin!`, components: [] });

        await load.edit({
            components: [Row],
            content: `${message.guild.emojiGöster("acar_giveaway")} ${message.guild.emojiGöster("acar_giveaway")} **ÇEKİLİŞ** ${message.guild.emojiGöster("acar_giveaway")} ${message.guild.emojiGöster("acar_giveaway")}`,
            embeds: [
                new EmbedBuilder().setColor(ButtonStyle.Secondary).setDescription(`Aşağıda ${message.guild.name} sunucusunda çekiliş oluşturma, karıştırmak ve bitirmek için düğmeleri kullanabilirsiniz.`)
            ]
        }).catch(err => {});

        // V14 Component Collector
        var filter = (i) => i.user.id === message.author.id;
        let collector = load.createMessageComponentCollector({ filter: filter, time: 30000, max: 1 });

        collector.on('end', (i, reason) => {
            load.delete().catch(err => {});
            if (reason === "time") message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
        });

        collector.on("collect", async (i) => {
            if (i.customId === "çekilişListele") {
                const giveaways = client.giveawaysManager.giveaways.filter(x => x.guildId === message.guild.id);
                
                let dataa = giveaways.sort((a, b) => b.startAt - a.startAt).slice(0, 10).map((x, index) => {
                    const winners = x.winnerIds && x.winnerIds.length > 0 
                        ? x.winnerIds.map(a => `<@${a}>`).join(', ') 
                        : "**KAZANAN YOK**";
                    
                    return `\` ${index + 1} \` **${x.prize}** | <t:${Math.floor(x.startAt / 1000)}:R> | [Kazan.: ${winners}]`;
                }).join("\n");

                i.reply({ 
                    content: `Aşağıda **${message.guild.name}** sunucusuna ait son 10 çekiliş listelenmektedir.

${dataa ? dataa : `**Daha önce bir çekiliş yapılmamış.**`}`,
                    ephemeral: true 
                }).catch(err => {});
            }

            // MODAL ETKİLEŞİMLERİ (Aşağıdaki düğmelere tıklandığında modal gösterilir)

            if (i.customId === "gerollCekilis") {
                const rerollModal = new ModalBuilder()
                    .setCustomId('geRoll')
                    .setTitle('Kazanan Tekrarla!');
                
                const idInput = new TextInputBuilder()
                    .setCustomId('id')
                    .setLabel("Çekiliş Mesaj ID")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Örn: 997964821771337819')
                    .setRequired(true);

                rerollModal.addComponents(new ActionRowBuilder().addComponents(idInput));
                kanal = message.channel; // Global kanalı ayarla
                await i.showModal(rerollModal).catch(err => {});
                
                message.react(message.guild.emojiGöster("985341193745473536")).catch(err => {});
            }
            
            if (i.customId === "cekilisBitir") {
                const endModal = new ModalBuilder()
                    .setCustomId('cekilişBitir')
                    .setTitle('Çekiliş Bitir!');
                
                const idInput = new TextInputBuilder()
                    .setCustomId('id')
                    .setLabel("Çekiliş Mesaj ID")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Örn: 997964821771337819')
                    .setRequired(true);

                endModal.addComponents(new ActionRowBuilder().addComponents(idInput));
                kanal = message.channel; // Global kanalı ayarla
                await i.showModal(endModal).catch(err => {});
                
                message.react(message.guild.emojiGöster("985341193745473536")).catch(err => {});
            }

            if (i.customId === "çekilişYap") {
                const createModal = new ModalBuilder()
                    .setCustomId('cekilisOlustur')
                    .setTitle('Çekiliş Oluştur!');
                
                const odulInput = new TextInputBuilder()
                    .setCustomId('ödül')
                    .setLabel("Ödül")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Örn: Boostlu Nitro')
                    .setRequired(true);
                
                const winnerInput = new TextInputBuilder()
                    .setCustomId('winner')
                    .setLabel("Kaç Kişi Kazanacak?")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Örn: 1`)
                    .setRequired(true);
                
                const zamanInput = new TextInputBuilder()
                    .setCustomId('zaman')
                    .setLabel("Süre (Örn: 1m, 1h, 1d)")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder(`Örn: 1m`)
                    .setRequired(true);
                
                // V14 kuralı: Her TextInput'ın kendi ActionRow'u olmalı
                createModal.addComponents(
                    new ActionRowBuilder().addComponents(odulInput),
                    new ActionRowBuilder().addComponents(winnerInput),
                    new ActionRowBuilder().addComponents(zamanInput)
                );
                
                kanal = message.channel; // Global kanalı ayarla
                await i.showModal(createModal).catch(err => {});
                
                message.react(message.guild.emojiGöster("985341193745473536")).catch(err => {});
            }
            
            // Modal gösterildiğinde veya liste haricinde bir aksiyon alındığında collector durdurulur.
            if(i.customId !== "çekilişListele") {
                collector.stop();
            }
        });
    }
};