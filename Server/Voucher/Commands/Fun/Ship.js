const { Client, Message, AttachmentBuilder, ActionRowBuilder, ButtonBuilder ,ButtonStyle } = require("discord.js");
const Canvas = require('canvas');
const { genEmbed } = require("../../../../Global/İnit/Embed");

Canvas.registerFont(`../../Assets/theboldfont.ttf`, { family: "Bold" });

let cooldown = new Map();

module.exports = {
    Isim: "ship",
    Komut: ["shippe", "love", "sanal8"],
    Kullanim: "ship @üye/ID",
    Aciklama: "İki üye arasında ship atar.",
    Kategori: "fun",
    Extend: true,

    onRequest: async function (client, message, args) {
        if (!message.channel.name.includes("ship")) {
            return message.reply(`Sadece ship kanallarında kullanabilirsiniz.`).then(x => setTimeout(() => x.delete().catch(() => {}), 5000));
        }

        if (cooldown.has(message.member.id)) {
            return message.reply(`Bu komutu **5** saniyede bir kullanabilirsiniz.`).then(x => setTimeout(() => x.delete().catch(() => {}), 7500));
        }

        let person = message.mentions.members.first() || 
                     message.guild.members.cache.get(args[0]);

        if (!person || person.id === message.author.id) {
            let filtered = message.guild.members.cache.filter(m => 
                m.id !== message.author.id && 
                !roller.kayıtsızRolleri.some(x => m.roles.cache.has(x))
            );

            if (roller.erkekRolleri.some(x => message.member.roles.cache.has(x))) {
                filtered = filtered.filter(m => roller.kadınRolleri.some(x => m.roles.cache.has(x)));
            } else if (roller.kadınRolleri.some(x => message.member.roles.cache.has(x))) {
                filtered = filtered.filter(m => roller.erkekRolleri.some(x => m.roles.cache.has(x)));
            }

            person = filtered.random();
        }

        person = message.guild.members.cache.get(person?.id);
        if (!person) return message.reply("Bir üye bulunamadı.");

        // Özel kişiler
        let özel = ["327236967265861633"];
        if (özel.includes(person.id)) {
            return message.reply({ content: `${message.guild.emojiGöster(emojiler.Iptal)} Tabi Efendim Ship Atarsın.` });
        }

        const replies = [
            '5% Uyumlu!', '10% Uyumlu!', '14% Uyumlu!', '20% Uyumlu!', '25% Uyumlu!',
            '32% Uyumlu!', '36% Uyumlu!', '42% Uyumlu!', '47% Uyumlu!', '51% Uyumlu!',
            '56% Uyumlu!', '60% Uyumlu!', '65% Uyumlu!', '70% Uyumlu!', '74% Uyumlu!',
            '78% Uyumlu!', '83% Uyumlu!', '86% Uyumlu!', '91% Uyumlu!', '95% Uyumlu!',
            '98% Uyumlu!', '99% Uyumlu!', '100% Uyumlu!', 'Evlenmeye mahkumsunuz ❤️'
        ];

        let loveIndex = Math.floor(Math.random() * replies.length);
        let love = replies[loveIndex];

        // Emoji linkleri (senin verdiğin)
        let emoticon = 'https://cdn.discordapp.com/attachments/1517159508193841203/1521518170681381064/orta.png?ex=6a451fb8&is=6a43ce38&hm=62881e24db1be29c9473db228f22226ba72214e7565aac45e4a98e46a685bb6d&';
        if (loveIndex >= 23) emoticon = 'https://cdn.discordapp.com/attachments/1517159508193841203/1521518090184294530/cok.png?ex=6a451fa5&is=6a43ce25&hm=df8e6095606f6380a988ded1df67532723bbd737d578a3fc84c2a2bb669ba148&';
        else if (loveIndex >= 12) emoticon = 'https://cdn.discordapp.com/attachments/1517159508193841203/1521518136644472983/az.png?ex=6a451fb0&is=6a43ce30&hm=ff7424e93b8cd8fcf248f9b934afaf102a7a2a454680367673ffef68da129695&';

        try {
            const canvas = Canvas.createCanvas(384, 128);
            const ctx = canvas.getContext('2d');

            const emotes = await Canvas.loadImage(emoticon);
            const avatar1 = await Canvas.loadImage(message.member.displayAvatarURL({ extension: "png", size: 1024 }));
            const avatar2 = await Canvas.loadImage(person.displayAvatarURL({ extension: "png", size: 1024 }));

            // Bot dosyasındaki banner resmi (senin belirttiğin yol)
            const background = await Canvas.loadImage("../../Assets/banner.png"); // ← Burayı kendi dosya yoluna göre değiştir

            ctx.drawImage(background, 0, 0, 384, 128);

            // Karanlık overlay
            ctx.fillStyle = "#000000";
            ctx.globalAlpha = 0.5;
            ctx.fillRect(55, 5, 275, 115);
            ctx.globalAlpha = 1;

            ctx.drawImage(avatar1, 70, 12, 100, 100);
            ctx.drawImage(avatar2, 215, 12, 100, 100);
            ctx.drawImage(emotes, 150, 20, 75, 75);

            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'ship.png' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("tanis")
                    .setLabel("Tanış!")
                    .setEmoji("1517115365317021849")
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(loveIndex < 23)
            );

            await message.reply({
                content: `**${message.member.displayName}** & **${person.displayName}**\nUyumluluğunuz: **${love}**`,
                files: [attachment],
                components: [row]
            });

        } catch (err) {
            console.error("Ship Komutu Hatası:", err);
            message.reply("Görsel oluşturulurken bir hata oluştu.").catch(() => {});
        }

        cooldown.set(message.member.id, true);
        setTimeout(() => cooldown.delete(message.member.id), 5000);
    }
};