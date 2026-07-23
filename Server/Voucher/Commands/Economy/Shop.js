const { 
    Client, 
    Message, 
    EmbedBuilder, 
    ButtonBuilder, 
    ActionRowBuilder, 
    AttachmentBuilder, 
    StringSelectMenuBuilder, 
    ButtonStyle, 
    ComponentType,
} = require("discord.js");
let Shops = require('../../../../Global/Databases/Economy.Shop.Items');
const Canvas = require('canvas')
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const path = require("path")

// NOT: 'ayarlar', 'roller', 'emojiler', 'sistem' ve 'tarihsel' gibi global değişkenlerin 
// kodun diğer yerlerinde erişilebilir (tanımlı) olduğu varsayılmıştır.

// Canvas Fontlarını Tanımlama
const ASSETS_PATH = path.resolve(__dirname, '..', '..', 'Assets'); 

Canvas.registerFont(
    path.join(ASSETS_PATH, 'theboldfont.ttf'), 
    { family: "Bold" }
);

Canvas.registerFont(
    path.join(ASSETS_PATH, 'SketchMatch.ttf'), 
    { family: "SketchMatch" }
);

Canvas.registerFont(
    path.join(ASSETS_PATH, 'LuckiestGuy-Regular.ttf'), 
    { family: "luckiest guy" }
);

Canvas.registerFont(
    path.join(ASSETS_PATH, 'KeepCalm-Medium.ttf'), 
    { family: "KeepCalm" }
);

// Yardımcı fonksiyonun tanımı (Dışarıda tanımlı değilse buraya eklenmeli)
function applyText(canvas, text, defaultFontSize, width, font){
    const ctx = canvas.getContext("2d");
    do {
        ctx.font = `${(defaultFontSize -= 1)}px ${font}`;
    } while (ctx.measureText(text).width > width);
    return ctx.font;
}


