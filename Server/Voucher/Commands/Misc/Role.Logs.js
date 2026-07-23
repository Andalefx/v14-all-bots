const { Client, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "rollog",
    Komut: ["rollog", "rolgeçmişi"],
    Kullanim: "rollog @üye/ID",
    Aciklama: "Bir üyenin rol geçmişini görüntüler. Üye belirtilmezse komutu yazanın geçmişini gösterir.",
    Kategori: "yönetim",
    Extend: true,

    onRequest: async function (client, message, args) {
        // Yetki Kontrolü
        if (!message.member.permissions.has('Administrator') && 
            !roller?.Yetkiler?.some(oku => message.member.roles.cache.has(oku)) && 
            !roller?.üstYönetimRolleri?.some(oku => message.member.roles.cache.has(oku)) && 
            !roller?.kurucuRolleri?.some(oku => message.member.roles.cache.has(oku)) && 
            !roller?.altYönetimRolleri?.some(oku => message.member.roles.cache.has(oku)) && 
            !roller?.yönetimRolleri?.some(oku => message.member.roles.cache.has(oku))) {
            return message.reply(cevaplar?.noyt || "Bu komutu kullanma yetkin yok.").then(s => setTimeout(() => s.delete().catch(() => {}), 5000));
        }

        // Üye belirtilmezse komutu yazanı al
        let uye = message.mentions.members.first() || 
                  message.guild.members.cache.get(args[0]) || 
                  (args.length ? message.guild.members.cache.find(m => m.user.username.toLowerCase().includes(args.join(" ").toLowerCase())) : null);

        if (!uye) uye = message.member;

        try {
            const res = await Users.findOne({ _id: uye.id });

            if (!res?.Roles?.length) {
                return message.channel.send({
                    embeds: [new genEmbed()
                        .setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ dynamic: true }) })
                        .setDescription(`${uye} isimli üyenin rol bilgisi bulunamadı.`)]
                }).then(x => setTimeout(() => x.delete().catch(() => {}), 7500));
            }

            let sortedRoles = res.Roles.sort((a, b) => b.tarih - a.tarih);
            let pages = [];
            for (let i = 0; i < sortedRoles.length; i += 10) {
                pages.push(sortedRoles.slice(i, i + 10));
            }

            let currentPage = 1;

            const embed = new genEmbed()
                .setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ dynamic: true }) });

            const button1 = new ButtonBuilder().setCustomId('geri').setLabel('◀ Geri').setStyle(ButtonStyle.Primary);
            const buttonkapat = new ButtonBuilder().setCustomId('kapat').setEmoji("1517138914572238859").setStyle(ButtonStyle.Danger);
            const button2 = new ButtonBuilder().setCustomId('ileri').setLabel('İleri ▶').setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button1, buttonkapat, button2);

            const curPage = await message.channel.send({
                embeds: [embed.setDescription("Rol geçmişi yükleniyor...")],
                components: [row]
            });

            // İlk sayfayı güvenli şekilde güncelle
            embed.setDescription(generateDescription(pages[0], message.guild));
            embed.setFooter({ 
                text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, 
                iconURL: message.guild.iconURL({ dynamic: true }) 
            });

            await curPage.edit({ embeds: [embed] });

            const filter = i => i.user.id === message.member.id;
            const collector = curPage.createMessageComponentCollector({ filter, time: 120000 });

            collector.on("collect", async (i) => {
                await i.deferUpdate();

                if (i.customId === "ileri" && currentPage < pages.length) currentPage++;
                else if (i.customId === "geri" && currentPage > 1) currentPage--;
                else if (i.customId === "kapat") {
                    await curPage.delete().catch(() => {});
                    return;
                }

                embed.setDescription(generateDescription(pages[currentPage - 1], message.guild));
                embed.setFooter({ 
                    text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, 
                    iconURL: message.guild.iconURL({ dynamic: true }) 
                });

                await curPage.edit({ embeds: [embed] });
            });

            collector.on("end", () => {
                embed.setDescription(`${uye} isimli üyesinin toplamda \`${res.Roles.length || 0}\` adet rol bilgisi mevcut.`);
                curPage.edit({ components: [] }).catch(() => {});
            });

        } catch (err) {
            console.error(err);
            message.reply("Veritabanı hatası oluştu.").catch(() => {});
        }
    }
};

// Yardımcı Fonksiyon
function generateDescription(items, guild) {
    return items.map((x, index) => {
        const rolMetni = Array.isArray(x.rol) 
            ? x.rol.map(r => guild.roles.cache.get(r) || "@Silinmiş Rol").join(", ")
            : (guild.roles.cache.get(x.rol) || "@Silinmiş Rol");

        return `\` ${index + 1} \` ${rolMetni} <t:${Math.floor(x.tarih / 1000)}:R> [**${x.state === "Ekleme" ? "EKLEME" : "KALDIRMA"}**] (<@${x.mod ? x.mod : "Bilinmeyen Yetkili"}>)`;
    }).join("\n");
}