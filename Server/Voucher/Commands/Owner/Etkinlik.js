const { Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed"); 
const Upstaff = require('../../../../Global/Databases/Client.Users.Staffs');
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');

// Global değişkenlerin doğru import edildiği varsayılmıştır (roller, cevaplar, emojiler, ayarlar, sistem).
const { roller, cevaplar, emojiler, ayarlar, sistem } = global;

module.exports = {
    Isim: "etkinlik",
    Komut: ["etkinlikyönetim", "etkinlik-yonetim", "etkinlik-yönetim"],
    Kullanim: "etkinlik",
    Aciklama: "Sunucudaki etkinlik puanlama sistemini başlatır veya sonlandırır.",
    Kategori: "kurucu",
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
        // İzin Kontrolü
        const hasPermission = (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator);
                              
        if (!hasPermission) {
            const reply = await message.reply(cevaplar.noyt).catch(err => {});
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
            }, 7500);
            return;
        }

        // Ayar değerlerini kontrol et ve varsayılanları ata
        const etkinlikDurumu = ayarlar?.Etkinlik ?? false;
        const etkinlikKanalları = ayarlar?.etkinlikIzinliler ?? [];
        const etkinlikSaniyelikPuan = ayarlar?.etkinlikPuan ?? 0.001;

        // Butonları oluşturma (V14 ActionRowBuilder/ButtonBuilder)
        
        // Aktif değilse (Başlat butonu)
        let notActive = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("aktif")
                .setEmoji("841029419573444618") // Bu emojinin sunucuda var olduğu varsayılır
                .setLabel("Etkinlik Başlat")
                .setStyle(ButtonStyle.Success)
        );
        
        // Aktif ise (Bitir butonu)
        let Active = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("bitir")
                .setEmoji(message.guild.emojiGöster(emojiler.Iptal))
                .setLabel("Etkinlik Bitir")
                .setStyle(ButtonStyle.Danger)
        );

        // Embed İçeriği
        let embed = new EmbedBuilder()
            .setFooter({ text: "Etkinlik puanlamasını websitesi üzerinden veya da kurulum panelinden değiştirebilirsiniz." })
            .setDescription(`${etkinlikDurumu ? `${message.guild.emojiGöster(emojiler.Konfeti)}` : `:tada:`} **Merhaba!** ${ayarlar.serverName ? ayarlar.serverName : message.guild.name} sunucusunda ${etkinlikDurumu ? "etkinlik **aktif** durdurmak için aşağıda ki düğmeyi kullanabilirsin." : "etkinlik şuan da **kapalı**. Etkinliği başlatmak için aşağıda ki düğmeyi kullanabilirsin."}
                
\` ••❯ \` **Etkinlik Durumu**
\` ❯ \` Etkinlik Durumu: \`${etkinlikDurumu ? " Başlatılmış! ✅ " : " Sonlandırılmış! ❌ "}\`
\` ❯ \` **Saatlik** Puan Durumu: \` +${(3600 * etkinlikSaniyelikPuan).toFixed(3)} Etkinlik Puanı \`
\` ❯ \` **Dakikalık** Puan Durumu: \` +${(60 * etkinlikSaniyelikPuan).toFixed(3)} Etkinlik Puanı \`
\` ❯ \` **Saniyelik** Puan Durumu: \` +${etkinlikSaniyelikPuan} Etkinlik Puanı \`
\` ❯ \` Etkinlik Kategorileri: \`${etkinlikKanalları.length >= 1 ? etkinlikKanalları.map(x => message.guild.channels.cache.get(x)?.name || "Bilinmiyor").join(", ") : " Ayarlanmamış! "}\`
            `);


        // Mesajı gönderme
        const msg = await message.channel.send({ 
            embeds: [embed], 
            components: [etkinlikDurumu ? Active : notActive] 
        }).catch(err => {});

        if (!msg) return;

        // Koleksiyoncu (Collector)
        const filter = (i) => i.user.id === message.member.id;
        const collector = msg.createMessageComponentCollector({ filter: filter });

        collector.on('collect', async (i) => {
            // Etkileşime yanıt verme (ephemeral)
            await i.deferReply({ ephemeral: true });

            if (i.customId === "aktif") {
                // Etkinliği Başlat
                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
                await GUILDS_SETTINGS.updateOne({ guildID: sistem.SERVER.ID }, { $set: { "Ayarlar.Etkinlik": true } }, { upsert: true });
                
                // Mesajı sil ve yanıt ver
                msg.delete().catch(err => {});

                const kanalIsimleri = etkinlikKanalları.length >= 1 ? etkinlikKanalları.map(x => message.guild.channels.cache.get(x)?.name || "Bilinmiyor").join(", ") + " kategorilerinde" : ``;

                await i.editReply({ 
                    content: `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla <t:${Math.floor(Date.now() / 1000)}:R> ${kanalIsimleri} etkinlik **${etkinlikSaniyelikPuan}** saniyelik puan ile başlatıldı.`
                });
            
            } else if (i.customId === "bitir") {
                // Etkinliği Bitir
                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
                await GUILDS_SETTINGS.updateOne({ guildID: sistem.SERVER.ID }, { $set: { "Ayarlar.Etkinlik": false } }, { upsert: true });

                // Mesajı sil ve yanıt ver
                msg.delete().catch(err => {});

                const kanalIsimleri = etkinlikKanalları.length >= 1 ? etkinlikKanalları.map(x => message.guild.channels.cache.get(x)?.name || "Bilinmiyor").join(", ") + " kategorilerinde ki" : ``;

                await i.editReply({ 
                    content: `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla <t:${Math.floor(Date.now() / 1000)}:R> ${kanalIsimleri} etkinlik sonlandırıldı.`
                });
            }
        });
    }
    // "secretOluştur" fonksiyonu komut içinde kullanılmadığı için dışarıda bırakıldı.
};