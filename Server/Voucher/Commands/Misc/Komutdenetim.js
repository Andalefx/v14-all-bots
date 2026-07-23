const { Client, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
// V14: MessageEmbed, MessageButton, MessageActionRow yerine yukarıdaki importlar kullanıldı.

const { genEmbed } = require("../../../../Global/İnit/Embed");
const Users = require('../../../../Global/Databases/Client.Users');
// Varsayım: 'roller', 'cevaplar', 'ayarlar', 'emojiler' ve 'global.sistem' değişkenlerinin erişilebilir olduğu varsayılmıştır.
const roller = global.roller 
const ayarlar= global.ayarlar 
const cevaplar = global.cevaplar 
const emojiler = global.emojiler 
module.exports = {
  Isim: "komutdenetim",
  Komut: ["komutkullanimi"],
  Kullanim: "komutdenetim @andale/ID",
  Aciklama: "Bir üyenin kullandığı komut geçmişini gösterir.",
  Kategori: "yönetim",
  Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) {

  },

   /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */

  onRequest: async function (client, message, args) {
        // genEmbed'in EmbedBuilder döndürdüğü varsayılmıştır.
        let embed = new genEmbed();

        // Yetki Kontrolü
        const requiredRoles = [
            ...(roller.üstYönetimRolleri || []),
            ...(roller.kurucuRolleri || []),
            ...(roller.altYönetimRolleri || []),
            ...(roller.Yetkiler || []),
            ...(roller.yönetimRolleri || [])
        ];
        
        const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || requiredRoles.some(oku => message.member.roles.cache.has(oku));
        
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Üye Bulma
        let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]) || (args.length > 0 ? client.users.cache.filter(e => e.username.toLowerCase().includes(args.join(" ").toLowerCase())).first(): message.author) || message.author;
        // Eğer kullanıcı GuildMember değilse çevir
        uye = message.guild.members.cache.get(uye.id)

        // V14 Butonları
        const button1 = new ButtonBuilder()
            .setCustomId('geri')
            .setLabel('◀ Geri')
            .setStyle(ButtonStyle.Primary); 
            
        const buttonkapat = new ButtonBuilder()
            .setCustomId('kapat')
            .setEmoji("929001437466357800") // Emoji ID'si kullanıldı
            .setStyle(ButtonStyle.Danger); 
                
        const button2 = new ButtonBuilder()
            .setCustomId('ileri')
            .setLabel('İleri ▶')
            .setStyle(ButtonStyle.Primary); 

        // Mongoose Sorgusu (Promise Tabanlı)
        const res = await Users.findOne({_id: uye.id }).catch(err => {
             console.error("Mongoose FindOne Hatası (KomutLog):", err);
             return null;
        });

        if (!res || !res.CommandsLogs || res.CommandsLogs.length === 0) {
            return message.reply({content: `${cevaplar.prefix} Komut bilgisi bulunamadı.`}).then(x => setTimeout(() => {x.delete().catch(e => {})}, 7500))
        }
        
        // **KRİTİK NOT:** .chunk() metodu Array.prototype'a eklenmiş olmalıdır.
        if (!Array.prototype.chunk) { 
            Array.prototype.chunk = function(chunkSize) {
                const R = [];
                for (let i = 0; i < this.length; i += chunkSize) R.push(this.slice(i, i + chunkSize));
                return R;
            };
        }

        let pages = res.CommandsLogs.sort((a, b) => b.Tarih - a.Tarih).chunk(20);
        var currentPage = 1

        if (!pages || !pages.length || !pages[currentPage - 1]) return message.reply({content: `${cevaplar.prefix} Komut bilgisi bulunamadı.`}).then(x => setTimeout(() => {x.delete().catch(e => {})}, 7500))
        
        // V14 EmbedBuilder
        embed
            .setColor("White")
            .setAuthor({name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})})
            .setFooter({text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, iconURL: message.guild.iconURL({dynamic: true})})
        
        // V14 ActionRowBuilder
        const row = new ActionRowBuilder().addComponents([button1, buttonkapat, button2]);
        
        // DeferReply (Interaction bazlı komutlarda gerekli, mesaj bazlı komutlarda opsiyonel ama iyi pratik)
        if (message.deferred == false){
             await message.deferReply().catch(err => {});
        };

        const curPage = await message.channel.send({
            embeds: [embed.setDescription(`${uye}, üyesin komut bilgileri yükleniyor... Lütfen bekleyin...`)],
            components: [row], 
            fetchReply: true,
        }).catch(err => {});
        
        if (!curPage) return; // Mesaj gönderilemediyse dur.

        // Sayfa İçeriği Oluşturma Fonksiyonu
        const updatePageContent = (pageIndex) => {
             // global.sistem.botSettings.Prefixs[0] değişkeninin erişilebilir olduğu varsayılır.
            const prefix = (global.sistem && global.sistem.botSettings && global.sistem.botSettings.Prefixs) ? global.sistem.botSettings.Prefixs[0] : "!";

            return `${uye} isimli üyesinin toplamda \`${res.CommandsLogs.length || 0}\` adet komut kullanımı mevcut.

${pages[pageIndex].map((value, index) => {
    // V14 Tarih Formatı: <t:timestamp:R>
    const dateTimestamp = String(value.Tarih).slice(0, 10);
    const channelMention = value.Kanal ? message.guild.channels.cache.get(value.Kanal) ? `(${message.guild.channels.cache.get(value.Kanal)})` : `` : ``;
    
    return `\` ${index + 1 + (pageIndex * 20)} \` **${prefix}${value.Komut}** ${channelMention} <t:${dateTimestamp}:R>`
}).join("\n")}`
        }

        // İlk Sayfayı Gösterme
        await curPage.edit({embeds: [embed.setDescription(updatePageContent(currentPage - 1))]}).catch(err => {})

        const filter = (i) => i.user.id == message.member.id

        const collector = await curPage.createMessageComponentCollector({
            filter,
            time: 30000,
        });

        collector.on("collect", async (i) => {
            let next = false;
            switch (i.customId) {
                case "ileri":
                    if (currentPage == pages.length) break;
                    currentPage++;
                    next = true;
                    break;
                case "geri":
                    if (currentPage == 1) break;
                    currentPage--;
                    next = true;
                    break;
                case "kapat":
                    await i.deferUpdate().catch(err => {});
                    curPage.delete().catch(err => {})
                    // Orijinal mesaja emoji ekle
                    return message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(e => {});
            }
            
            // Sadece sayfa değiştiyse düzenle
            if(next) {
                await i.deferUpdate().catch(err => {});
                await curPage.edit({
                    embeds: [embed.setFooter({text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length} `, iconURL: message.guild.iconURL({dynamic: true})}).setDescription(updatePageContent(currentPage - 1))]
                }).catch(err => {});
                collector.resetTimer();
            }
        });

        collector.on("end", () => {
            if(curPage && curPage.editable) curPage.edit({
                embeds: [embed.setFooter({text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name}`, iconURL: message.guild.iconURL({dynamic: true})}).setDescription(`${uye} isimli üyesinin toplamda \`${res.CommandsLogs.length || 0}\` adet komut kullanımı mevcut.`)],
                components: [], // Süre bitince butonları kaldır
            }).catch(err => {});
        })
    }
};