const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType 
} = require("discord.js");
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require('../../../../Global/İnit/Embed');

// Global değişkenlerin ve fonksiyonların varlığı varsayılmıştır.
// const { roller, ayarlar, cevaplar, emojiler } = global;

module.exports = {
    Isim: "yetkililerim",
    Komut: ["yetkililerim", "yetkilibilgisi"],
    Kullanim: "yetkilibilgisi <@andale/ID>",
    Aciklama: "Belirlenen veya komutu kullanan kişinin başlattığı yetkilileri listeler.",
    Kategori: "stat",
    Extend: true,
    
    onLoad: function (client) {},

    onRequest: async function (client, message, args) {
        
        // İzin Kontrolü
        const hasPermission = roller.Yetkiler.some(oku => message.member.roles.cache.has(oku)) || 
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
            
        const buttonkapat = new ButtonBuilder()
            .setCustomId('kapat')
            .setLabel('❌')
            .setStyle(ButtonStyle.Secondary);
            
        const button2 = new ButtonBuilder()
            .setCustomId('ileri')
            .setLabel('İleri ▶')
            .setStyle(ButtonStyle.Primary);

        // Orijinal kodunuzdaki deferReply mantığına uygun olarak:
        // Mesajı göndermeden önce yanıtı erteleme
        if (message.deferred == false) {
            await message.deferReply();
        }

        // Veri Çekme
        Users.findOne({ _id: uye.id }, async (err, res) => {
            
            // İlk Mesajı Gönderme (Taranıyor... - Orijinal kodda bu, deferReply sonrası send olduğu için)
            let msg = await message.channel.send({ embeds: [new genEmbed().setDescription(`${uye} üyesinin yetkili bilgisi yükleniyor... Lütfen bekleyin...`)] });

            if (!res || !res.Staffs || res.Staffs.length === 0) {
                return msg.edit({
                    embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) }).setDescription(`${uye} isimli üyenin yetkili bilgisi bulunamadı.`)]
                }).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
            }

            // Sayfalama
            let pages = res.Staffs.sort((a, b) => b.Date - a.Date).chunk(10); // chunk global varsayılmıştır.
            var currentPage = 1;
            
            if (!pages || !pages.length || !pages[currentPage - 1]) {
                 return msg.edit({
                    embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) }).setDescription(`${uye} isimli üyenin yetkili bilgisi bulunamadı.`)]
                }).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
            }
            
            // Ana Embed ve ActionRow Hazırlama
            let embed = new genEmbed().setColor("White")
                .setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) })
                .setFooter({ 
                    text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length} • Yetkili: ${res.Staffs.length || 0}`, 
                    iconURL: message.guild.iconURL({ dynamic: true }) 
                });
                
            const row = new ActionRowBuilder().addComponents([button1, buttonkapat, button2]);
            
            // Mesajı düzenle ve sayfa içeriğini göster
            const curPage = await msg.edit({
                embeds: [embed.setDescription(pages[currentPage - 1].map((value, index) => {
                    const member = message.guild.members.cache.get(value.id);
                    const userMention = member ? member.toString() : `<@${value.id}>`;
                    const unixTime = Number(String(value.Date).substring(0, 10));
                    return `\` ${index + 1 + ((currentPage - 1) * 10)} \` ${userMention} <t:${unixTime}:F>`;
                }).join("\n"))],
                components: [row]
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
                        message.react(message.guild.emojis.cache.get(emojiler.Onay) || '✅').catch(err => {});
                        break;
                }
                
                if (isBreak) return;

                await i.deferUpdate();
                
                // Sayfa içeriğini güncelleme
                await curPage.edit({
                    embeds: [embed.setFooter({ 
                        text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length} • Yetkili: ${res.Staffs.length || 0}`, 
                        iconURL: message.guild.iconURL({ dynamic: true }) 
                    }).setDescription(pages[currentPage - 1].map((value, index) => {
                        const member = message.guild.members.cache.get(value.id);
                        const userMention = member ? member.toString() : `<@${value.id}>`;
                        const unixTime = Number(String(value.Date).substring(0, 10));
                        return `\` ${index + 1 + ((currentPage - 1) * 10)} \` ${userMention} <t:${unixTime}:F>`;
                    }).join("\n"))]
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
                        }).setDescription(`${uye} isimli üyesinin toplamda \`${res.Staffs.length || 0}\` adet yetkilisi mevcut.`)],
                        components: [],
                    }).catch(err => {});
                }
            });
        });
    }
};