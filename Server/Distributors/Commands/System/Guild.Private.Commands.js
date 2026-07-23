const { 
    Client, 
    Message, 
    EmbedBuilder, // v14 EmbedBuilder
    ActionRowBuilder, // v14 ActionRowBuilder
    ButtonBuilder, // v14 ButtonBuilder
    ButtonStyle, // v14 ButtonStyle
    SelectMenuBuilder, // v14 SelectMenuBuilder
    ModalBuilder, // v14 ModalBuilder
    TextInputBuilder, // v14 TextInputBuilder
    TextInputStyle // v14 TextInputStyle
} = require("discord.js");

// Orijinal kodunuzda kullanılan 'discord-modals' kütüphanesini ve onunla ilgili fonksiyonları
// Discord.js v14'ün yerleşik Modal ve Component Builder'ları ile değiştirmemiz gerekiyor.
// Eğer 'discord-modals' kütüphanesi v14 ile uyumlu bir güncelleme yayınladıysa, 
// sadece importları güncelleyip Modal'ı kullanmaya devam edebilirsiniz.
// Ancak bu çözümde, Discord.js'in yerleşik Modal yapısı kullanılmıştır.

const { genEmbed } = require("../../../../Global/İnit/Embed");



const mongoose = require('mongoose');

// Discord.js v14'ün kendi Modal bileşenlerini kullanıyoruz.
// Orijinal kodda kullanılan dcmodal = require('discord-modals') kaldırıldı.


let PrivateCommand = require('../../../../Global/Databases/Client.Guilds.Private.Commands');

