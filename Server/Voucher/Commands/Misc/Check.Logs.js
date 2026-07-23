const { Client, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
// V14: MessageEmbed, MessageButton, MessageActionRow yerine yukarıdaki importlar kullanıldı.

const Users = require('../../../../Global/Databases//Users.Components');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const roller = global.roller || require("../../../../Global/Settings/Roles.json");
const cevaplar = global.cevaplar || require("../../../../Global/Settings/Reply")

module.exports = {
    Isim: "checklog",
    Komut: ["tıklamalog","tıklamalog","tiklamalog","ilgilenme","ilgilenmeler"],
    Kullanim: "ilgilenme @andalea/ID",
    Aciklama: "Bir üyenin rol geçmişini görüntüler.",
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
        // Yetki Kontrolü
        const yetkiliRolleri = [
            ...(roller.Yetkiler || []), 
            ...(roller.üstYönetimRolleri || []), 
            ...(roller.kurucuRolleri || []), 
            ...(roller.altYönetimRolleri || []), 
            ...(roller.yönetimRolleri || [])
        ];
        
        const hasPermission = message.member.permissions.has('Administrator') || yetkiliRolleri.some(oku => message.member.roles.cache.has(oku));
        
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Üye Bulma
        let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]) || (args.length > 0 ? client.users.cache.filter(e => e.username.toLowerCase().includes(args.join(" ").toLowerCase())).first(): message.author) || message.author;
        if(!uye) return message.reply(cevaplar.argümandoldur).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
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

        // Mongoose Sorgusu (V14 Promise Tabanlı)
        const res = await Users.findOne({_id: uye.id }).catch(err => {
            console.error("Mongoose FindOne Hatası (Checklog):", err);
            return null;
        });

        if (!res || !res.Checks || res.Checks.length === 0) {
            // setAuthor V14 formatına çevrildi
            return message.reply({embeds: [new genEmbed().setAuthor({name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`${uye} isimli üyenin ilgilenme bilgisi bulunamadı.`)]}).then(x => setTimeout(() => {x.delete().catch(e => {})}, 7500))
        }
        
        // **KRİTİK NOT:** .chunk() metodu Array.prototype'a eklenmiş olmalıdır.
        if (!Array.prototype.chunk) { 
            Array.prototype.chunk = function(chunkSize) {
                const R = [];
                for (let i = 0; i < this.length; i += chunkSize) R.push(this.slice(i, i + chunkSize));
                return R;
            };
        }

        let pages = res.Checks.sort((a, b) => b.date - a.date).chunk(15);
        var currentPage = 1

        let geçerliolanlar = res.Checks.filter(x => {
            let targetUye = message.guild.members.cache.get(x.target)
            // 'ayarlar.tag' ve 'roller.Yetkiler'in erişilebilir olduğu varsayılır.
            return targetUye && (targetUye.user.username.includes(ayarlar.tag) || roller.Yetkiler.some(r => targetUye.roles.cache.has(r)))
        }).length
        
        if (!pages || !pages.length || !pages[currentPage - 1]) return message.reply({embeds: [new genEmbed().setAuthor({name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})}).setDescription(`${uye} isimli üyenin ilgilenme bilgisi bulunamadı.`)]}).then(x => setTimeout(() => {x.delete().catch(e => {})}, 7500))
        
        // V14 EmbedBuilder
        let embed = new genEmbed()
            .setColor("White")
            .setAuthor({name: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})})
            .setFooter({text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name} • ${currentPage} / ${pages.length}`, iconURL: message.guild.iconURL({dynamic: true})})
        
        // V14 ActionRowBuilder
        const row = new ActionRowBuilder().addComponents([button1, buttonkapat, button2]);
        
        // DeferReply (Interaction bazlı komutlarda gerekli, mesaj bazlı komutlarda opsiyonel ama iyi pratik)
        if (message.deferred == false){
            await message.deferReply().catch(err => {});
        };

        const curPage = await message.reply({
            embeds: [embed.setDescription(`${uye}, üyesinin ilgilenme bilgisi yükleniyor... Lütfen bekleyin...`)],
            components: [row], 
            fetchReply: true,
        }).catch(err => {});
        
        if (!curPage) return; // Mesaj gönderilemediyse dur.

        // Sayfa İçeriği Oluşturma Fonksiyonu
        const updatePageContent = (pageIndex) => {
            return `Geçerli olan ilgilenmeler "${message.guild.emojiGöster(emojiler.Onay)}" olarak görülür, geçersiz olanlar ise "${message.guild.emojiGöster(emojiler.Iptal)}" olarak görültülenir.
            
Geçerli olan: **${geçerliolanlar}**
Geçersiz olan: **${res.Checks.length - geçerliolanlar}**

${pages[pageIndex].map((x, index) => {
    let okey = false
    let targetUye = message.guild.members.cache.get(x.target)
    if(targetUye && (targetUye.user.username.includes(ayarlar.tag) || roller.Yetkiler.some(r => targetUye.roles.cache.has(r)))) okey = true
    // V14 Tarih Formatı: <t:timestamp:R>
    const dateTimestamp = String(x.date).slice(0, 10);
    return `\` ${index+1 + (pageIndex * 15)} \` <@!${targetUye ? targetUye.id : x.target}> <t:${dateTimestamp}:R> [**${x.type}** | ${okey ? message.guild.emojiGöster(emojiler.Onay) : message.guild.emojiGöster(emojiler.Iptal)}] `
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
                embeds: [embed.setFooter({text: `${ayarlar.serverName ? ayarlar.serverName : message.guild.name}`, iconURL: message.guild.iconURL({dynamic: true})}).setDescription(`${uye} isimli üyesinin toplamda \`${res.Checks.length || 0}\` adet tıklama bilgisi mevcut.`)],
                components: [], // Süre bitince butonları kaldır
            }).catch(err => {});
        })
    }
};