const { Client, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, SelectMenuBuilder, ButtonStyle, Collection } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
const Custom = require('../../../../Global/Databases/Custom.List.Menu')

// NOT: Kodunuzda kullanılan ancak tanımlanmamış bazı değişkenler için varsayılan değerler eklendi.
let sistem = global.sistem || { SERVER: { ID: "SERVER_ID" }, botSettings: { Prefixs: ["!"] } }; 
let ayarlar = global.ayarlar || { serverName: "Sunucu Adı" };
let emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' };
const tarihsel = (date) => date; // tarihsel fonksiyonunun yerine geçici bir fonksiyon

module.exports = {
    Isim: "menü",
    Komut: ["menü-oluştur","menu","menu-olustur"],
    Kullanim: "etkinlik",
    Aciklama: "Belirlenen yetkilinin sunucu içerisinde ki bilgileri gösterir ve yükseltir düşürür.",
    Kategori: "kurucu",
    Extend: true,
    
   /**
   * @param {Client} client 
   */

  onLoad: async function (client) {
            client.on("interactionCreate", async (interaction) => { 
                if (!interaction.isSelectMenu()) return; // V14'te SelectMenu'lar SelectMenuInteraction olarak gelir.

                let Database = await Custom.find({})
                if(Database && Database.length >= 1) {
                  for (let index = 0; index < Database.length; index++) {
                            let menu = interaction.customId
                            // V14: client.guilds.cache.get(id).members.fetch(userId) yerine interaction.guild.members.cache.get(userId) daha güvenli.
                            const guild = client.guilds.cache.get(sistem.SERVER.ID)
                            if (!guild) return;

                            const member = await guild.members.fetch(interaction.member.user.id).catch(err => {})
                            if (!member) return;

                            let Data = Database[index]
                        if(Data.Secret == menu) {
                            let check = await Custom.findOne({Secret: menu})
                            if(!check)  interaction.reply({ content: "Bu menü sistemden kaldırıldığı için kullanılamıyor.", ephemeral: true });

                            let customMap = new Collection()
                            Data.Roles.forEach(r => customMap.set(r, r))
                            let roles = Data.Roles
                            var role = []

                            for (let index = 0; index < interaction.values.length; index++) {
                                let ids = interaction.values[index]
                                let den = customMap.get(ids)
                                role.push(den)
                            }

                            if (interaction.values[0] === "rolsil") {
                                await member.roles.remove(roles).catch(err => {})
                                interaction.reply({ content: "Rolleriniz başarıyla silindi.", ephemeral: true })
                            } else {
                                // V14: member.permissions.has("ADMINISTRATOR") kullanmak doğru
                                if(check.Access && check.Access.length > 0 && !check.Access.some(r => member.roles.cache.has(r)) && !member.permissions.has("Administrator") && !member.permissions.has("ManageRoles")) return  interaction.reply({ content: `Üzerinizde ${check.Access.filter(x => member.guild.roles.cache.has(x)).map(x => member.guild.roles.cache.get(x)).join(", ")} rol(ler) bulunmadığından bu seçeneği seçemezsiniz.`, ephemeral: true })
                                
                                // Select menüde multi-select (çoklu seçim) kapalıysa, values dizisinin boş gelme ihtimali olmaz. 
                                // Ancak burada bir temizleme/ekleme mantığı var.
                                await member.roles.remove(roles).catch(err => {})
                                await member.roles.add(role).catch(err => {})
                                
                                interaction.reply({ content: "Rolleriniz güncellendi.", ephemeral: true })
                            }
                        }
                    }
                }
            })
  },

   /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */

  onRequest: async function (client, message, args) {
    let Data = await Custom.find({})
    let comp;

    // V14: ActionRowBuilder ve ButtonBuilder kullanımı
    let defa = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("ekle")
        .setLabel("Ekleme & Düzenleme")
        .setEmoji("841029419573444618")
        .setStyle(ButtonStyle.Success) // V14: String yerine ButtonStyle enum'ı
    )

    if(Data && Data.length >= 1) {
        
        let listele = []
        Data.forEach(async (x) => {
            listele.push({label: x.Name, description: `${tarihsel(x.Date)} ${message.guild.members.cache.get(x.Author) ? `- ${message.guild.members.cache.get(x.Author).user.tag}` : ""}`, value: x.Name})
        })

        // V14: ActionRowBuilder ve SelectMenuBuilder kullanımı
        comp = [defa, new ActionRowBuilder().addComponents(
            new SelectMenuBuilder()
            .setCustomId("sil")
            .setPlaceholder("Aşağıdan silmek istediğiniz menüyü seçin!")
            .addOptions(listele) // V14: addOptions kullanımı
        ), new ActionRowBuilder().addComponents(
            new SelectMenuBuilder()
            .setCustomId("kur")
            .setPlaceholder("Aşağıdan oluşturmak istediğiniz menüyü seçin!")
            .addOptions(listele) // V14: addOptions kullanımı
        )]
    } else {
        comp = [defa]
    }

    message.channel.send({embeds: [new genEmbed().setDescription(`**Merhaba!** ${message.member.user.tag} (${message.member}),
${ayarlar.serverName ? ayarlar.serverName : message.guild.name} sunucusuna ait olan rol seçim menüsü listesi aşağıda mevcut ekleme, düzenleme ve kaldırma işlemini buradan yapabilirsiniz. :tada: :tada: :tada: 

**Kullanım Koşulları!**
\` ❯ \` Sunucuda bir rol seçim menüsü oluşturmak istiyorsan aşağıda ki düğme yardımıyla ekleyebilirsin.
\` ❯ \` Ekleme işlemleri bittikten sonra anlık olarak kurulum işlemini tekrar bu panel üzerinden yapabilirsin.
\` ❯ \` Düzenleme işlemi yaparken tekrardan aşağıda ki düğmeye basarak, düzenlenmesini istediğiniz rol seçim menüsü ismini girerek tekrardan ayarlarını güncelleyebilirsiniz.`)], components: comp}).then(async (msg) => {
                    // V14: `createMessageComponentCollector` aynı isimle var.
                    const filter = i => i.user.id == message.member.id 
                    const collector = msg.createMessageComponentCollector({ filter: filter,  errors: ["time"], time: 120000 })
                    collector.on("collect", async (i) => {
                        if(i.customId == "sil") {
                            if (!i.isSelectMenu()) return i.deferUpdate().catch(err => {}); // Select menü kontrolü
                            await Custom.deleteOne({Name: i.values[0]}) // Select menü tek değer döndürse bile values bir dizidir.
                            i.reply({content: `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla **${i.values[0]}** isimli rol seçim menüsü silindi.`, ephemeral: true})
                            msg.delete().catch(err => {})
                            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined)
                        }
                        if(i.customId == "kur") {
                            if (!i.isSelectMenu()) return i.deferUpdate().catch(err => {}); // Select menü kontrolü
                            let kurulcak = await Custom.findOne({Name: i.values[0]}) // Select menü tek değer döndürse bile values bir dizidir.
                            if(kurulcak) {
                                let Opt = []
                                kurulcak.Roles.forEach(r => {
                                    Opt.push({label: message.guild.roles.cache.get(r) ? message.guild.roles.cache.get(r).name : "@Rol Bulunamadı!",
                                    emoji: { "id": "943285259733184592"},
                                value: r})
                                })
                                // V14: ActionRowBuilder ve SelectMenuBuilder kullanımı
                                let listMenu = new ActionRowBuilder().addComponents(
                                    new SelectMenuBuilder()
                                    .setCustomId(kurulcak.Secret)
                                    .setPlaceholder(`${kurulcak.Name}`)
                                    // V14: addOptions kullanımı, Opt dizisi ve sabit seçenek birleştirildi.
                                    .addOptions(
                                        ...Opt, 
                                        {"label": "Rol İstemiyorum", "value": "rolsil", "emoji": { "id": "922058306263072860", "name": "monarch_trash" }}
                                    )
                                )
                                message.channel.send({content: `${kurulcak.Text}`, components: [listMenu]})
                                i.reply({content: `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla **${kurulcak.Name}** isimli rol seçim menüsü kuruldu.`, ephemeral: true})
                                msg.delete().catch(err => {})
                                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined)
                            }
                        }
                        if(i.customId == "ekle") {
                            if (!i.isButton()) return i.deferUpdate().catch(err => {}); // Buton kontrolü
                            msg.delete().catch(err => {})
                            message.channel.send({content: `:tada: **${ayarlar.serverName ? ayarlar.serverName : message.guild.name}**
Yeni bir rol seçim menüsü oluşturuluyor...`, embeds: [new genEmbed().setDescription(`
Rol Seçim Menüsü: \` Ayarlanmadı! \`
Açıklama: \` Ayarlanmadı! \`
Roller: \` Ayarlanmadı! \`

Yeni oluşturulmakta olan rol seçim menünüze bir isim belirleyin.`)]}).then(async (isimbelirleme) => {
    let rolSeçim = {
        Name: String,
        Roles: Array,
        Text: String,
        Date: Date.now(),
        Secret: secretOluştur(10),
        Author: message.member.id,
    }
    var filt = m => m.author.id == message.member.id
    let collector = isimbelirleme.channel.createMessageCollector({filter: filt, time: 60000, max: 1, errors: ["time"]})
    collector.on("collect", async (m) => {
        let mesaj = m.content
        if(mesaj == "iptal" || mesaj == "ıptal") {
            return isimbelirleme.edit({content: null, embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Iptal)} Başarıyla rol seçim menü oluşturma aracı iptal edildi.`)]}).then(x => {
                setTimeout(() => {
                    isimbelirleme.delete().catch(err => {})
                }, 15000);
            })
        }
        rolSeçim.Name = mesaj
        m.delete().catch(err => {})
        isimbelirleme.edit({content: `:tada: **${ayarlar.serverName ? ayarlar.serverName : message.guild.name}**
Yeni bir rol seçim menüsü oluşturuluyor...`, embeds: [new genEmbed().setDescription(`
Rol Seçim Menüsü: \`${rolSeçim.Name}\`
Açıklama: \` Ayarlanmadı! \`
Roller: \` Ayarlanmadı! \`

Yeni oluşturulmakta olan rol seçim menünüze bir açıklama belirtin. Örn: \`Aşağıda ki rollerden istediğiniz rolü alabilirsiniz!\``)]})
.then(async (açıklamabelirleme) => {
    var filt = m => m.author.id == message.member.id
    let collector = açıklamabelirleme.channel.createMessageCollector({filter: filt, time: 60000, max: 1, errors: ["time"]})
    collector.on("collect", async (m) => {
        let mesaj = m.content
        if(mesaj == "iptal" || mesaj == "ıptal") {
            return açıklamabelirleme.edit({content: null, embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Iptal)} Başarıyla rol seçim menü oluşturma aracı iptal edildi.`)]}).then(x => {
                setTimeout(() => {
                    açıklamabelirleme.delete().catch(err => {})
                }, 15000);
            })
        }
        rolSeçim.Text = m.content
        m.delete().catch(err => {})
        açıklamabelirleme.edit({content: `:tada: **${ayarlar.serverName ? ayarlar.serverName : message.guild.name}**
Yeni bir rol seçim menüsü oluşturuluyor...`, embeds: [new genEmbed().setDescription(`
Rol Seçim Menüsü: \`${rolSeçim.Name}\`
Açıklama: \`${rolSeçim.Text}\`
Roller: \` Ayarlanmadı! \`

Yeni oluşturulmakta olan rol seçim menünüzde listelenecek rolleri belirtin.`).setFooter({text: `En az 3 tane, en fazla 25 tane rol ekleyebilirsiniz.`})]})
.then(async (rolbelirleme) => {
    var filt = m => m.author.id == message.member.id
    let collector = rolbelirleme.channel.createMessageCollector({filter: filt, time: 60000, max: 1, errors: ["time"]})
    collector.on("collect", async (m) => {
        let mesaj = m.content
        if(mesaj == "iptal" || mesaj == "ıptal") {
           return rolbelirleme.edit({content: null, embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Iptal)} Başarıyla rol seçim menü oluşturma aracı iptal edildi.`)]}).then(x => {
                setTimeout(() => {
                    rolbelirleme.delete().catch(err => {})
                }, 15000);
            })
        }
        m.delete().catch(err => {})
        rolbelirleme.delete().catch(err => {})
        let rolPushing = []
        if(m.mentions.roles.size >= 1) {
          rolPushing = m.mentions.roles.map(role => role.id)
        } else {
          let argss = m.content.split(" ");
          argss = argss.splice(0)
          let rolVerAbime = argss.filter(role => message.guild.roles.cache.some(role2 => role == role2.id))
          rolPushing.push(...rolVerAbime)
        }
        rolSeçim.Roles = rolPushing
        message.channel.send({embeds: [new genEmbed().setDescription(`
Rol Seçim Menüsü: \`${rolSeçim.Name}\`
Açıklama: \`${rolSeçim.Text}\`
Roller: ${rolSeçim.Roles.map(x => message.guild.roles.cache.get(x)).join(", ")}

${message.guild.emojiGöster(emojiler.Onay)} Başarıyla **${rolSeçim.Name}** isimli rol seçim menüsü \`${tarihsel(Date.now())}\` tarihinde oluşturuldu.`)]}).then(async (oluşturuldu) => {
    message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
    let secretKodu = secretOluştur(10)
    await Custom.updateOne({Name: rolSeçim.Name}, { $set: { "Text": rolSeçim.Text, "Roles": rolSeçim.Roles, "Date": Date.now(), Secret: secretKodu, "Author": message.member.id,  }}, {upsert: true})
    
})
    })
})
    })
})
        isimbelirleme.delete().catch(err => {})


    })

})

                        }
                    })

    })
  
    }
};



function secretOluştur(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }