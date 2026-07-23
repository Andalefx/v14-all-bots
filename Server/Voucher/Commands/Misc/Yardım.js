const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine
    ActionRowBuilder, // MessageActionRow yerine
    StringSelectMenuBuilder, // MessageSelectMenu yerine
    StringSelectMenuOptionBuilder // Menü seçenekleri için
} = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');

// Varsayım: 'sistem' ve 'ayarlar' değişkenlerinin erişilebilir olduğu varsayılmıştır.

module.exports = {
    Isim: "yardım",
    Komut: ["help", "yardim"],
    Kullanim: "yardım", // Bu komutun kullanim argümanı yok, o yüzden <@andale/ID> kaldırıldı.
    Aciklama: "Botun tüm komutlarını kategorilere göre listeler.",
    Kategori: "Misc",
    Extend: false,
    
    /**
    * @param {Client} client 
    */
    onLoad: function (client) {
        // İki mesaj sorununa neden olan global dinleyici buradan KALDIRILDI.
        // Artık menü etkileşimi sadece onRequest içindeki collector tarafından yönetilecek.
    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, message, args) {
        
        // V14: StringSelectMenuBuilder kullanımı
        const menuOptions = [
            {label: "Üye Komutları", description: "Genel tüm komutları içerir.", value: "diğer"},
            {label: "Ekonomi Komutları", description: "Genel tüm ekonomi komutlarını içerir.", value: "eco"},
            {label: "İstatistik Komutları", description: "Genel tüm stat komutlarını içerir.", value: "stat"},
            {label: "Teyit Komutları", description: "Genel tüm kayıt komutlarını içerir.", value: "teyit"},
            {label: "Yetkili Komutları", description: "Genel tüm yetkili komutlarını içerir.", value: "yetkili"},
            {label: "Yetenek ve Diğer Komutlar", description: "Genel tüm yetenek ve diğer komutlar içerir.", value: "talent"},
            {label: "Yönetim Komutları", description: "Genel tüm yönetim komutlarını içerir.", value: "yönetim"},
            {label: "Kurucu Komutları", description: "Genel tüm kurucu komutlarını içerir.", value: "kurucu"}
        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("yardimmenusu") 
            .setPlaceholder("Yardım kategorisini listeden seçin!")
            .addOptions(menuOptions.map(option => ({ 
                label: option.label, 
                description: option.description, 
                value: option.value 
            })));

        let Row = new ActionRowBuilder().addComponents(selectMenu);
        
        // Ana Embed
        const helpEmbed = new genEmbed()
            .setDescription(`:tada: Aşağıdaki kategorilerden komut yardımı almak istediğiniz kategoriyi seçin!`);


        const msg = await message.reply({
            components: [Row], 
            embeds: [helpEmbed]
        });

        // Veritabanı verisini bir kere çekmek daha verimli
        let Data = await GUILDS_SETTINGS.findOne({ _id: 1 });

        var filter = i => i.user.id == message.member.id;
        
        let collector = msg.createMessageComponentCollector({filter: filter, time: 60000, error: ["time"]});
        
        collector.on("collect", async i => {
            if(i.customId === "yardimmenusu") {
                const selectedValue = i.values[0];
                let responseContent = "";

                if(selectedValue === "talent") {
                    // Varsayım: sistem ve ayarlar değişkenleri bu kapsamda tanımlı
                    responseContent = `${Data && Data.talentPerms ? Data.talentPerms.map(x => `\`${sistem.botSettings.Prefixs[0] + x.Commands + " <@andale/ID>"}\``).join("\n") : 'Yetenek komutları bulunamadı.'}`;
                } else {
                    responseContent = `${client.commands.filter(x => x.Extend !== false && x.Kategori === selectedValue && (ayarlar.dugmeliKayit ? x.Isim !== "erkek" : true)).map(x => `\`${sistem.botSettings.Prefixs[0] + (ayarlar.dugmeliKayit ? x.Kullanim.replace("kadın", "kayıt") : x.Kullanim)}\``).join("\n")}`;
                }

                // Mesajı düzenle
                await msg.edit({ 
                    embeds: [new genEmbed().setDescription(responseContent)],
                    components: [Row] 
                }).catch(err => {});
                
                // Etkileşimi deferUpdate ile sonlandır (Çift mesajı engeller)
                i.deferUpdate().catch(err => {});
            }
        });

        collector.on("end", () => {
            if (msg) {
                // Sadece menüyü ve bileşenleri kaldırarak mesajı koruyabilirsiniz
                // ya da mesajı silmeye devam edebilirsiniz. (Silme bırakıldı.)
                msg.delete().catch(err => {});
            }
        });
    }
};