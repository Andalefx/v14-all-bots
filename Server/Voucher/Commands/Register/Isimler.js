const { 
    Client, 
    Message, 
    EmbedBuilder, // V14: MessageEmbed yerine
    ActionRowBuilder, // V14: MessageActionRow yerine
    ButtonBuilder, // V14: MessageButton yerine
    ButtonStyle // V14: Düğme Stilleri için
} = require("discord.js");

const { genEmbed } = require("../../../../Global/İnit/Embed");
const Users = require('../../../../Global/Databases/Client.Users');

// NOT: roller, emojiler, cevaplar, ayarlar, sistem gibi global değişkenlerin tanımlı olduğu varsayılmıştır.

module.exports = {
    Isim: "isimler",
    Komut: ["isimsorgu"],
    Kullanim: "isimler <@andale/ID>",
    Aciklama: "Belirlenen üyenin önceki isim ve yaşlarını gösterir.",
    Kategori: "teyit",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) {
    // client.on("ready", () => {}) // Örnek
  },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */

    onRequest: async function (client, message, args) {
        
        // Yetki Kontrolü
        if(!roller.teyitciRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply({content: cevaplar.noyt}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }

        let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]) || (args.length > 0 ? client.users.cache.filter(e => e.username.toLowerCase().includes(args.join(" ").toLowerCase())).first(): message.author) || message.author;
        
        if (!uye) return message.reply({content: cevaplar.üyeyok}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Üye nesnesini tekrar MessageMember olarak almak (zaten var olsa da garantiye almak)
        uye = message.guild.members.cache.get(uye.id)

        let isimveri = await Users.findById(uye.id)

        // İsim verisi yoksa
        if(!isimveri || !isimveri.Names || isimveri.Names.length === 0) {
            return message.reply({embeds: [new genEmbed().setAuthor({name: uye.user.tag, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`${uye} üyesinin isim kayıtı bulunamadı.`)]});
        }
        
        // Sayfalama (Pagination)
        const pages = isimveri.Names.sort((a, b) => b.Date - a.Date).chunk(10);
        let currentPage = 1;
        
        // 10'dan az isim varsa direkt göster
        if(isimveri.Names.length < 10) {
            let isimler = isimveri.Names.reverse().map((value, index) => 
                `\`${value.Name}\` (${value.State}) ${value.Staff ? "(<@"+ value.Staff + ">)" : ""}`
            ).join("\n");
            
            return message.reply({embeds: [new genEmbed().setAuthor({name: uye.user.tag, iconURL: uye.user.displayAvatarURL({dynamic: true})}).setDescription(`${uye} üyesinin toplamda **${isimveri.Names.length}** isim kayıtı bulundu.\n\n${isimler}`)]})
        } 
        
        // 10'dan fazla isim varsa sayfalama yap
        
        // Düğmeleri Oluşturma (V14)
        const button1 = new ButtonBuilder()
            .setCustomId('geri')
            .setLabel('◀ Geri')
            .setStyle(ButtonStyle.Primary) // V14: ButtonStyle
            .setDisabled(currentPage === 1); // İlk sayfa ise devre dışı
            
        const buttonkapat = new ButtonBuilder()
            .setCustomId('kapat')
            .setLabel('❌')
            .setStyle(ButtonStyle.Secondary);
            
        const button2 = new ButtonBuilder()
            .setCustomId('ileri')
            .setLabel('İleri ▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === pages.length); // Son sayfa ise devre dışı

        const row = new ActionRowBuilder().addComponents([button1, buttonkapat, button2]);

        let embed = new genEmbed()
            .setAuthor({name: uye.user.tag, iconURL: uye.user.displayAvatarURL({dynamic: true})})
            .setColor("White")
            .setFooter({text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, iconURL: message.guild.iconURL({dynamic: true})})
            .setDescription(`${uye} üyesinin toplamda **${isimveri.Names.length || 0}** isim kayıtı bulundu.\n\n${pages[currentPage - 1].map((value, index) => 
                `\`${value.Name}\` (${value.State}) ${value.Staff ? "(<@"+ value.Staff + ">)" : ""}`
            ).join("\n")}`);

        // Mesajı gönderme
        const curPage = await message.reply({
            embeds: [embed],
            components: [row], 
            fetchReply: true,
        }).catch(err => {});

        if (!curPage) return; // Mesaj gönderilemezse dur

        const filter = (i) => i.user.id === message.member.id && i.customId;

        const collector = curPage.createMessageComponentCollector({
            filter,
            time: 30000,
        });

        collector.on("collect", async (i) => {
            if(i.customId === "kapat") {
                await i.update({
                    embeds: [embed.setDescription(`${uye} isimli üyesinin toplamda \`${isimveri.Names.length || 0}\` adet isim geçmişi bulunmakta.` ).setFooter({text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name}`, iconURL: message.guild.iconURL({dynamic: true})})],
                    components: [],
                }).catch(err => {});
                collector.stop();
                return message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
            }

            // Sayfa geçişi
            if (i.customId === "ileri" && currentPage < pages.length) {
                currentPage++;
            } else if (i.customId === "geri" && currentPage > 1) {
                currentPage--;
            } else {
                return i.deferUpdate().catch(err => {}); // Başka bir şeyse güncelleme yapma
            }
            
            // Düğmeleri güncelleme
            const newButton1 = ButtonBuilder.from(button1).setDisabled(currentPage === 1);
            const newButton2 = ButtonBuilder.from(button2).setDisabled(currentPage === pages.length);
            const newRow = new ActionRowBuilder().addComponents([newButton1, buttonkapat, newButton2]);

            // Embed ve mesajı güncelleme
            await i.update({
                embeds: [embed
                    .setFooter({text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length} `, iconURL: message.guild.iconURL({dynamic: true})})
                    .setDescription(`${uye} üyesinin toplamda **${isimveri.Names.length || 0}** isim kayıtı bulundu.\n\n${pages[currentPage - 1].map((value, index) => 
                        `\`${value.Name}\` (${value.State}) ${value.Staff ? "(<@"+ value.Staff + ">)" : ""}`
                    ).join("\n")}`)
                ],
                components: [newRow]
            }).catch(err => {});
            
            collector.resetTimer();
        });

        collector.on("end", () => {
            // Süre dolduğunda düğmeleri kaldır
            if(curPage) curPage.edit({
                embeds: [embed.setFooter({text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name}`, iconURL: message.guild.iconURL({dynamic: true})}).setDescription(`${uye} isimli üyesinin toplamda \`${isimveri.Names.length || 0}\` adet isim geçmişi bulunmakta.`)],
                components: [],
            }).catch(err => {});
        });
    }
};