const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType 
} = require("discord.js");
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require('../../../../Global/İnit/Embed');

// Global değişkenlerin ve fonksiyonların varlığı varsayılmıştır.
// const { roller, ayarlar, cevaplar, emojiler, tarihsel } = global;

module.exports = {
    Isim: "taglılar",
    Komut: ["taglılarım", "taglıbilgisi"],
    Kullanim: "taglıbilgisi <@andale/ID>",
    Aciklama: "Belirlenen veya komutu kullanan kişinin kazandırdığı taglıları listeler.",
    Kategori: "stat",
    Extend: true,
    
    onLoad: function (client) {},

    onRequest: async function (client, message, args) {
        
        // İzin Kontrolü
        const hasPermission = roller.teyitciRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.Yetkiler.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator);
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Üye Bulma (Belirtilen kişi veya komutu kullanan)
        let uye = message.mentions.users.first() || client.users.cache.get(args[0]) || message.member.user;
        if (!uye) {
            return message.reply({ content: cevaplar.üye }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Üyenin GuildMember objesini al
        uye = message.guild.members.cache.get(uye.id);

        // --------------------------------------------------------------------------------
        // Buttonlar (V14 Builders)
        // --------------------------------------------------------------------------------
        
        const button1 = new ButtonBuilder()
            .setCustomId('geri')
            .setLabel('◀ Geri')
            .setStyle(ButtonStyle.Primary);
            
        // Kapat butonu, custom emoji ID'si ve Danger stilini korur
        const buttonkapat = new ButtonBuilder()
            .setCustomId('kapat')
            .setEmoji("929001437466357800")
            .setStyle(ButtonStyle.Danger); 
            
        const button2 = new ButtonBuilder()
            .setCustomId('ileri')
            .setLabel('İleri ▶')
            .setStyle(ButtonStyle.Primary);

        // Mesajı göndermeden önce yanıtı erteleme (defer)
        if (message.deferred == false) {
            await message.deferReply();
        }

        // Veri Çekme
        Users.findOne({ _id: uye.id }, async (err, res) => {
            
            if (!res || !res.Taggeds || res.Taggeds.length === 0) {
                 // İlk mesajı direkt olarak düzenle
                return message.editReply({
                    embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) }).setDescription(`${uye} isimli üyenin taglı bilgisi bulunamadı.`)]
                }).then(x => setTimeout(() => { message.deleteReply().catch(err => {}) }, 7500));
            }

            // Sayfalama
            let pages = res.Taggeds.sort((a, b) => b.Date - a.Date).chunk(20); // chunk global varsayılmıştır.
            var currentPage = 1;
            
            if (!pages || !pages.length || !pages[currentPage - 1]) {
                 return message.editReply({
                    embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) }).setDescription(`${uye} isimli üyenin taglı bilgisi bulunamadı.`)]
                }).then(x => setTimeout(() => { message.deleteReply().catch(err => {}) }, 7500));
            }
            
            // Ana Embed ve ActionRow Hazırlama
            let embed = new genEmbed().setColor("White")
                .setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) })
                .setFooter({ 
                    text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, 
                    iconURL: message.guild.iconURL({ dynamic: true }) 
                });
                
            const row = new ActionRowBuilder().addComponents([button1, buttonkapat, button2]);
            
            // Mesajı düzenle ve sayfa içeriğini göster
            // NOT: Defer yapıldığı için artık .reply yerine .editReply kullanmalıyız.
            const curPage = await message.editReply({
                embeds: [embed.setDescription(`${uye} isimli üyesinin toplamda \`${res.Taggeds.length || 0}\` adet taglısı mevcut.

${pages[currentPage - 1].map((value, index) => {
    const member = message.guild.members.cache.get(value.id);
    const userMention = member ? member.toString() : `<@${value.id}>`;
    const unixTime = String(value.Date).slice(0, 10);
    return `\` ${index + 1 + ((currentPage - 1) * 20)} \` ${userMention} <t:${unixTime}:R>`; // Orijinal kodda R formatı kullanılmış
}).join("\n")}`)],
                components: [row],
                fetchReply: true,
            }).catch(err => {});
            
            // --------------------------------------------------------------------------------
            // Collector Başlatma
            // --------------------------------------------------------------------------------
            
            const filter = (i) => i.user.id == message.member.id;

            const collector = await curPage.createMessageComponentCollector({
                filter,
                time: 30000,
                componentType: ComponentType.Button,
            });

            collector.on("collect", async (i) => {
                let isBreak = false;
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
                        i.deferUpdate().catch(err => {});
                        curPage.delete().catch(err => {});
                        isBreak = true;
                        // Emoji tepkisini original mesaja ekler
                        message.channel.messages.fetch(message.id).then(m => {
                            m.react(message.guild.emojis.cache.get(emojiler.Onay) || '✅').catch(err => {});
                        }).catch(err => {});
                        break;
                }
                
                if (isBreak) return;

                await i.deferUpdate();
                
                // Sayfa içeriğini güncelleme
                await curPage.edit({
                    embeds: [embed.setFooter({ 
                        text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length} `, 
                        iconURL: message.guild.iconURL({ dynamic: true }) 
                    }).setDescription(`${uye} isimli üyesinin toplamda \`${res.Taggeds.length || 0}\` adet taglısı mevcut.

${pages[currentPage - 1].map((value, index) => {
    const member = message.guild.members.cache.get(value.id);
    const userMention = member ? member.toString() : `<@${value.id}>`;
    const unixTime = String(value.Date).slice(0, 10);
    // NOT: Orijinal kodun sonunda tarihsel() kullanılmış, ancak ilk edit'te <t:..:R> kullanılmıştı. Tutarlılık için burada <t:..:R> formatını korudum.
    // Eğer tarihsel() fonksiyonunu kullanmak istiyorsanız: \`${tarihsel(value.Date)}\` kullanın.
    return `\` ${index + 1 + ((currentPage - 1) * 20)} \` ${userMention} <t:${unixTime}:R>`;
}).join("\n")}`)]
                }).catch(err => {});
                
                collector.resetTimer();
            });

            collector.on("end", () => {
                // Süre dolduğunda son mesajı düzenleme
                if (curPage) {
                    curPage.edit({
                        embeds: [embed.setFooter({ 
                            text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name}`, 
                            iconURL: message.guild.iconURL({ dynamic: true }) 
                        }).setDescription(`${uye} isimli üyesinin toplamda \`${res.Taggeds.length || 0}\` adet taglısı mevcut.`)],
                        components: [],
                    }).catch(err => {});
                }
            });
        });
    }
};