const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType 
} = require("discord.js");
const Stats = require('../../../../Global/Databases/Client.Users.Stats');
const Invites = require('../../../../Global/Databases/Global.Guild.Invites');
const Users = require('../../../../Global/Databases/Client.Users');
const Upstaff = require('../../../../Global/Databases//Client.Users.Staffs');
const Unleash = require('../../../../Global/Databases/Guıild.Remove.Staffs');
const moment = require('moment');
const { genEmbed } = require('../../../../Global/İnit/Embed');

// Global değişkenlerin ve fonksiyonların varlığı varsayılmıştır.
// const { roller, ayarlar, cevaplar, emojiler } = global;

module.exports = {
    Isim: "yetki-geçmiş",
    Komut: ["yetkigeçmişi", "yetkigecmis", "yükseltimler", "yukseltimler", "yetki-gecmis", "laststaff", "yetkigecmisi", "yetkiligeçmişi", "yetkiligecmisi", "yetkiligecmis", "yetkiligeçmiş"],
    Kullanim: "yükseltimler <@andale/ID>",
    Aciklama: "Belirlenen yetkilinin sunucu içerisindeki yetki yükseltim/düşürme geçmişini gösterir.",
    Kategori: "stat",
    Extend: true,
    
    onLoad: function (client) {}, 

    onRequest: async function (client, message, args) {
        let embed = new genEmbed();
        
        // İzin Kontrolü
        const hasPermission = roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator) ||
                              roller.yükselticiRoller.some(x => message.member.roles.cache.has(x)) ||
                              roller.limitliYükselticiRolleri.some(x => message.member.roles.cache.has(x));
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        // Üye Bulma
        let kullanıcı = message.mentions.users.first() || client.users.cache.get(args[0]);
        if (!kullanıcı) {
            return message.reply({ content: cevaplar.üye }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        let uye = message.guild.members.cache.get(kullanıcı.id);
        if (!uye) {
            return message.reply({ content: cevaplar.üye }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

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

        // Orijinal kodunuzda mesaj göndermeden önce deferReply yapılıyordu.
        // Mesajı göndermeden önce yanıtı erteleyelim (defer)
        if (message.deferred == false) {
             await message.deferReply();
        }

        // Veri Çekme
        Users.findOne({ _id: uye.id }, async (err, res) => {
            
            // İlk Mesajı Gönderme (Taranıyor...)
            let msg = await message.channel.send({ embeds: [new genEmbed().setDescription(`Yetkili geçmişi taranıyor...`)] });

            if (!res || !res.StaffLogs || res.StaffLogs.length === 0) {
                return msg.edit({
                    embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) }).setDescription(`${uye} isimli yetkilinin yükseltim geçmiş bilgisi bulunamadı.`)]
                }).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
            }

            // Sayfalama
            let pages = res.StaffLogs.sort((a, b) => b.Date - a.Date).chunk(10); // chunk global varsayılmıştır.
            var currentPage = 1;
            
            if (!pages || !pages.length || !pages[currentPage - 1]) {
                 return msg.edit({
                    embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) }).setDescription(`${uye} isimli yetkilinin yükseltim geçmiş bilgisi bulunamadı.`)]
                }).then(x => setTimeout(() => { x.delete().catch(err => {}) }, 7500));
            }
            
            // Ana Embed ve ActionRow Hazırlama
            let embed = new genEmbed().setColor("White")
                .setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ extension: "png" }) })
                .setFooter({ text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, iconURL: message.guild.iconURL({ dynamic: true }) });
                
            const row = new ActionRowBuilder().addComponents([button1, buttonkapat, button2]);
            
            // Mesajı Düzenle
            const curPage = await msg.edit({
                embeds: [embed.setDescription(`${pages[currentPage - 1].map((x, index) => {
                    const rol = message.guild.roles.cache.get(x.Role);
                    const unixTime = Number(String(x.Date).substring(0, 10));
                    return `\` ${index + 1 + ((currentPage - 1) * 10)} \` ${rol ? rol : "@Rol Bulunamadı"} <t:${unixTime}:R> [**${x.Process}**] (<@${x.Author}>)`;
                }).join("\n")}`)],
                components: [row]
            }).catch(err => {});
            
            // Mesajı deferReply ile yanıtladığımız için artık orijinal yanıtı düzenleyebiliriz.
            // Orijinal kodunuzdaki deferReply ve sonrasında edit adımları düzenlendi.

            // --------------------------------------------------------------------------------
            // Collector Başlatma
            // --------------------------------------------------------------------------------
            
            const filter = (i) => i.user.id == message.member.id;

            const collector = await curPage.createMessageComponentCollector({
                filter,
                time: 30000,
                componentType: ComponentType.Button, // V14'te belirtilmesi önerilir
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
                    embeds: [embed.setFooter({ text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length} `, iconURL: message.guild.iconURL({ dynamic: true }) })
                                    .setDescription(`${pages[currentPage - 1].map((x, index) => {
                                        const rol = message.guild.roles.cache.get(x.Role);
                                        const unixTime = Number(String(x.Date).substring(0, 10));
                                        return `\` ${index + 1 + ((currentPage - 1) * 10)} \` ${rol ? rol : "@Rol Bulunamadı"} <t:${unixTime}:R> [**${x.Process}**] (<@${x.Author}>)`;
                                    }).join("\n")}`)]
                }).catch(err => {});
                
                collector.resetTimer();
            });

            collector.on("end", () => {
                if (curPage) {
                    curPage.edit({
                        embeds: [embed.setFooter({ text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name}`, iconURL: message.guild.iconURL({ dynamic: true }) })
                                        .setDescription(`${uye} isimli yetkilinin toplamda \`${res.StaffLogs.length || 0}\` adet yükseltim geçmiş bilgisi mevcut.`)],
                        components: [],
                    }).catch(err => {});
                }
            });
        });
    }
};