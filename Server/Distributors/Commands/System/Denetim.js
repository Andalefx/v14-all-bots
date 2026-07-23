const { 
    Client, 
    Message, 
    ActionRowBuilder, // v14 Builder
    ButtonBuilder, // v14 Builder
    SelectMenuBuilder, // v14 Builder
    ButtonStyle, // v14 ButtonStyle
    AuditLogEvent // v14 AuditLogEvent
} = require("discord.js");

const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "denetim",
    Komut: ["denetim"],
    Kullanim: "denetim",
    Aciklama: "Belirtilen bir rolün üyelerinin seste olup olmadığını ve rol bilgilerini gösterir.",
    Kategori: "kurucu",
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

    // v14: ActionRowBuilder ve ButtonBuilder Kullanımı
    let Row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("denetim-rol")
        .setLabel("Son Silinen Roller")
        .setStyle(ButtonStyle.Secondary) // v14 ButtonStyle
        .setEmoji("943285259733184592"),
        new ButtonBuilder()
        .setCustomId("denetim-kanallar")
        .setLabel("Son Silinen Kanallar")
        .setStyle(ButtonStyle.Secondary) // v14 ButtonStyle
        .setEmoji("943285868368633886"),
    )

    message.reply({components: [Row], content: `Aşağıda **${message.guild.name}** sunucusuna ait denetim kaydında bulunan silinen rolleri ve kanalları listelersiniz.
Düğme ile silinen rolleri veya kanalları tekrardan kurabilirsiniz.`}).then(async (msg) => {
    var filter = (i) => i.user.id == message.author.id;
    let collector = msg.createMessageComponentCollector({filter: filter, time: 60000});
    collector.on('end', (collected, reason) => {
        if(reason == "time"){
            msg.delete().catch(err => {});
        }
    })
    collector.on('collect', async (i) => {
        // İnteraksiyonu 3 saniye içinde yanıtlamak için deferUpdate kullanılır
        await i.deferUpdate().catch(err => {});

        if(i.customId == "denetim-rol") {
            msg.delete().catch(err => { })
            let opt = []
            
            // v14: AuditLogEvent Kullanımı
            const audit = await message.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete }).then(a => a.entries)
            
            // Audit log filtreleme ve mapping aynıdır.
            const denetim = audit.filter(e => Date.now() - e.createdTimestamp < 1000 * 60 * 60)
            .map(e => {
                // Rol adı için e.changes[0].old değerini kullanmak daha güvenli olabilir.
                const roleName = e.changes.find(c => c.key === 'name')?.old || "Bilinmeyen Rol";
                opt.push({label: `${roleName}`, value: e.target.id})
            })

            // v14: ActionRowBuilder ve SelectMenuBuilder Kullanımı
            let RowChannel = new ActionRowBuilder().addComponents(
                new SelectMenuBuilder()
                    .setCustomId(`${i.user.id}+denetim-roller`)
                    .setPlaceholder("Son 1 saat içerisinde silinenler.")
                    .setOptions(
                        opt.length > 0 ? opt : [{label: "Son 1 saat içerisinde silinen roller yok.", value: "0"}]
                    )
            )
            
            // İnteraksiyonu takip mesajı olarak göndermek.
           await message.channel.send({content: `**Merhaba!** ${message.author.tag}
Aşağıda son 1 saat içerisinde silinen rol listesi bulunmaktadır.
Seçilen rol otomatik olarak bot tarafından kurulmaktadır. :tada:`, components: [RowChannel]})
            
            // Yeni kolektör oluşturuluyor.
            var filter = (j) => j.user.id == message.author.id;
            let selectCollector = msg.channel.createMessageComponentCollector({filter: filter, time: 60000, max: 1});
            
            selectCollector.on('collect', async (j) => {
                if(j.customId == `${i.user.id}+denetim-roller`) {
                    if(j.values[0] != "0") {
                        // Rol kurma komutu çağrısı (v14'te aynıdır)
                        let channel = client.commands.find(x => x.Isim == "rolkur")
                        if(channel) channel.onRequest(client, message, [j.values[0]])
                        
                        // İnteraksiyonu güncellemek
                        await j.update({components: [], content: `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla rol kurma komutlarına istek gönderildi.`}).catch(err => {})
                        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
                    } else {
                        await j.reply({content: `Son 1 saat içerisinde silinen bir veri bulunamadı.`, ephemeral: true})
                    }
                }
            })
        }
        if(i.customId == "denetim-kanallar") {
            msg.delete().catch(err => { })
            let opt = []
            
            // v14: AuditLogEvent Kullanımı
            const audit = await message.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete }).then(a => a.entries)
            
            // Audit log filtreleme ve mapping aynıdır.
            const denetim = audit.filter(e => Date.now() - e.createdTimestamp < 1000 * 60 * 60)
            .map(e => {
                const channelName = e.changes.find(c => c.key === 'name')?.old || "Bilinmeyen Kanal";
                opt.push({label: `${channelName}`, value: e.target.id})
            })

            // v14: ActionRowBuilder ve SelectMenuBuilder Kullanımı
            let RowChannel = new ActionRowBuilder().addComponents(
                new SelectMenuBuilder()
                    .setCustomId(`${i.user.id}+denetim-kanallar`)
                    .setPlaceholder("Son 1 saat içerisinde silinenler.")
                    .setOptions(
                        opt.length > 0 ? opt : [{label: "Son 1 saat içerisinde silinen kanallar yok.", value: "0"}]
                    )
            )
            
            // İnteraksiyonu takip mesajı olarak göndermek.
           await message.channel.send({content: `**Merhaba!** ${message.author.tag}
Aşağıda son 1 saat içerisinde silinen kanal listesi bulunmaktadır.
Seçilen kanal otomatik olarak bot tarafından kurulmaktadır. :tada:`, components: [RowChannel]})
            
            // Yeni kolektör oluşturuluyor.
            var filter = (j) => j.user.id == message.author.id;
            let selectCollector = msg.channel.createMessageComponentCollector({filter: filter, time: 60000, max: 1});
            
            selectCollector.on('collect', async (j) => {
                if(j.customId == `${i.user.id}+denetim-kanallar`) {
                    if(j.values[0] != "0") {
                        // Kanal kurma komutları çağrısı (v14'te aynıdır)
                        let channel = client.commands.find(x => x.Isim == "seskur")
                        if(channel) channel.onRequest(client, message, [j.values[0]])
                        let voice = client.commands.find(x => x.Isim == "metinkur")
                        if(voice) voice.onRequest(client, message, [j.values[0]])
                        let category = client.commands.find(x => x.Isim == "kategorikur")
                        if(category) category.onRequest(client, message, [j.values[0]])
                        
                        // İnteraksiyonu güncellemek
                        await j.update({components: [], content: `${message.guild.emojiGöster(emojiler.Onay)} Başarıyla kanal kurma komutlarına istek gönderildi.`}).catch(err => {})
                        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
                    } else {
                        await j.reply({content: `Son 1 saat içerisinde silinen bir veri bulunamadı.`, ephemeral: true})
                    }
                }
            })
        }
    })

})
   }
};