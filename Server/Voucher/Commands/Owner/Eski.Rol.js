const { Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed"); 
const leftRoles = require('../../../../Global/Databases/Users.Left.Roles');
const Upstaff = require('../../../../Global/Databases//Client.Users.Staffs');
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');

// Global değişkenlerin doğru import edildiği varsayılmıştır (roller, cevaplar, emojiler).
const { roller, cevaplar, emojiler } = global;

module.exports = {
    Isim: "eskirol",
    Komut: ["leftrole"],
    Kullanim: "eskirol <@andale/ID>",
    Aciklama: "Sunucudan ayrılan bir üyenin son rollerini listeler ve rolleri tekrar tanımlar.",
    Kategori: "kurucu",
    Extend: true,
    
    /**
    * @param {Client} client 
    */
    onLoad: async function (client) {
        
    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, message, args) {
        // İzin Kontrolü
        const hasPermission = (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator);
                              
        if (!hasPermission) {
            const reply = await message.reply(cevaplar.noyt).catch(err => {});
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
            }, 7500);
            return;
        }

        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || await message.guild.members.fetch({ user: args[0], force: false }).catch(() => null);
        
        if (!uye) {
            const reply = await message.reply(cevaplar.üye).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
            }, 5000);
            return;
        }

        let data = await leftRoles.findOne({ _id: uye.id });
        
        if (!data) {
            const reply = await message.reply(cevaplar.data).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
            }, 5000);
            return;
        }

        // Buton ve Etkileşim Bileşenleri (V14 ActionRowBuilder/ButtonBuilder)
        let Row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("tanımla")
                .setLabel("Üstüne Tanımla!")
                .setStyle(ButtonStyle.Secondary)
        );

        // Rol Listesi Hazırlama
        const validRoles = data._roles.filter(x => message.guild.roles.cache.get(x));
        const roleList = validRoles.map(x => message.guild.roles.cache.get(x)).join("\n");

        let embed = new EmbedBuilder()
            .setDescription(`Aşağıda ${uye} isimli üyenin sunucudan atılmadan/çıkmadan önceki rol veya rolleri listelenmektedir. 
            
            **Rol(ler) şunlardır**:
            ${roleList.length > 0 ? roleList : "Kayıtlı eski rol bilgisi bulunamadı."}`);

        // Mesajı gönderme ve koleksiyoncu başlatma
        let load = await message.reply({ content: `${uye.user.tag} üyesinin çıkmadan önceki yetki rolleri listeleniyor. Lütfen bekleyin...` }).catch(err => {});
        
        if (!load) return; // Mesaj gönderilemezse durdur.

        await load.edit({ 
            content: null, 
            components: [Row], 
            embeds: [embed] 
        }).catch(err => {});

        let filter = (i) => i.user.id === message.author.id;
        let collector = load.createMessageComponentCollector({ filter: filter, max: 1, time: 30000 });

        collector.on('collect', async (i) => {
            if (i.customId === "tanımla") {
                try {
                    // Rolleri tanımla
                    await uye.roles.set(validRoles, "Eski rol komutu ile tanımlandı.");
                    
                    // Veriyi temizle
                    await leftRoles.deleteOne({ _id: uye.id });

                    // Kullanıcıya ephemeral (gizli) yanıt
                    await i.reply({ 
                        content: `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla ${uye} isimli üyeye eski rolleri tanımlandı ve verisi temizlendi.`, 
                        ephemeral: true 
                    });

                    // Başarılı işlem sonrası mesajı düzenle
                    await load.edit({ 
                        content: `${message.guild.emojiGöster(emojiler.Onay)} **${uye.user.tag}** isimli üyeye roller başarıyla tanımlandı.`,
                        components: [], 
                        embeds: [embed] 
                    }).catch(err => {});

                } catch (error) {
                    console.error("Rol tanımlama hatası:", error);
                    await i.reply({ content: `Roller tanımlanırken bir hata oluştu: ${error.message}`, ephemeral: true });
                }
            }
        });

        collector.on('end', async (collected, reason) => {
             // Sadece zaman aşımında veya kullanıcı etkileşimde bulunmazsa sil
            if (reason === 'time' || collected.size === 0) {
                load.delete().catch(err => {});
            }
        });
    }
};