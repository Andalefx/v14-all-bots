const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType } = require("discord.js");
const Coins = require('../../../../Global/Databases/Client.Users');

module.exports = {
    Isim: "zenginler",
    Komut: ["topcoin", "top-coin", "zenginlistesi"],
    Kullanim: "topcoin",
    Aciklama: "Majesty Parası ve Altın sıralaması",
    Kategori: "eco",
    Extend: true,

    onRequest: async function (client, message, args) {
        // Tüm ham veriyi çekiyoruz
        let rawData = await Coins.find();

        // Sunucuda bulunan, bot olmayan ve staff listesinde yer almayan kullanıcıları filtrele
        let filteredData = rawData.map(x => ({
            _id: x._id,
            Coin: x.Coin || 0,
            Gold: x.Gold || 0
        })).filter(x => {
            const member = message.guild.members.cache.get(x._id);
            return member && !member.user.bot && !(typeof ayarlar !== 'undefined' && ayarlar.staff && ayarlar.staff.includes(x._id));
        });

        if (filteredData.length === 0) 
            return message.reply("Henüz hiç veri bulunmuyor.");

        const perPage = 10; // Her sayfada 10 kişi
        let currentPage = 0;
        let currentMode = "coin"; // Varsayılan olarak 'coin' (Para), butonla 'gold' (Altın) olacak

        // Dinamik Buton Oluşturucu (Aktif moda göre renkleri ayarlar)
        const generateComponents = (totalPages) => {
            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("first").setLabel("« İlk").setStyle(ButtonStyle.Primary).setDisabled(currentPage === 0),
                new ButtonBuilder().setCustomId("prev").setLabel("‹ Önce").setStyle(ButtonStyle.Primary).setDisabled(currentPage === 0),
                new ButtonBuilder().setCustomId("close").setLabel("Kapat").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("next").setLabel("Sonra ›").setStyle(ButtonStyle.Primary).setDisabled(currentPage >= totalPages - 1),
                new ButtonBuilder().setCustomId("last").setLabel("Son »").setStyle(ButtonStyle.Primary).setDisabled(currentPage >= totalPages - 1)
            );

            const serverName = (typeof ayarlar !== 'undefined' && ayarlar.serverName) || "Majesty";
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("sort_gold").setLabel("Altın Sıralaması").setStyle(currentMode === "gold" ? ButtonStyle.Success : ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("sort_coin").setLabel(`${serverName} Parası`).setStyle(currentMode === "coin" ? ButtonStyle.Success : ButtonStyle.Secondary)
            );

            return [row1, row2];
        };

        // Dinamik Embed Oluşturucu
        const generateEmbed = () => {
            // Aktif moda göre verileri yeniden sırala
            let sortedData = [...filteredData].sort((a, b) => {
                return currentMode === "coin" ? b.Coin - a.Coin : b.Gold - a.Gold;
            });

            const total = sortedData.length;
            const totalPages = Math.ceil(total / perPage) || 1;

            // Sayfa sınır kontrolü
            if (currentPage >= totalPages) currentPage = totalPages - 1;
            if (currentPage < 0) currentPage = 0;

            const start = currentPage * perPage;
            const end = start + perPage;
            const pageData = sortedData.slice(start, end);

            const serverName = (typeof ayarlar !== 'undefined' && ayarlar.serverName) || "Majesty";
            const modeText = currentMode === "coin" ? `${serverName} Parası` : "Altın Sıralaması";

            // Liste satırlarını oluştur (Görseldeki gibi emojiler kaldırıldı, düz metin yapıldı)
            const list = pageData.map((x, index) => {
                const globalIndex = start + index + 1;
                const member = message.guild.members.cache.get(x._id);
                const isSelf = x._id === message.member.id ? " (Siz)" : "";
                const value = currentMode === "coin" ? x.Coin : x.Gold;
                const currencySuffix = currentMode === "coin" ? `${serverName} Parası` : "Altın";

                return `${globalIndex}. ${member}: ${value.toLocaleString("tr-TR")} ${currencySuffix}${isSelf}`;
            }).join("\n");

            // Kullanıcının kendi genel sıralamasını bul
            const selfIndex = sortedData.findIndex(x => x._id === message.member.id);
            const selfRankText = selfIndex !== -1 ? `Siz ${selfIndex + 1}. sırasınız.` : "Sıralamada yer almıyorsunuz.";

            // Görseldeki tam metin şablonu düzeni
            const description = [
                `Sıralama Türü: ${modeText}`,
                `Gösterilen Aralık: ${start + 1} - ${Math.min(end, total)} / ${total}`,
                ``,
                list || "Veri bulunamadı.",
                ``,
                selfRankText,
                ``,
                `**Sayfa ${currentPage + 1}/${totalPages}**`
            ].join("\n");

            return new EmbedBuilder()
                .setTitle(`${serverName} Ekonomi • ${modeText}`)
                .setDescription(description)
                .setColor("#F1C40F"); // Görseldeki altın/sarı tonu
        };

        // İlk verilerle mesajı gönder
        let sortedData = [...filteredData].sort((a, b) => b.Coin - a.Coin);
        let totalPages = Math.ceil(sortedData.length / perPage) || 1;

        let currentEmbed = generateEmbed();
        let currentComponents = generateComponents(totalPages);

        const msg = await message.reply({ embeds: [currentEmbed], components: currentComponents });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === message.author.id,
            time: 120000 // 2 dakika aktif kalır
        });

        collector.on("collect", async i => {
            await i.deferUpdate();

            // Aktif moda göre toplam sayfa sayısını güncel tut
            let currentSorted = [...filteredData].sort((a, b) => {
                return currentMode === "coin" ? b.Coin - a.Coin : b.Gold - a.Gold;
            });
            const activeTotalPages = Math.ceil(currentSorted.length / perPage) || 1;

            // Navigasyon Kontrolleri
            if (i.customId === "first") currentPage = 0;
            else if (i.customId === "prev") currentPage = Math.max(0, currentPage - 1);
            else if (i.customId === "next") currentPage = Math.min(activeTotalPages - 1, currentPage + 1);
            else if (i.customId === "last") currentPage = activeTotalPages - 1;
            
            // Sıralama Türü Değiştirme Kontrolleri
            else if (i.customId === "sort_gold") {
                currentMode = "gold";
                currentPage = 0; // Tür değişince ilk sayfaya atar
            } else if (i.customId === "sort_coin") {
                currentMode = "coin";
                currentPage = 0; // Tür değişince ilk sayfaya atar
            } 
            
            // Kapatma Butonu
            else if (i.customId === "close") {
                return msg.delete().catch(() => {});
            }

            // Yeniden hesaplanan verilerle mesajı güncelle
            let newSorted = [...filteredData].sort((a, b) => {
                return currentMode === "coin" ? b.Coin - a.Coin : b.Gold - a.Gold;
            });
            const newTotalPages = Math.ceil(newSorted.length / perPage) || 1;

            currentEmbed = generateEmbed();
            currentComponents = generateComponents(newTotalPages);
            await msg.edit({ embeds: [currentEmbed], components: currentComponents });
        });

        collector.on("end", () => {
            // Zaman aşımına uğrayınca butonları kaldırır
            msg.edit({ components: [] }).catch(() => {});
        });
    }
};