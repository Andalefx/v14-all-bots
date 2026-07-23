const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

module.exports = {
    Isim: "coinflip",
    Komut: ["cf", "bahis"],
    Kullanim: "coinflip <miktar>",
    Aciklama: "Riskli coinflip",
    Kategori: "eco",

    onRequest: async function (client, message, args) {
        if(!kanallar.coinChat.some(x => message.channel.id == x) && !ayarlar.staff.includes(message.member.id)) 
            return message.reply("Bu komutu sadece coin kanallarında kullanabilirsin.");

        let bakiye = await client.Economy.viewBalance(message.member.id, 1);
        let miktar = Number(args[0]);

        if (!miktar || isNaN(miktar) || miktar < 10) return message.reply("En az `10` Majesty ile oynayabilirsin.");
        if (miktar > 500000) miktar = 500000;
        if (bakiye < miktar) return message.reply("Yeterli bakiyen yok.");

        await client.Economy.updateBalance(message.member.id, miktar, "remove", 1);

        const embed = new EmbedBuilder()
            .setTitle("🎰 Coinflip")
            .setDescription(`**${message.member.displayName}**, \`${miktar.toLocaleString()}\` Majesty için bahis açıldı!\n\nRisk seviyesini seç:`)
            .setColor(0x00ff88)
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("cf_2x").setLabel("2x Orta").setStyle(ButtonStyle.Primary).setEmoji("🟡"),
            new ButtonBuilder().setCustomId("cf_4x").setLabel("4x Zor").setStyle(ButtonStyle.Secondary).setEmoji("🔴"),
            new ButtonBuilder().setCustomId("cf_8x").setLabel("8x Çok Zor").setStyle(ButtonStyle.Danger).setEmoji("💎"),
            new ButtonBuilder().setCustomId("cf_pas").setLabel("Pas Geç").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("cf_cek").setLabel("Çek").setStyle(ButtonStyle.Success)
        );

        const msg = await message.reply({ embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector({ 
            filter: i => i.user.id === message.author.id, 
            time: 60000 
        });

        collector.on("collect", async i => {
            await i.deferUpdate();
            let carpim = 0;

            if (i.customId === "cf_2x") carpim = 2;
            else if (i.customId === "cf_4x") carpim = 4;
            else if (i.customId === "cf_8x") carpim = 8;
            else if (i.customId === "cf_pas" || i.customId === "cf_cek") {
                await client.Economy.updateBalance(message.member.id, miktar, "add", 1);
                return msg.edit({ content: "✅ Bahis iptal edildi, paranız iade edildi.", embeds: [], components: [] });
            }

            const kazandi = Math.random() < (1 / carpim * 0.9); // Basit olasılık

            if (kazandi) {
                const kazanc = Math.floor(miktar * carpim);
                await client.Economy.updateBalance(message.member.id, kazanc, "add", 1);
                embed.setDescription(`**Tebrikler! Kazandın 🎉**\n\nBahis: \`${miktar.toLocaleString()}\`\nÇarpan: **${carpim}x**\nKazanç: \`${kazanc.toLocaleString()} Flory\``);
                embed.setColor("Green");
            } else {
                embed.setDescription(`**Kaybettin 😔**\n\nBahis: \`${miktar.toLocaleString()} Flory\`\nÇarpan: **${carpim}x**`);
                embed.setColor("Red");
            }

            await msg.edit({ embeds: [embed], components: [] });
        });
    }
};