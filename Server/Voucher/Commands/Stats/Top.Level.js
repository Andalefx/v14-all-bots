const {
    Client,
    Message,
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");
const {
    genEmbed
} = require("../../../../Global/İnit/Embed");
const util = require("util");
const Stats = require("../../../../Global/Databases/Client.Users.Stats"); 
const Users = require('../../../../Global/Databases/Client.Users');
const Upstaffs = require('../../../../Global/Databases/Client.Users.Staffs');
const ms = require('ms');
const moment = require('moment');
require('moment-duration-format');

const {
    createCanvas,
    loadImage
} = require('canvas');
const path = require("path");

module.exports = {
    Isim: "toplevel",
    Komut: ["topseviye", "top-level"],
    Kullanim: "toplevel",
    Aciklama: "En yüksek seviyedeki üyeleri listeler.",
    Kategori: "-",
    Extend: true,

    onLoad: function (client) {},

    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array<String>} args 
     */
    onRequest: async function (client, message, args) {
        let Row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId("SES")
                .setEmoji("1004426555390435468")
                .setLabel("Seviye Sıralaması")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),

                new ButtonBuilder()
                .setCustomId("mesaj")
                .setEmoji("1000142003729874975")
                .setLabel("Genel İstatistik Sıralaması")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(false)
            );

        let msg = await message.reply({
            content: `Top Ses ve metin seviye sıralaması yükleniyor... Bu işlem biraz uzayabilir.`
        });

        let Stat = await Stats.find({});
        let data = [];

        // Sunucudaki AKTİF/ÖNBELLEKTEKİ tüm üyeleri tarayıp, verisi olmayanlara otomatik 0 veriyoruz
        message.guild.members.cache
            .filter(uye => !uye.user.bot)
            .forEach(uye => {
                let userStat = Stat.find(x => x.userID === uye.id);
                data.push({
                    id: uye.id,
                    ses: userStat ? (userStat.voiceLevel || 0) : 0,
                    mesaj: userStat ? (userStat.messageLevel || 0) : 0,
                    xp: userStat ? Number((userStat.messageXP || 0) + (userStat.voiceXP || 0)) : 0
                });
            });
            
        data = data.sort((a, b) => Number(b.xp) - Number(a.xp)).slice(0, 10);

        if (data.length === 0) {
            return msg.edit({ content: "Sunucuda listelenecek üye bulunamadı." });
        }

        const canvas = createCanvas(697, data.length * 59);
        const ctx = canvas.getContext('2d');

        const ASSETS_PATH = path.resolve(__dirname, '..', '..', 'Assets'); 
        
        let back, one, two, three, icon, icon2;
        try {
            back = await loadImage(path.join(ASSETS_PATH, 'back.png'));
            one = await loadImage(path.join(ASSETS_PATH, 'one.png'));
            two = await loadImage(path.join(ASSETS_PATH, 'two.png'));
            three = await loadImage(path.join(ASSETS_PATH, 'three.png'));
            icon = await loadImage(path.join(ASSETS_PATH, 'voice.png'));
            icon2 = await loadImage(path.join(ASSETS_PATH, 'chat.png'));
        } catch (err) {
            return msg.edit({ content: `❌ Görsel assetler yüklenirken hata oluştu. Klasör yollarını kontrol edin.` });
        }

        let start = 30;
        let bstart = 0;

        for (let i = 0; i < data.length; i++) {
            let uye = message.guild.members.cache.get(data[i].id);
            if (!uye) continue;

            let avatarURL = uye.user.displayAvatarURL({ extension: 'jpg', size: 128 });
            let avatar;
            try {
                avatar = await loadImage(avatarURL);
            } catch (e) {
                avatar = await loadImage("https://cdn.discordapp.com/attachments/990322473750917120/1005299390921064498/aotNervousEren.png");
            }

            ctx.drawImage(back, 0, Number(bstart), 678, 56);
            ctx.drawImage(avatar, 70, Number(start - 23), 42, 42);
            ctx.drawImage(icon, 460, Number(start - 23), 42, 42);
            ctx.drawImage(icon2, 560, Number(start - 23), 42, 42);

            let textColor = "WHITE";
            if (i == 0) {
                textColor = "CYAN";
                ctx.drawImage(one, 17, Number(start - 18), 32, 32);
            } else if (i == 1) {
                textColor = "YELLOW";
                ctx.drawImage(two, 17, Number(start - 18), 32, 32);
            } else if (i == 2) {
                textColor = "GREEN";
                ctx.drawImage(three, 17, Number(start - 18), 32, 32);
            } else if (i == 3) {
                textColor = "ORANGE";
            } else if (i == 4) {
                textColor = "GRAY";
            }

            ctx.fillStyle = textColor; 
            let userTag = uye.user.username; 
            
            if (userTag.length > 12) {
                ctx.font = '18px Arial Black';
                ctx.fillText(`${userTag}`, 130, Number(start + 5), 300); 
            } else {
                ctx.font = '20px Arial Black';
                ctx.fillText(`${userTag}`, 130, Number(start + 2), 300);
            }

            if (i != 0 && i != 1 && i != 2) {
                 ctx.font = '20px Arial Black';
                 ctx.fillText(`#${i + 1}`, 20, Number(start + 2), 50);
            }
            
            ctx.font = '18px Arial Black';
            ctx.fillText(`${data[i].ses} Sv.`, 510, Number(start + 5), 60);
            ctx.fillText(`${data[i].mesaj} Sv.`, 610, Number(start + 5), 60);
            
            bstart += 57;
            start += 57;
        }

        let attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "acar-siralama.png" });

        let ses = new genEmbed()
            .setDescription(`Aşağıda gösterilen tabloda \`${message.guild.name}\` sunucusuna ait en iyi genel ses ve mesaj seviye sıralaması gösterilmektedir. Bu sıralama ses ve mesaj xp'inizin toplamını baz alır.`)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setImage("attachment://acar-siralama.png");

        await msg.edit({
            content: null,
            components: [Row],
            embeds: [ses],
            files: [attachment]
        });

        var filter = (i) => i.user.id == message.member.id;
        let collector = msg.createMessageComponentCollector({
            filter: filter,
            time: 60000
        });

        collector.on('collect', async (i) => {
            if (i.customId == "mesaj") {
                await msg.delete().catch(err => {});
                let com = client.commands.find(x => x.Isim == "top");
                if (com) com.onRequest(client, message, args);
                await i.deferUpdate().catch(err => {});
            }
        });

        collector.on('end', async (c, reason) => {
            if (reason == "time") {
                await msg.delete().catch(err => {});
            }
        });
    }
};

function çevirSüre(date) {
    return moment.duration(date).format('H [saat,] m [dakika]');
}