module.exports = {
    Isim: "mağaza",
    Komut: ["shop","mağza","market","coinmarket"],
    Kullanim: "mağaza [ekle/sil/güncelle] <ürünİsmi> <coin> <gold> <emoji/yok> <açıklama/rol>",
    Aciklama: "Sunucu Mağazasını görüntüler veya yönetir.",
    Kategori: "eco",
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
        
        let embed = new genEmbed() 

        let staffID = "1427179650496335882" // Sizin manuel ID'niz
        const serverName = (typeof ayarlar !== 'undefined' && ayarlar.serverName) ? ayarlar.serverName : 'SUNUCU';

        // HATA KONTROLÜ İYİLEŞTİRİLDİ: Global değişken 'roller' ve 'ayarlar' kontrol edildi.
        const isStaff = message.member.id == staffID || (typeof roller !== 'undefined' && roller.kurucuRolleri && roller.kurucuRolleri.some(x => message.member.roles.cache.has(x)))
        
        const sendAdminReply = async (content, reactEmoji = (typeof emojiler !== 'undefined' ? emojiler.Iptal : '❌')) => {
            const x = await message.reply({ content: content });
            setTimeout(() => {
                x.delete().catch(err => { });
            }, 7500);
            // Emoji Kontrolü GÜÇLENDİRİLDİ
            message.react(message.guild.emojiGöster(reactEmoji) ? message.guild.emojiGöster(reactEmoji).id : '❌').catch(err_1 => { }); 
        };

        if(isStaff) {
            if(args[0] == "sil") {
                if(!args[1]) return sendAdminReply("Ürün ismi girmediğin için iptal edildi.");
                let ürünBul = await Shops.findOne({name: args[1]})
                if(!ürünBul) return sendAdminReply("Ürün bulunamadığından iptal edildi.");
                
                await Shops.deleteOne({name: args[1]}) 
                message.react(message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Onay : '✅')) ? message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Onay : '✅')).id : '✅').catch(err => {})
                return;
            }
            if(args[0] == "ekle" || args[0] == "güncelle") {
                let isim = args[1]
                if(!isim) return sendAdminReply("Lütfen bir ürün ismi giriniz.");
                let coin = args[2] ? Number(args[2]) : 0; 
                if(isNaN(coin)) return sendAdminReply(`Lütfen ${serverName.toLowerCase()} parası (rakam) belirleyin.`);
                let gold = args[3] ? Number(args[3]) : 0; 
                if(isNaN(gold)) return sendAdminReply(`Lütfen altın (rakam) belirleyin.`);
                let emoji = args[4]
                if(!emoji) return sendAdminReply(`Lütfen bir emoji belirleyin belirlemek istemiyorsanız **yok** yazın.`);
                let desc = args.splice(5).join(" ");
                if(!desc) return sendAdminReply(`Lütfen bir açıklama veya rol mentionu girin.`);
                
                let role = message.mentions.roles.first()
                if(role) {
                    await Shops.updateOne({name: isim}, {desc: desc, emoji: emoji, gold: gold, coin: coin, role: true, roleID: role.id}, {upsert: true})
                } else {
                    await Shops.updateOne({name: isim}, {desc: desc, emoji: emoji, gold: gold, coin: coin, role: false, roleID: null}, {upsert: true})
                }
                message.react(message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Onay : '✅')) ? message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Onay : '✅')).id : '✅').catch(err => {})
                return;
            }
        } 
        
        // --- MAĞAZA MENÜSÜ GÖSTERİMİ ---
        
        let para = await client.Economy.viewBalance(message.member.id, 1)
        let altın = await client.Economy.viewBalance(message.member.id, 0)
        let arrayItems = [];
        const guild = message.guild;

        // --- Canvas Oluşturma ---
        let canvas = Canvas.createCanvas(1080, 300);
        let ctx = canvas.getContext("2d");
        
        // Canvas kodları 
        ctx.beginPath();
        ctx.moveTo(0 + Number(30), 0);
        ctx.lineTo(0 + 1080 - Number(30), 0);
        ctx.quadraticCurveTo(0 + 1080, 0, 0 + 1080, 0 + Number(30));
        ctx.lineTo(0 + 1080, 0 + 300 - Number(30));
        ctx.quadraticCurveTo(0 + 1080, 0 + 300, 0 + 1080 - Number(30), 0 + 300);
        ctx.lineTo(0 + Number(30), 0 + 300);
        ctx.quadraticCurveTo(0, 0 + 300, 0, 0 + 300 - Number(30));
        ctx.lineTo(0, 0 + Number(30));
        ctx.quadraticCurveTo(0, 0, 0 + Number(30), 0);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 1080, 300);
        
        // Banner'ı yükle
        let bannerURL = guild.banner 
            ? guild.bannerURL({ extension: "png", size: 4096 }) 
            : "https://cdn.discordapp.com/attachments/946751524028162118/947678638315298866/open-the-door-android-iphone-desktop-hd-backgrounds-wallpapers-1080p-4khd-wallpapers-desktop-background-android-iphone-1080p-4k-pqrfj.png";
            
        let background = await Canvas.loadImage(bannerURL);
        ctx.drawImage(background, 0, 0, 1080, 300);
        ctx.fillStyle = "#000000";
        ctx.globalAlpha = 0.5;
        ctx.fillRect(50, 30, 980, 250);
        ctx.globalAlpha = 1;

        // Başlık çizimi
        ctx.font = "140px Bold";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.strokeText(`URUN LISTESI`, 110, canvas.height - 100);
        ctx.fillStyle = "#e7d02e";
        ctx.fillText(`URUN LISTESI`, 110, canvas.height - 100);
        
        // --- Ürünleri Veritabanından Çekip Select Menu Option'ı Hazırlama ---
        
        let ürünlercik = await Shops.find()

        ürünlercik.forEach(data => {
            const coinText = data.coin > 0 ? `${data.coin.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} ${serverName} Parası${data.gold > 0? " ve" : ""}` : ``
            const goldText = data.gold > 0 ? `${data.gold} Altın` : ``
            const priceText = (data.gold <= 0 && data.coin <= 0) ? `Ücretsiz Ürün` : coinText + goldText;
            
            const roleName = data.role && message.guild.roles.cache.get(data.roleID) ? message.guild.roles.cache.get(data.roleID).name : data.desc;
            const descriptionText = `${data.role ? `Rol: ${roleName}` : data.desc}`.substring(0, 50); 
            
            // Emoji Kontrolü
            const customEmoji = message.guild.emojiGöster(data.emoji);
            
            arrayItems.push({
                label: `${data.name}`, 
                description: `${priceText} | ${descriptionText}`,
                value: data.name,
                emoji: customEmoji ? { id: customEmoji.id, name: customEmoji.name } : { name: data.emoji }, 
            })
        })

        let ürünlistesiii = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`ürüncükal`)
                .setPlaceholder('Ürünlerimizi listelemek için tıklayın.')
                .setMaxValues(1)
                .setMinValues(1)
                .addOptions(
                    arrayItems.length > 0 ? arrayItems : [{label: "Kapalı Mağaza", description: "Mağazamızda ürün bulunmamaktadır!", value: "kapali_magaza"}]
                ),
        )

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'acar_economy.png' });


        // --- Ana Mağaza Mesajını Gönderme ve Etkileşimi Başlatma ---
        let msg = await message.channel.send({
            content: `:tada: **${serverName} Mağazasına Hoşgeldiniz!** ${arrayItems.length > 0 ? "Aşağıda listelenmekte olan ürünlerimizden, almak istediğiniz ürünü seçebilirsiniz." : "Şuan da ürün bulunamadığından mağazamız kapalıdır!"}`,
            components: [ürünlistesiii], 
            files: [attachment]
        }).catch(err => {
             console.error("Mağaza mesajı gönderilirken hata oluştu:", err);
        }); 

        if (!msg) return; 

        const filter = i => i.user.id == message.member.id 
        
        const collector = msg.createMessageComponentCollector({ 
            filter,  
            time: 30000 
        })

        collector.on("end", c => {
            msg.delete().catch(err => {})
        })
        
        collector.on('collect', async i => { 
            if(i.customId == "ürüncükal") { 
                await i.deferUpdate().catch(err => {}); 

                let ürünIsmi = i.values[0];
                if(ürünIsmi === "kapali_magaza") return; 
                
                let ürünBilgisi = await Shops.findOne({name: ürünIsmi})
                if(!ürünBilgisi) return i.followUp({content: `${message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Iptal : '❌')) || '❌'} **Başarısız!** Böyle bir ürün bulunamadı.`, ephemeral: true});
                
                let isim = ürünBilgisi.name
                let tip = ürünBilgisi.type
                let coin = ürünBilgisi.coin
                let gold = ürünBilgisi.gold
                let emoji = ürünBilgisi.emoji 
                let uye = message.guild.members.cache.get(i.user.id)
                
                // Bakiye Kontrolü
                if(coin > 0 && para < coin) return i.followUp({content: `${message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Iptal : '❌')) || '❌'} **Başarısız!** Gereken ${coin.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} ${serverName} Parası bulunamadığından satın alamazsın!`, ephemeral: true});
                if(gold > 0 && altın < gold) return i.followUp({content: `${message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Iptal : '❌')) || '❌'} **Başarısız!** Gereken ${gold} Altın bulunamadığından satın alamazsın!`, ephemeral: true});
                
                // Envanter Kontrolü
                let dattaaa = await Users.findOne({_id: uye.id})
                if(dattaaa && dattaaa.Inventory) {
                    let ürünlerrrrr = dattaaa.Inventory.map(x => x.Name)
                    if(ürünlerrrrr.includes(isim)) {
                        msg.delete().catch(err => {});
                        message.react(message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Iptal : '❌')) ? message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Iptal : '❌')).id : '❌').catch(err => {});
                        return i.followUp({content: `${message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Iptal : '❌')) || '❌'} **Başarısız!** \`${isim}\` isimli ürün envanterinde bulunduğundan dolayı tekrardan satın alamazsın.`, ephemeral: true});
                    }
                }
                
                // --- Satın Alma İşlemleri ---
                if(coin > 0) {
                    await client.Economy.updateBalance(uye.id, coin, "remove", 1)
                } 
                if(gold > 0) {
                    await client.Economy.updateBalance(uye.id, gold, "remove", 0)
                }
                
                // Rol Verme
                if(ürünBilgisi.role) {
                    if(ürünBilgisi.roleID && !uye.roles.cache.has(ürünBilgisi.roleID)){
                         uye.roles.add(ürünBilgisi.roleID).catch(err => {
                             console.error(`Üründen rol eklenirken hata oluştu: ${err.message}`)
                         })
                    }
                } 
                
                // Envantere Ekleme
                let alınanÜrün = {
                    Name: isim,
                    Coin: coin,
                    Type: tip,
                    Gold: gold,
                    Tarih: Date.now()
                }
                if(tip == "badge") Users.updateOne({_id: uye.id}, {$push: { "Badges": {Name: isim, Emoji: emoji}}}, {upsert: true}).catch(err => {})
                await Users.updateOne({_id: uye.id}, {$push: { "Inventory": alınanÜrün}}, {upsert: true}).catch(err => {})
                
                // Log ve Başarı Mesajları
                msg.delete().catch(err => {})
                
                let kanalBul = message.guild.channels.cache.get("magaza-log") || message.guild.kanalBul("magaza-log")
                if(kanalBul) kanalBul.send({embeds: [new genEmbed()
                    .setDescription(`:tada: ${message.member} isimli üye tarafından **${alınanÜrün.Name}** isimli ürün \`${typeof tarihsel !== 'undefined' ? tarihsel(Date.now()) : new Date().toLocaleString("tr-TR")}\` tarihinde satın alındı.`) // tarihsel kontrolü eklendi
                    .setFooter({text: "alınan ürün envanter bilgisine girildi ve kayıtlara tutuldu."})
                ]}).catch(err => {})
                
                i.followUp({embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Onay : '✅')) || '✅'} Başarıyla **${isim}** isimli ürünü <t:${Math.floor(Date.now() / 1000)}:R> satın aldınız.`).setFooter({text: "ürün hakkında sorular için sunucu sahibine başvurun."})], ephemeral: true})
                message.react(message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Onay : '✅')) ? message.guild.emojiGöster((typeof emojiler !== 'undefined' ? emojiler.Onay : '✅')).id : '✅').catch(err => {})
            }

        })
    }
};