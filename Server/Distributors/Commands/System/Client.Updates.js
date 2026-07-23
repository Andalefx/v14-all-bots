const { 
    Client, 
    Message, 
    MessageActionRow, 
    MessageButton, 
    MessageSelectMenu, 
    ButtonBuilder, // v14 Builder
    SelectMenuBuilder, // v14 Builder
    ActionRowBuilder, // v14 Builder
    EmbedBuilder, // v14 Embed
    GatewayIntentBits, // v14 Intents
    ButtonStyle // v14 ButtonStyle
} = require("discord.js");

// Veritabanı importları değişmediği varsayılmıştır.
const Punitives = require('../../../../Global/Databases/Global.Punitives')
const Users = require('../../../../Global/Databases/Client.Users')
const GUARDS_SETTINGS = require('../../../../Global/Databases/Global.Guard.Settings')
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings')
const { genEmbed } = require('../../../../Global/İnit/Embed')

let BOTS = global.allBots = client.allBots = []
module.exports = {
    Isim: "bot",
    Komut: ["bot-dev","update-bots","botsu","acr-bot","bot-setting","dev-discord","bots","botpp"],
    Kullanim: "",
    Aciklama: "",
    Kategori: "-",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: async function (client) {
    let callbacks = require('../../../../Global/Settings/_system.json');

    // Bot Token's
    // sistem objesinin tanımlı olduğu varsayılmıştır.

    let Stat = callbacks.TOKENS.Statistics
    let Voucher = callbacks.TOKENS.Voucher
    let Controller = sistem.TOKENS.CONTROLLER
    let Sync = callbacks.TOKENS.SYNC
    let SEC_MAIN = callbacks.TOKENS.SECURITY.MAIN
    let SEC_ONE = callbacks.TOKENS.SECURITY.SEC_ONE
    let SEC_TWO = callbacks.TOKENS.SECURITY.SEC_TWO
    let SEC_THREE = callbacks.TOKENS.SECURITY.SEC_THREE
    let SEC_FOUR = callbacks.TOKENS.SECURITY.SEC_FOUR
    let DISTS = callbacks.TOKENS.SECURITY.DISTS
    let WELCOMES = callbacks.TOKENS.WELCOME.WELCOMES
    // Bot Token's

    let allTokens = [Stat, Voucher, Controller, Sync, SEC_MAIN, SEC_ONE, SEC_TWO, SEC_THREE, SEC_FOUR, ...WELCOMES, ...DISTS] // SEC_THREE ve SEC_FOUR eksik eklenmiştir.
    let guardSettings = await GUARDS_SETTINGS.findOne({guildID: sistem.SERVER.ID})
    if(!guardSettings) await GUARDS_SETTINGS.updateOne({guildID: sistem.SERVER.ID}, {$set: {"auditLimit": 10, auditInLimitTime: "2m"}}, {upsert: true})
    
    // v14 Intent Listesi
    const requiredIntents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences, // Eğer presence (durum) bilgisi gerekiyorsa.
    ];

    allTokens.forEach(async (token) => {
        let botClient;
        if(callbacks.TOKENS.SECURITY.DISTS.includes(token) || SEC_TWO == token) {
            botClient = new Client({
                intents: requiredIntents, // v14 Intents
                presence: { status: "invisible" },
              }); 
        } else {
            botClient = new Client({
                intents: requiredIntents, // v14 Intents
                presence: {activities: [{name: sistem.botStatus.Name}], status: sistem.botStatus.Status}
              });

        }
        botClient.on("ready", async () => {  
          BOTS.push(botClient)
          let guardSettings = await GUARDS_SETTINGS.findOne({guildID: sistem.SERVER.ID})
          if(!callbacks.TOKENS.WELCOME.WELCOMES.includes(botClient.token)) {
            if(guardSettings && guardSettings.BOTS && !guardSettings.BOTS.includes(botClient.user.id)) {
                await GUARDS_SETTINGS.updateOne({guildID: sistem.SERVER.ID}, {$push: {"BOTS": botClient.user.id} }, {upsert: true})
            }
          }  
      })
      await botClient.login(token).catch(err => {
            console.error(`Token ile giriş yapılamadı: ${err.message}`);
      })
    })

  },

   /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */

  onRequest: async function (client, message, args) {
    let callbacks = require('../../../../Global/Settings/_system.json');
    // Global fonksiyonların (sistem, emojiler, cevaplar, tarihsel) tanımlı olduğu varsayılmıştır.

        // Bot Token's
    let Req = callbacks.TOKENS.Requirements
    let Stat = callbacks.TOKENS.Statistics
    let Voucher = callbacks.TOKENS.Voucher
    let SEC_MAIN = callbacks.TOKENS.SECURITY.MAIN
    let SEC_ONE = callbacks.TOKENS.SECURITY.SEC_ONE
    let SEC_TWO = callbacks.TOKENS.SECURITY.SEC_TWO
    let SEC_THREE = callbacks.TOKENS.SECURITY.SEC_THREE
    let SEC_FOUR = callbacks.TOKENS.SECURITY.SEC_FOUR
    let DISTS = callbacks.TOKENS.SECURITY.DISTS
        // Bot Token's

    let allTokens = [Req, Stat, Voucher, SEC_MAIN, SEC_ONE, SEC_TWO, SEC_THREE, SEC_FOUR, ...DISTS]
    let pubTokens = [Req, Stat, Voucher, SEC_MAIN, SEC_ONE, SEC_TWO, SEC_THREE, SEC_FOUR]
   
    let OWNBOTS = []

    BOTS.forEach(bot => {
        OWNBOTS.push({
            value: bot.user.id,
            emoji: { id: "925127916621291541" },
            label: `${bot.user.tag}`,
            description: `${bot.user.id}`
        })
    })
    
    // v14 Select Menu Builder Kullanımı
    let Row = new ActionRowBuilder().addComponents(
        new SelectMenuBuilder()
        .setCustomId("selectBot")
        .setPlaceholder("Güncellenmesini istediğiniz botu seçin.")
        .setOptions(OWNBOTS)
    )

    // v14 Embed Kullanımı
    let msg = await message.channel.send({
        embeds: [
            new genEmbed()
            .setColor("White")
            .setAuthor({ name: message.member.user.tag, iconURL: message.member.user.avatarURL({ dynamic: true }) })
            .setDescription(`Aşağıda sıralanmakta olan botların ismini, profil fotoğrafını, durumunu ve hakkındasını değişmesini istediğiniz bir botu seçiniz.`)
        ],
        components: [Row]
    })
    
    const filter = i => i.user.id == message.member.id
    // v14'te collector'lar aynı şekilde kullanılır.
    const collector = msg.createMessageComponentCollector({ filter: filter,  errors: ["time"], time: 35000 })

    collector.on('collect', async (i) => {
        if(i.customId == "selectBot") {
            let type = i.values[0] // Select Menu'den gelen değer arraydir. İlk elemanı alıyoruz.
            if(!type) return await i.reply({content: "Bir bot veya işlem bulunamadı!", ephemeral: true})

            let botId = type
            let botClient = BOTS.find(bot => bot.user.id == type)
            if(!botClient) return await i.reply({content: "Bir bot veya işlem bulunamadı!", ephemeral: true})
            
            // v14 Button Builder Kullanımı
            let updateRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                .setCustomId("selectAvatar")
                .setEmoji("943286130357444608")
                .setLabel("Profil Fotoğrafı Değişikliliği")
                .setStyle(ButtonStyle.Secondary), // v14 ButtonStyle
                new ButtonBuilder()
                .setCustomId("selectName")
                .setEmoji("943290426562076762")
                .setLabel("İsim Değişikliliği")
                .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                .setCustomId("selectAbout")
                .setEmoji("943290446329835570")
                .setLabel("Hakkında Değişikliliği")
                .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                .setCustomId("selectState")
                .setEmoji("951514358377234432")
                .setLabel("Durum Değişikliliği")
                .setStyle(ButtonStyle.Secondary),
            )
            await i.deferUpdate(); // İnteraksiyonu 3 saniye içinde yanıtlamak için

            msg.delete().catch(err => {})
            await message.channel.send({
                embeds: [
                    new genEmbed()
                    .setColor("WHITE")
                    .setDescription(`${botClient.user} (**${botClient.user.tag}**) isimli bot üzerinde yapmak istediğiniz değişikliliği seçiniz?`)
                ],
                components: [updateRow]
            }).then(msg => {
                const filter = j => j.user.id == message.member.id 
                const collector = msg.createMessageComponentCollector({ filter: filter,  errors: ["time"], time: 35000 })
                collector.on("collect", async (j) => {
                    let botClient = BOTS.find(bot => bot.user.id == botId)
                    if(!botClient) return await j.reply({content: "Bir bot veya işlem bulunamadı!", ephemeral: true})

                    await j.deferUpdate(); // İnteraksiyonu 3 saniye içinde yanıtlamak için

                    if(j.customId == "selectAbout" || j.customId == "selectState") {
                        await message.channel.send({content:`Şuan yapım aşamasında.`, ephemeral: true}).then(x => setTimeout(() => x.delete().catch(err => {}), 7500));
                        return;
                    }
                    if(j.customId == "selectAvatar") {
                        msg.edit({embeds: [new genEmbed().setColor("DarkGold").setDescription(`${message.guild.emojiGöster(emojiler.Icon)} ${botClient.user} isimli botun yeni profil resmini yükleyin veya bağlantısını girin. İşlemi iptal etmek için (**iptal**) yazabilirsiniz. (**Süre**: \`60 Saniye\`)`)],components: []})
                        var isimfilter = m => m.author.id == message.member.id
                        let col = msg.channel.createMessageCollector({filter: isimfilter, time: 60000, max: 1, errors: ["time"]})

                        col.on('collect', async (m) => {
                            m.delete().catch(err => {});
                            if (m.content.toLowerCase() == "iptal" || m.content.toLowerCase() == "i") {
                                msg.delete().catch(err => {});
                                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {})
                                await message.channel.send({content: `${cevaplar.prefix} Profil resmi değiştirme işlemi iptal edildi.`}).then(x => setTimeout(() => x.delete().catch(err => {}), 7500));
                                return;
                              };
                            // let eskinick = botClient.user.avatarURL({dynamic: true}) // AvatarURL'i eski avatar olarak kullanmak biraz anlamsız.
                                let bekle = await message.reply(`Bu işlem biraz uzun sürebilir, Lütfen bekleyin...`)
                                let isim = m.content || m.attachments.first()?.url // v14'te attachments koleksiyonu, ilk öğeyi almak için .first() kullanılabilir, opsiyonel zincirleme eklendi.
                                if(!isim) {
                                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {})
                                    msg.delete().catch(err => {});
                                    await message.channel.send({content: `${cevaplar.prefix} Profil resmi belirtilmediği için işlem iptal edildi.`}).then(x => setTimeout(() => x.delete().catch(err => {}), 7500));
                                    return;
                                }
                              botClient.user.setAvatar(isim).then(x => {
                                  bekle.delete().catch(err => {})
                                  msg.delete().catch(err => {})
                                  let logChannel = message.guild.kanalBul("guild-log")
                                    // v14 EmbedBuilder Kullanımı
                                  if(logChannel) logChannel.send({embeds: [new genEmbed().setFooter({ text: `${tarihsel(Date.now())} tarihinde işleme koyuldu.`}).setDescription(`${message.member} tarafından ${botClient.user} isimli botun profil resmi değiştirildi.`).setThumbnail(botClient.user.avatarURL())]})
                                  message.channel.send({embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla! ${botClient.user} isimli botun profil resmi güncellendi!`).setThumbnail(botClient.user.avatarURL())]}).then(x => {
                                   message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
                                   setTimeout(() => {
                                       x.delete().catch(err => {})
                                   }, 30000);
                                  })
                              }).catch(err => {
                                   bekle.delete().catch(err => {})
                                   msg.delete().catch(err => {})
                                  message.channel.send(`${cevaplar.prefix} **${botClient.user.tag}**, Başarısız! profil resmi güncelleyebilmem için biraz beklemem gerek!`).then(x => {
                                   message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {})
                                   setTimeout(() => {
                                       x.delete().catch(err => {})
                                   }, 7500);
                                  })
                              })
                            });
                            
                            col.on('end', collected => {
                                // Eğer işlem tamamlanmadıysa mesajı siler
                                if(msg.deletable) msg.delete().catch(err => {});
                            });
                        }
                        if(j.customId == "selectName") {
                            msg.edit({embeds: [new genEmbed().setColor("DarkGold").setDescription(`${message.guild.emojiGöster(emojiler.Icon)} ${botClient.user} isimli botun yeni ismini belirtin. İşlemi iptal etmek için (**iptal**) yazabilirsiniz. (**Süre**: \`60 Saniye\`)`)],components: []})
                            var isimfilter = m => m.author.id == message.member.id
                            let col = msg.channel.createMessageCollector({filter: isimfilter, time: 60000, max: 1, errors: ["time"]})

                            col.on('collect', async (m) => {
                                m.delete().catch(err => {});
                                if (m.content.toLowerCase() == "iptal" || m.content.toLowerCase() == "i") {
                                    msg.delete().catch(err => {});
                                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {})
                                    await message.channel.send({content: `${cevaplar.prefix} İsim değiştirme işlemi iptal edildi.`}).then(x => setTimeout(() => x.delete().catch(err => {}), 7500));
                                    return;
                                  };
                                  let eskinick = botClient.user.username
                                  let bekle = await message.reply(`Bu işlem biraz uzun sürebilir, Lütfen bekleyin...`)
                                  let isim = m.content
                                if(!isim) {
                                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {})
                                    msg.delete().catch(err => {});
                                    await message.channel.send({content: `${cevaplar.prefix} İsim belirtilmediği için işlem iptal edildi.`}).then(x => setTimeout(() => x.delete().catch(err => {}), 7500));
                                    return;
                                }
                              botClient.user.setUsername(isim).then(x => {
                                  bekle.delete().catch(err => {})
                                  msg.delete().catch(err => {})
                                  let logChannel = message.guild.kanalBul("guild-log")
                                // v14 EmbedBuilder Kullanımı
                                  if(logChannel) logChannel.send({embeds: [new genEmbed().setFooter({ text: `${tarihsel(Date.now())} tarihinde işleme koyuldu.`}).setDescription(`${message.member} tarafından ${botClient.user} isimli botun ismi değiştirildi.\n**${eskinick}** \` ••❯ \` **${botClient.user.username}** olarak güncellendi.`)]})
                                  message.channel.send({embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla! **${eskinick}** \` ••❯ \` **${botClient.user.username}** olarak değiştirildi.`)]}).then(x => {
                                   message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
                                   setTimeout(() => {
                                       x.delete().catch(err => {})
                                   }, 30000);
                                  })
                              }).catch(err => {
                                   bekle.delete().catch(err => {})
                                   msg.delete().catch(err => {})
                                  message.channel.send(`${cevaplar.prefix} **${botClient.user.tag}**, Başarısız! isim değiştirebilmem için biraz beklemem gerek!`).then(x => {
                                   message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {})
                                   setTimeout(() => {
                                       x.delete().catch(err => {})
                                   }, 7500);
                                  })
                              })
                            });
                            
                            col.on('end', collected => {
                                // Eğer işlem tamamlanmadıysa mesajı siler
                                if(msg.deletable) msg.delete().catch(err => {});
                            });
                        }
                    })
                })
   
        }
    })

    collector.on("end", async () => {
        msg.delete().catch(err => {})
    })
  }
};