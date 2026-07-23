const { Client, Message, PermissionFlagsBits } = require("discord.js");
// Global değişkenler: roller, cevaplar, emojiler
const { roller, cevaplar, emojiler } = global;

module.exports = {
    Isim: "temizle",
    Komut: ["sil"],
    Kullanim: "temizle <1-100>",
    Aciklama: "Belirlenen miktar kadar metin kanallarındaki mesajları temizler.",
    Kategori: "yönetim",
    Extend: true,

    onLoad: function (client) { },

    onRequest: async (client, message, args) => {
        // İzin Kontrolü
        const hasKurucu = roller.kurucuRolleri?.some(oku => message.member.roles.cache.has(oku)) || false;
        const hasUstYonetim = roller.üstYönetimRolleri?.some(oku => message.member.roles.cache.has(oku)) || false;
        const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasKurucu && !hasUstYonetim && !isAdmin) {
            const reply = await message.reply(cevaplar.noyt || "Bu komutu kullanma yetkin yok!").catch(() => {});
            setTimeout(() => reply?.delete().catch(() => {}), 5000);
            return;
        }

        const amount = parseInt(args[0]);

        if (!args[0] || isNaN(amount) || amount < 1 || amount > 100) {
            const reply = await message.reply(cevaplar.argümandoldur || "Geçerli bir miktar belirtmelisin! (1-100)").catch(() => {});
            setTimeout(() => reply?.delete().catch(() => {}), 5000);
            return;
        }

        try {
            // Maximum 100 mesaj fetch edilebilir
            const fetched = await message.channel.messages.fetch({ limit: Math.min(amount + 1, 100) });

            if (fetched.size === 0) {
                return message.reply("Silinecek mesaj bulunamadı.").catch(() => {});
            }

            const deletedMessages = await message.channel.bulkDelete(fetched, true);

            if (deletedMessages && deletedMessages.size > 0) {
                const deletedCount = deletedMessages.size - 1;

                const emoji = message.guild.emojiGöster?.(emojiler?.Onay) || "✅";

                const confirmMessage = await message.channel.send({
                    content: `${emoji} ${message.channel} kanalında **${deletedCount}** adet mesaj başarıyla temizlendi.`
                }).catch(() => {});

                if (confirmMessage) {
                    setTimeout(() => confirmMessage.delete().catch(() => {}), 5000);
                }
            }

        } catch (error) {
            console.error("Temizle komutu hatası:", error);

            if (error.code === 50034 || error.code === 50035) {
                return message.reply("❌ 14 günden eski mesajlar silinemez!").catch(() => {});
            }

            message.reply("❌ Mesajlar silinirken bir hata oluştu.").catch(() => {});
        }
    }
};