module.exports = {
    Isim: "private-commands",
    Komut: ["pc","pcmd", "private-commands","private-command","privatecommand","privatecommands"],
    Kullanim: "pc @andale/ID",
    Aciklama: "Sunucudaki üyeler içerisinde tagı olmayanları kayıtsıza at.",
    Kategori: "-",
    Extend: false,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) { 

    // CLIENT ON MESSAGE CREATE EVENT
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.channel || message.channel.type == "dm") return;
        let prefixKontrol = global.sistem.botSettings.Prefixs.find(p => message.content.startsWith(p));
        
        let komutcuklar;
        let args;
        
        if (prefixKontrol) {
            args = message.content.substring(prefixKontrol.length).trim().split(" ");
            komutcuklar = args[0].toLocaleLowerCase();
            args = args.slice(1);
        } else {
            // No prefix komutlarını kontrol et
            komutcuklar = message.content.split(" ")[0].toLowerCase();
            args = message.content.split(" ").slice(1);
        }

        let command = await PrivateCommand.findOne({
            name: komutcuklar,
            prefix: prefixKontrol ? true : false
        });

        if(command) {
              if(command.prefix && (kanallar.izinliKanallar && !kanallar.izinliKanallar.some(x => message.channel.id == x)) && !message.member.permissions.has("Administrator") && !ayarlar.staff.includes(message.member.id) && !["temizle","sil","booster","b","snipe","afk","kilit"].some(x => komutcuklar == x) ) {
                return message.reply(`${cevaplar.prefix} Belirtilen komut bu kanalda kullanıma izin verilemiyor, lütfen ${message.guild.channels.cache.get(kanallar.izinliKanallar[0])} kanalında tekrar deneyin.`).then(x=> setTimeout(() => {
                      x.delete().catch(err => {})
                      message.delete().catch(err => {})
                }, 10000));
            }
              if(command.allowed.length > 0 && !command.allowed.some(x =>  message.author.id == x || (message.member.roles.cache.has(x) && message.member.permissions.has(x)))) {
                let allow_arr = []
                command.allowed.map(x => {

                      let role = message.guild.roles.cache.get(x);
                      if(role) return allow_arr.push(`<@&${x}>`);
  
                      let user = message.guild.members.cache.get(x);
                      if(user) return allow_arr.push(`<@${x}>`);

                      let yetkiler = [
                            "ADMINISTRATOR",
                            "MANAGE_GUILD",
                            "MANAGE_CHANNELS",
                            "MANAGE_MESSAGES",
                            "MANAGE_NICKNAMES",
                            "MANAGE_ROLES",
                            "MANAGE_WEBHOOKS",
                            "MANAGE_EMOJIS",
                            "KICK_MEMBERS",
                            "BAN_MEMBERS",
                            "CREATE_INSTANT_INVITE",
                      ]
                      if(yetkiler.includes(x)) return allow_arr.push(`**${x.replace("ADMINISTRATOR", "Yönetici")
                          .replace("MANAGE_GUILD", "Sunucu Yönet")
                          .replace("MANAGE_CHANNELS", "Kanal Yönet")
                          .replace("MANAGE_ROLES", "Rol Yönet")
                          .replace("MANAGE_NICKNAMES", "Nick Yönet")
                          .replace("MANAGE_EMOJIS", "Emoji Yönet")
                          .replace("MANAGE_WEBHOOKS", "Webhook Yönet")
                          .replace("MANAGE_MESSAGES", "Mesaj Yönet")
                          .replace("MANAGE_MESSAGE_DELETE", "Mesaj Silme Yönet")}**`)

                })
                return message.reply({embeds: [
                      new genEmbed().setDescription(`Bu komutu kullanmak için yeterli yetkiye sahip değilsin. ${allow_arr.length > 0 ? `${allow_arr.listRoles()} yetkilerine veya kişisi olmalısın.`: ``} ${message.guild.emojiGöster(emojiler.Iptal)}`).setColor("Red") // v14 Embed Renkleri "RED" yerine "Red"
                ]}).then(x => {
                      setTimeout(() => {
                        x.delete().catch(err => {})
                      }, 10000);
                });
            }
            // v14: MessageEmbed yerine EmbedBuilder kullanımı (genEmbed'in ne döndürdüğüne bağlı, ama genel kural bu)
            if(command.type == "EMBED") return message.channel.send({embeds: [new genEmbed().setDescription(`${command.content}`)]}).then(x => { 
                setTimeout(() => {
                      x.delete().catch(err => {})
                }, 30000);
            });
            if(command.type == "MESSAGE") return message.channel.send({content: `${command.content}`}).then(x => {
                setTimeout(() => {
                      x.delete().catch(err => {})
                }, 30000);
            });
            if(command.type == "CODE") return eval(command.content.replace(new RegExp(client.token, "g"), ""));
        }

    })

    // CLIENT ON INTERACTION CREATE (MODAL SUBMIT) EVENT
    client.on('interactionCreate', async (modal) => {
        if (!modal.isModalSubmit()) return;

        let guild = client.guilds.cache.get(modal.guildId);

        if(!guild) {
            await modal.deferReply({ ephemeral: true })
            return await modal.followUp({content: `Sistemsel olarak bir hata oluştur` , ephemeral: true })
        }
        let uye = guild.members.cache.get(modal.user.id)
        if(!uye){
            await modal.deferReply({ ephemeral: true })
            return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
        }
      
        if(modal.customId == "pcmd_remove") {
            // v14: getTextInputValue ile modal verilerine ulaşılır.
          let cmdName = modal.fields.getTextInputValue('pcmd_name'); 
          let command = await PrivateCommand.findOne({name: cmdName}) 
          if(!command) {
            await modal.deferReply({ ephemeral: true })
            return await modal.followUp({content: `Böyle bir özelleştirilmiş komut bulunamadı. ${guild.emojiGöster(emojiler.Iptal)}` , ephemeral: true })
          }
          await PrivateCommand.deleteOne({name: cmdName})
          await modal.deferReply({ ephemeral: true })
          await modal.followUp({content: `Başarıyla **${cmdName}** isimli özelleştirilmiş komut silindi. ${guild.emojiGöster(emojiler.Onay)}` , ephemeral: true })
        }
        
        if(modal.customId == "pcmd_add") {

          // v14: getTextInputValue ile modal verilerine ulaşılır.
          let cmdName = modal.fields.getTextInputValue('pcmd_name');
          let cmdType = modal.fields.getTextInputValue("pcmd_type");     
          let cmdContent = modal.fields.getTextInputValue('pcmd_content');
          let cmdAllowed = modal.fields.getTextInputValue('pcmd_allowed');
          let cmdPrefix = modal.fields.getTextInputValue('pcmd_prefix') || false;
          
          cmdType = cmdType.toUpperCase();
          let isPrefix = cmdPrefix.toLowerCase() == "olsun" ? true : false;
        
          // V14 Uyumlu kod oluşturma
          await PrivateCommand.updateOne({name: cmdName}, {
            $set: { 
              name: cmdName,
              type: cmdType,
              prefix: isPrefix,
              content: cmdContent
              // CODE komutları için v14 terimlerini v13 terimlerine çeviren kod kaldırıldı 
              // ve tam tersi yapıldı. V13 terimlerini V14 terimlerine çeviriyor olmalısınız.
              // Ancak burada veritabanına kayıt yapılan kısımda v13 terimleri v14'e çevrilmişti.
              // En doğru yaklaşım, botun v14 ile çalıştığını varsayarak kullanıcının
              // doğrudan v14 kodunu girmesini istemektir. Orijinaldeki çeviri mantığı
              // kafa karıştırıcı olduğu için, sadece komutun içeriğini kaydetmek en güvenlisidir.
              // **Orijinal kodunuzun ters çevirme mantığı korundu**:
              .replace("MessageButton","ButtonBuilder") // ButtonBuilder
              .replace("SECONDARY", "Secondary") 
              .replace("SUCCESS", "Success") 
              .replace("DANGER","Danger") 
              .replace("PRIMARY", "Primary") 
              .replace("MessageEmbed", "EmbedBuilder") // EmbedBuilder
              .replace("MessageActionRow","ActionRowBuilder") // ActionRowBuilder
              .replace("MessageSelectMenu","SelectMenuBuilder") // SelectMenuBuilder
              .replace("TextInputComponent", "TextInputBuilder"), // TextInputBuilder
              allowed: cmdAllowed && cmdAllowed.length > 0 ? cmdAllowed.split(' ') : [],
              created: uye.id, 
            }
          }, {upsert: true});

          await modal.deferReply({ ephemeral: true })
          return await modal.followUp({content: `${guild.emojiGöster(emojiler.Onay)} Başarıyla ${cmdName} (**${cmdType}**) komutu başarıyla <t:${String(Date.now()).slice(0, 10)}:R> eklendi.` , ephemeral: true })

        }
    })
  },

   /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */

  onRequest: async function (client, message, args) {
    
      // v14: ButtonBuilder ve ButtonStyle kullanımı
      let Buttons = [
        new ButtonBuilder()
          .setCustomId("add_pcmd")
          .setLabel("Ekle/Güncelle")
          .setStyle(ButtonStyle.Secondary), // v14 ButtonStyle
      ]

      let msg = await message.reply({
        content: `Özelleştirilmiş komut sistemi yükleniyor...`
      })
      let Commands = await PrivateCommand.find({})
      if(Commands && Commands.length > 0) Buttons.push(
        new ButtonBuilder()
          .setCustomId("delete_pcmd")
          .setLabel("Sil")
          .setStyle(ButtonStyle.Danger) // v14 ButtonStyle
      )
      let Listed_Commands = []

      for(let i = 0; i < Commands.length; i++) {
        Listed_Commands.push(`Komut: **${Commands[i].name}**
\` • \` Oluşturan: ${message.guild.members.cache.get(Commands[i].created) ? message.guild.members.cache.get(Commands[i].created) : `<@${Commands[i].created}>`} (<t:${String(Commands[i].date).slice(0, 10)}:R>)
\` • \` Kullanabilen: ${Commands[i].allowed.length > 0 ? Commands[i].allowed.map(x => `${message.guild.members.cache.get(x) ? message.guild.members.cache.get(x) : message.guild.roles.cache.get(x) ? message.guild.roles.cache.get(x) : x}`).join(', ') : "**Herkes kullanabilir.**"} 
\` • \` Özellik(ler): **\`${Commands[i].type}\`**, **\`${Commands[i].prefix ? "Prefix" : "No-Prefix"}\`**`)
      }
      // v14: ActionRowBuilder kullanımı
      let Row = new ActionRowBuilder().addComponents(Buttons) 
    
      await msg.edit({content: null, embeds: [ new genEmbed().setDescription(`Aşağıda bulunan düğme ile ${message.guild.name} sunucusuna özel ister mesaj tepkili ister komut tepkili bir komut oluşturabilirsiniz. Ayrıca oluşturulan komutların ismiyle tekrardan ekleme yaparak komutu tekrardan güncelleyebilirsiniz ayrıca kod şeklinde komut oluştururken v13 ve v14 sürümüne ait terimleri kullanabilirsiniz.
Birden fazla tip ile dilediğiniz komutu yaratabilirsiniz.${Listed_Commands.length > 0 ? `

**Oluşturulan komutlar ve özellikleri şunlardır**:
${Listed_Commands.length > 5 ? `${Commands.map(x => x.name).join(", ")}` : Listed_Commands.map((x, index) => `**\` ${index + 1} \`** ${x}`).join("\n──────────────────────────\n")}`: `

Daha önce komut oluşturulmamış. Sana nasıl komut oluşturacağını anlatmamı ister misin?
Aşağıda bulunan "Ekle/Düzenle" düğmesine basarak önünüze açılan menüde ilk komutun ismini yazın.
Komutunuzu bir kişiye özel yapıcaksanız veya rollere özel veyada yetkiye özel yapıcaksanız onları belirtiniz aralarına boşluk koyunuz. (ID veya BitField (ADMINISTRATOR, MANAGE_GUILD vs.))
Komut gibi prefix, slash, context veya da mesaj şeklini seçiniz. 

Komut türlerinde MESSAGE/EMBED/CODE şeklinde 3 adet tür vardır.

"EMBED": Belirtilen içeriği bir embed olarak gösterir.
"MESSAGE": Belirtilen içeriği bir mesaj olarak gösterir.

"CODE":
\`\`\`js
let Row = new ActionRowBuilder().addComponents( // v14 ActionRowBuilder
  new ButtonBuilder() // v14 ButtonBuilder
  .setCustomId("example")
  .setLabel("Örnek")
  .setStyle(ButtonStyle.Secondary), // v14 ButtonStyle
)

message.reply({embeds: [new genEmbed().setDescription("Aşağıdan örnek düğmesine basınız.")], components: [Row]}).then(async (msg) => {

  var filter = (i) => i.user.id == message.author.id
  let collector = msg.createMessageComponentCollector({
    filter: filter,
    timeout: 15000
  });

  collector.on('collect', (i) => {
    if(i.customId == "example") {
      i.reply({
        content: "Düğmeye bastın.",
        ephemeral: true
      })
    }
  })
})
\`\`\``}
`).setFooter(`İşlem yapma süresi 2 dakika'dır. Otomatik silinecektir...`)], components: [Row]})
    .then(async (m) => {
        var filter = (i) => i.user.id === message.author.id;
        let collector = msg.createMessageComponentCollector({filter: filter, timeout: 120000});
        
        collector.on('end', async (collected, reason) => {
          if(reason == "time") {
            await m.edit({content: null, embeds: [ new genEmbed().setDescription(`2 Dakika boyunca aktif olunduğu için otomatik olarak silinecektir.`) ], components: []})
            setTimeout(() => {
              m.delete().catch(err => {})
            }, 7500)
          }
        })
        
        collector.on('collect', async (i) => {
          if(i.customId == "delete_pcmd") {
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
            m.delete().catch(err => {})
              
              // v14: ModalBuilder ve TextInputBuilder kullanımı
            const modal = new ModalBuilder()
            .setCustomId('pcmd_remove')
            .setTitle(`Özelleştirilmiş Komut Kaldırma`)
            .addComponents(
              new ActionRowBuilder().addComponents( // Modal bileşenleri ActionRow içine alınmalı
                  new TextInputBuilder()
                  .setCustomId('pcmd_name')
                  .setLabel('Komut İsmi')
                  .setStyle(TextInputStyle.Short) // v14 TextInputStyle
                  .setMinLength(3)
                  .setMaxLength(120)
                  .setPlaceholder(`Örn: pong`)
                  .setRequired(true)
              )
            );
              // v14: i.showModal(modal) kullanımı
            await i.showModal(modal); 
          }
          
          if(i.customId == "add_pcmd") {
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
            m.delete().catch(err => {})
              
              // v14: ModalBuilder ve TextInputBuilder kullanımı
            const modal = new ModalBuilder()
              .setCustomId('pcmd_add')
              .setTitle(`Özelleştirilmiş Komut Ekleme`)
              .addComponents(
                new ActionRowBuilder().addComponents( // Modal bileşenleri ActionRow içine alınmalı
                  new TextInputBuilder()
                  .setCustomId('pcmd_name')
                  .setLabel('Komut İsmi')
                  .setStyle(TextInputStyle.Short) // v14 TextInputStyle
                  .setMinLength(3)
                  .setMaxLength(120)
                  .setPlaceholder(`Örn: ping`)
                  .setRequired(true)
                  ),
                new ActionRowBuilder().addComponents(
                  new TextInputBuilder()
                  .setCustomId('pcmd_allowed')
                  .setLabel('Kullanıcak Kişiler/Roller/Yetkiler')
                  .setStyle(TextInputStyle.Paragraph) // LONG yerine Paragraph
                  .setMinLength(3)
                  .setMaxLength(250)
                  .setPlaceholder(`Birden fazla için boşluk bırakın. Boş bırakılırsa herkes kullanır.`)
                  .setRequired(false)
                  ),
                new ActionRowBuilder().addComponents(
                  new TextInputBuilder()
                  .setCustomId('pcmd_prefix')
                  .setLabel('Prefix Olsun Mu?')
                  .setStyle(TextInputStyle.Short) // SHORT
                  .setMinLength(3)
                  .setMaxLength(250)
                  .setPlaceholder(`İstiyorsan Olsun yazabilirsin.`)
                  .setRequired(false)
                  ),
                new ActionRowBuilder().addComponents(
                  new TextInputBuilder()
                  .setCustomId('pcmd_type')
                  .setLabel('Komut Türü')
                  .setStyle(TextInputStyle.Short) // SHORT
                  .setMinLength(3)
                  .setMaxLength(250)
                  .setPlaceholder(`CODE/EMBED/MESSAGE şeklinde belirtin.`)
                  .setRequired(true)
                  ),
                new ActionRowBuilder().addComponents(
                  new TextInputBuilder()
                  .setCustomId('pcmd_content')
                  .setLabel('Komut İçeriği')
                  .setStyle(TextInputStyle.Paragraph) // LONG yerine Paragraph
                  .setMinLength(3)
                  .setMaxLength(2048)
                  .setPlaceholder(`Komut içeriği giriniz. Örn: Pong!`)
                  .setRequired(true)
                  )
              );
              // v14: i.showModal(modal) kullanımı
            await i.showModal(modal);
          }
        })
      })
  }
};