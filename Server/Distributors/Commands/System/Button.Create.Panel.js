const {
  Client,
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  ButtonStyle,
} = require("discord.js");
const {
  genEmbed
} = require('../../../../Global/İnit/Embed');
const GUILD_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Invite = require('../../../../Global/Databases/Global.Guild.Invites')
const Users = require('../../../../Global/Databases/Client.Users');
const Stats = require('../../../../Global/Databases/Client.Users.Stats')
const Heykeller = require('../../../../Global/Databases/Middle.Heykels')
let statConfig;
const moment = require('moment');
require("moment-duration-format");
require("moment-timezone");
const table = require('table');
// const { Modal, TextInputComponent, showModal } = dcmodal = require('discord-modals') // v14'te yerel olduğu için kaldırıldı

// dcmodal(client) // v14'te yerel olduğu için kaldırıldı

let özellikler = [{
    name: "oğlak",
    type: "burç"
  },
  {
    name: "kova",
    type: "burç"
  },
  {
    name: "balık",
    type: "burç"
  },
  {
    name: "koç",
    type: "burç"
  },
  {
    name: "boğa",
    type: "burç"
  },
  {
    name: "ikizler",
    type: "burç"
  },
  {
    name: "yengeç",
    type: "burç"
  },
  {
    name: "aslan",
    type: "burç"
  },
  {
    name: "başak",
    type: "burç"
  },
  {
    name: "terazi",
    type: "burç"
  },
  {
    name: "akrep",
    type: "burç"
  },
  {
    name: "yay",
    type: "burç"
  },

  {
    name: "lovers",
    type: "ilişki"
  },
  {
    name: "alone",
    type: "ilişki"
  },

  {
    name: "pembe",
    type: "renkler"
  },
  {
    name: "mavi",
    type: "renkler"
  },
  {
    name: "turuncu",
    type: "renkler"
  },
  {
    name: "kırmızı",
    type: "renkler"
  },
  {
    name: "mor",
    type: "renkler"
  },
  {
    name: "beyaz",
    type: "renkler"
  },
  {
    name: "sarı",
    type: "renkler"
  },
  {
    name: "yeşil",
    type: "renkler"
  },
  {
    name: "siyah",
    type: "renkler"
  },

  {
    name: "dc",
    type: "oyun"
  },
  {
    name: "vk",
    type: "oyun"
  },

  {
    name: "bestFriendRolü",
    type: "diğer"
  },


  // Tekil, Rol, Kanal, Roller, Acmali, Cogul
];
module.exports = {
  Isim: "seçenek",
  Komut: ["seçeneksistem"],
  Kullanim: "",
  Aciklama: "",
  Kategori: "-",
  Extend: true,

  /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */
  onLoad: function (client) {
    // # Modal Etkileşimlerini Yöneten Native v14 Kısım
    client.on('interactionCreate', async (modal) => {
      if (!modal.isModalSubmit()) return;

      statConfig = require('../../../../Global/Settings/settings')
      let guild = client.guilds.cache.get(global.sistem.SERVER.ID)
      if (!guild) {
        await modal.deferReply({
          ephemeral: true
        })
        return await modal.followUp({
          content: `Sistemsel hata oluştu.`,
          ephemeral: true
        })
      }
      let uye = guild.members.cache.get(modal.user.id)
      if (!uye) {
        await modal.deferReply({
          ephemeral: true
        })
        return await modal.followUp({
          content: `Sistemsel hata oluştu.`,
          ephemeral: true
        })
      }

      if (modal.customId == "istekoneri") {
        let logKanalı = guild.kanalBul("istek-öneri-log")
        if (!logKanalı) {
          await modal.deferReply({
            ephemeral: true
          })
          return await modal.followUp({
            content: `İstek-Öneri kanalı bulunmadığından dolayı, işleminize devam edemiyoruz. ${cevaplar.prefix}`,
            ephemeral: true
          })
        }
        let text = modal.fields.getTextInputValue('textIstekOneri');
        let embed = new genEmbed().setFooter({
          text: `${uye.user.tag} • Yeni ${ayarlar.serverName} İstek/Öneri`,
          iconURL: uye.user.avatarURL({
            dynamic: true
          })
        })
        let Etiket;
        if (roller && roller.Buttons && roller.Buttons.istekÖneriŞikayetSorumlusu) Etiket = `${uye.guild.roles.cache.get(roller.Buttons.istekÖneriŞikayetSorumlusu)}`
        logKanalı.send({
          content: Etiket ? Etiket : null,
          embeds: [embed.setDescription(`**Merhaba!** ${ayarlar.serverName} Yönetimi
${uye} isimli üyenin <t:${String(Date.now()).slice(0,10)}:F> tarihinde aşağıda istek veya önerisi belirtilmiştir.`)
            .addFields({
              name: `İçerik`,
              value: `${text}`
            })
          ]
        })
        await modal.deferReply({
          ephemeral: true
        })
        await modal.followUp({
          content: `Başarıyla istek veya öneriniz yönetime iletilmiştir. Teşekkür Ederiz! ${guild.emojiGöster(emojiler.Onay)}`,
          ephemeral: true
        })
      }

      if (modal.customId == "botsorun") {
        let logKanalı = guild.kanalBul("bot-sorun-log")
        if (!logKanalı) {
          await modal.deferReply({
            ephemeral: true
          })
          return await modal.followUp({
            content: `Bot sorun kanalı bulunmadığından dolayı, işleminize devam edemiyoruz. ${cevaplar.prefix}`,
            ephemeral: true
          })
        }
        let text = modal.fields.getTextInputValue('textsorun');
        let embed = new genEmbed().setFooter({
          text: `${uye.user.tag} • Yeni Bot Sorun Bildirimi`,
          iconURL: uye.user.avatarURL({
            dynamic: true
          })
        })
        logKanalı.send({
          content: `<@327236967265861633>`,
          embeds: [embed.setDescription(`**Merhaba!** ${ayarlar.serverName} Yönetimi
${uye} isimli üyenin <t:${String(Date.now()).slice(0,10)}:F> tarihinde aşağıda bot sorunu bildirdi.`)
            .addFields({
              name: `İçerik`,
              value: `${text}`
            })
          ]
        })
        await modal.deferReply({
          ephemeral: true
        })
        await modal.followUp({
          content: `Başarıyla bot sorunu acar'a iletilmiştir. Teşekkür Ederiz! ${guild.emojiGöster(emojiler.Onay)}`,
          ephemeral: true
        })
      }

      if (modal.customId == "soruncozmecagir") {
        let logKanalı = guild.kanalBul("şikayet-log")
        if (!logKanalı) {
          await modal.deferReply({
            ephemeral: true
          })
          return await modal.followUp({
            content: `Şikayet kanalı bulunmadığından dolayı, işleminize devam edemiyoruz. ${cevaplar.prefix}`,
            ephemeral: true
          })
        }
        let yetkiliRol = uye.guild.roles.cache.get(roller.altilkyetki);
        let uyeUstRol = uye.guild.roles.cache.get(uye.roles.highest.id)
        // if(yetkiliRol.rawPosition < uyeUstRol.rawPosition) {
        //   await modal.deferReply({ ephemeral: true })
        //    return await modal.followUp({content: `Yetkili olduğunuzdan dolayı, işleminize devam edemiyoruz. ${cevaplar.prefix}` , ephemeral: true })
        //  }
        let sorun = modal.fields.getTextInputValue('sorun');
        let hakkında = modal.fields.getTextInputValue('hakkında');
        let embed = new genEmbed().setFooter({
          text: `${uye.user.tag} • Yeni ${ayarlar.serverName} Sorun Çözme Çağırma Formu`,
          iconURL: uye.user.avatarURL({
            dynamic: true
          })
        })
        logKanalı.send({
          content: `${roller.sorunÇözmeciler.map(x => uye.guild.roles.cache.get(x)).join(", ")}`,
          embeds: [embed.setDescription(`${uye} isimli cezalı bir üye sorun çözme çağırmak istiyor. Aktif olan sorun çözmecilerimizin bu olaya bakmasını istiyorum.`)
            .addFields({
              name: "Sorun Tipi",
              value: `> ${sorun}`
            }, {
              name: "Sorun",
              value: `> ${hakkında}`
            })
          ]
        })
        await modal.deferReply({
          ephemeral: true
        })
        await modal.followUp({
          content: `Başarıyla sorun çözmeye hatalı bildiri iletilmiştir. Teşekkür Ederiz! ${guild.emojiGöster(emojiler.Onay)}`,
          ephemeral: true
        })
      }

      if (modal.customId == "ybasvuru") {
        let logKanalı = guild.kanalBul("başvuru-log")
        if (!logKanalı) {
          await modal.deferReply({
            ephemeral: true
          })
          return await modal.followUp({
            content: `Başvuru kanalı bulunmadığından dolayı, işleminize devam edemiyoruz. ${cevaplar.prefix}`,
            ephemeral: true
          })
        }
        let yetkiliRol = uye.guild.roles.cache.get(roller.altilkyetki);
        let uyeUstRol = uye.guild.roles.cache.get(uye.roles.highest.id)
        if (yetkiliRol.rawPosition < uyeUstRol.rawPosition) {
          await modal.deferReply({
            ephemeral: true
          })
          return await modal.followUp({
            content: `Yetkili olduğunuzdan dolayı, işleminize devam edemiyoruz. ${cevaplar.prefix}`,
            ephemeral: true
          })
        }
        let isimyas = modal.fields.getTextInputValue('isimyas');
        let aktiflik = modal.fields.getTextInputValue('aktiflik');
        let yarar = modal.fields.getTextInputValue('yarar');
        let hakkında = modal.fields.getTextInputValue('hakkında');
        let refernas = modal.fields.getTextInputValue('referans');
        let embed = new genEmbed().setFooter({
          text: `${uye.user.tag} • Yeni ${ayarlar.serverName} Yetkili Başvurusu`,
          iconURL: uye.user.avatarURL({
            dynamic: true
          })
        })
        let Etiket;
        if (ayarlar && roller.Buttons && roller.Buttons.genelSorumlular && roller.Buttons.sorumlulukSorumlusu) {
          Etiket = [...roller.Buttons.genelSorumlular, ...roller.Buttons.sorumlulukSorumlusu]
        }
        logKanalı.send({
          content: `${Etiket ? Etiket.map(x => guild.roles.cache.get(x)).join(", ") : `@everyone`}`,
          embeds: [embed.setDescription(`**Merhaba!** ${Etiket ? Etiket.map(x => guild.roles.cache.get(x)).join(", ") : ayarlar.serverName}

${uye} (**\`${isimyas}\`**) isimli üyesinin yaptığı <t:${String(Date.now()).slice(0,10)}:F> tarihindeki yetkili başvurusunun detayları aşağıda görüntülenmiştir.`)
            .addFields({
              name: `Referans Bilgisi`,
              value: `${refernas ? `${guild.members.cache.find(x => x.user.tag == refernas || x.user.username.includes(refernas) || x.id == refernas) ? guild.members.cache.find(x => x.user.tag == refernas || x.user.username.includes(refernas) || x.id == refernas) : `${refernas}`}` : "Bir referans belirtilmemiş."}`
            }, {
              name: `Yetkilik Geçmiş Bilgisi`,
              value: `${aktiflik}`
            }, {
              name: `Yaptırım Bilgisi`,
              value: `${yarar}`
            }, {
              name: `Hakkında`,
              value: `${hakkında}`
            })
          ]
        })
        await modal.deferReply({
          ephemeral: true
        })
        await modal.followUp({
          content: `Başarıyla yetkili başvuru kaydınız alınmıştır en kısa süreçte sizlere ulaşacağız, lütfen özel mesaj kutunuzu herkese açık yapın. ${guild.emojiGöster(emojiler.Onay)}`,
          ephemeral: true
        })
      }
    });

    // # Raw API Etkileşimlerini Yöneten Native v14 Kısım
    // Not: Discord.js v14'te `client.ws.on('INTERACTION_CREATE', ...)` yerine
    //      Component ID'lerine göre burada işlem yapıldı ve `i.reply()` kullanıldı.
    client.on('interactionCreate', async interaction => {
      if (!interaction.isMessageComponent() && !interaction.isMessageContextMenuCommand()) return; // İstenen etkileşim tipi değilse çık.

      let GameMap = new Map([
        ["cezaListesi", roller.teyitciRolleri],
        ["lastPunitives", roller.teyitciRolleri],
        ["cezaPuanim", roller.teyitciRolleri],
        ["II", "123"],
        ["III", "123"],
        ["IV", "123"],
        ["V", "123"],
        ["VI", "123"],
        ["VII", "123"],
        ["VIII", "123"],
        ["IX", "123"],
        ["bestFriend", roller.Buttons ? roller.Buttons.bestFriendRolü ? roller.Buttons.bestFriendRolü : "123" : "123"],
      ])
      let name = interaction.customId || interaction.values[0] // Hem buton/select menu ID'si hem de select menu değeri için kontrol
      let guild = client.guilds.cache.get(sistem.SERVER.ID)
      let member = guild.members.cache.get(interaction.user.id) // interaction.member.user.id yerine interaction.user.id daha uygun
      if (!GameMap.has(name) || !member) return;

      let Cezalar = await Punitives.find({
        Member: member.id
      })
      let InviteData = await Invite.findOne({
        guildID: member.guild.id,
        userID: member.user.id
      });
      let returnText;

      // Hızlı cevap için deferReply yapıyoruz
      await interaction.deferReply({
        ephemeral: true
      })

      if (name == "bestFriend") {
        let heykelKontrol = await Heykeller.findOne({
          _id: member.id
        })
        if (!heykelKontrol) {
          returnText = `**Üzgünüm!** Yakın arkadaş listesine girebilmek için listeye eklenmen gerekli. Lütfen daha sonra tekrar deneyin! ${member.guild.emojiGöster(emojiler.Iptal)}`
        } else if (heykelKontrol) {
          if (roller.Buttons.bestFriendRolü && member.roles.cache.has(roller.Buttons.bestFriendRolü)) {
            returnText = `${member.guild.emojiGöster(emojiler.Iptal)} **Alınmış!** Daha önce alındığı için 00:00 Saatini beklemelisin.`
          } else if (roller.Buttons.bestFriendRolü && !member.roles.cache.has(roller.Buttons.bestFriendRolü)) {
            member.roles.add(roller.Buttons.bestFriendRolü)
            returnText = `**Başarılı!** Artık Sende Bir Yakın Arkadaş Oldun! ${member.guild.emojiGöster(emojiler.Onay)}`
          }
        }

      }

      if (name == "cezaListesi") {
        let data = [["ID", "🔵", "Ceza Tarihi", "Ceza Türü", "Ceza Sebebi"]];
        data = data.concat(Cezalar.map(value => {
          return [
            `#${value.No}`,
            `${value.Active == true ? "✅" : `❌`}`,
            `${tarihsel(value.Date)}`,
            `${value.Type}`,
            `${value.Reason}`
          ]
        }));
        let veriler = table.table(data, {
          columns: {
            0: {
              paddingLeft: 1
            },
            1: {
              paddingLeft: 1
            },
            2: {
              paddingLeft: 1
            },
            3: {
              paddingLeft: 1,
              paddingRight: 1
            },
          },
          border: table.getBorderCharacters(`void`),
          drawHorizontalLine: function (index, size) {
            return index === 0 || index === 1 || index === size;
          }
        });
        returnText = `\`\`\`fix\n${await Punitives.findOne({Member: member.id}) ? veriler : `Tebrikler! ${member.guild.name} sunucusun da sana ait ceza bilgisine ulaşılamadı.`}\n\`\`\``
      }

      if (name == "lastPunitives") {
        let sesMute = await Punitives.find({
          Member: member.id,
          Active: true,
          Type: "Ses Susturulma"
        })
        let chatMute = await Punitives.find({
          Member: member.id,
          Active: true,
          Type: "Metin Susturulma"
        })
        let Cezali = await Punitives.find({
          Member: member.id,
          Active: true,
          Type: "Cezalandırılma"
        })
        let aktifCezalarList = []
        if (Cezali) Cezali.forEach(ceza => {
          aktifCezalarList.push({
            No: ceza.No,
            Tip: ceza.Type,
            Yetkili: ceza.Staff ? member.guild.members.cache.get(ceza.Staff) ? member.guild.members.cache.get(ceza.Staff) : `<@${ceza.Staff}>` : ayarlar.serverName,
            Atılan: ceza.Duration ? moment.duration(ceza.Duration - Date.now()).format("H [Saat], m [Dakika] s [Saniye]") : "Kalıcı",
            Kalkma: `${moment.duration(ceza.Duration- Date.now()).format("H [saat], m [dakika] s [saniye]")} kaldı.`
          })
        })
        if (sesMute) sesMute.forEach(ceza => {
          aktifCezalarList.push({
            No: ceza.No,
            Tip: ceza.Type,
            Yetkili: ceza.Staff ? member.guild.members.cache.get(ceza.Staff) ? member.guild.members.cache.get(ceza.Staff) : `<@${ceza.Staff}>` : ayarlar.serverName,
            Atılan: ceza.Duration ? moment.duration(ceza.Duration - Date.now()).format("H [Saat], m [Dakika] s [Saniye]") : "Kalıcı",
            Kalkma: `${moment.duration(ceza.Duration- Date.now()).format("H [saat], m [dakika] s [saniye]")} kaldı.`
          })
        })
        if (chatMute) chatMute.forEach(ceza => {
          aktifCezalarList.push({
            No: ceza.No,
            Tip: ceza.Type,
            Yetkili: ceza.Staff ? member.guild.members.cache.get(ceza.Staff) ? member.guild.members.cache.get(ceza.Staff) : `<@${ceza.Staff}>` : ayarlar.serverName,
            Atılan: ceza.Duration ? moment.duration(ceza.Duration - Date.now()).format("H [Saat], m [Dakika] s [Saniye]") : "Kalıcı",
            Kalkma: `${ceza.Duration? moment.duration(ceza.Duration- Date.now()).format("H [Saat], m [Dakika] s [Saniye]") : "Kalıcı"}`
          })
        })

        returnText = `${aktifCezalarList ?
aktifCezalarList.map(x => `${member.guild.emojiGöster(emojiler.Iptal)} ${x.Yetkili} tarafından **${x.Atılan}** süresince işlenen "__#${x.No}__" numaralı "__${x.Tip}__" türündeki cezalandırmanın kalkmasına **${x.Kalkma}** kaldı.`).join("\n")
: `${member.guild.emojiGöster(emojiler.Onay)} Tebrikler! \`${member.guild.name}\` sunucusunda size ait aktif aktif cezaya ulaşılamadı.`}`
      }

      if (name == "cezaPuanim") {
        let cezaPuanı = await member.cezaPuan()
        returnText = `${member.guild.name} sunucunda **${await member.cezaPuan()}** ceza puanın bulunmakta.`
      }

      await interaction.editReply({
        content: returnText ? returnText : `${member.guild.emojiGöster(emojiler.Onay)} Tebrikler! \`${member.guild.name}\` sunucusunda size ait aktif cezaya ulaşılamadı.`,
        ephemeral: true
      })
    });

    // # Standart Etkileşimleri (Buton, Select Menu, Form Açma) Yöneten Native v14 Kısım
    client.on('interactionCreate', async (i) => {
      let member = await i.guild.members.cache.get(i.user.id)
      if (i.customId == "cdestekcik") {
        let canlıDestekBul = i.guild.kanalBul("canlı-destek")
        if (!canlıDestekBul) return i.reply({
          ephemeral: true,
          content: `Canlı destek sistemi kurulu olmadığından dolayı işleminize devam edilemiyor. ${cevaplar.prefix}`
        })
        const canlıDestekKategorisi = canlıDestekBul.parentId
        let canlıDestekRolü = []
        i.guild.roles.cache.map(x => { // .array() yerine .map() kullanıldı
          if (x.name.includes("Canlı Destek")) canlıDestekRolü.push(x.id)
        })

        const evet = new ButtonBuilder()
          .setCustomId("evt")
          .setLabel("Evet")
          .setStyle(ButtonStyle.Success)

        const hayır = new ButtonBuilder()
          .setCustomId("hyr")
          .setLabel("Hayır")
          .setStyle(ButtonStyle.Danger)

        const onay = new ButtonBuilder()
          .setCustomId("onayla")
          .setLabel("Canlı Desteği Onayla")
          .setStyle(ButtonStyle.Success)

        const red = new ButtonBuilder()
          .setCustomId("reddet")
          .setLabel("Reddet")
          .setStyle(ButtonStyle.Danger)

        const dk = new ButtonBuilder()
          .setCustomId("kapatCanliDestek")
          .setLabel("Desteği Sonlandır")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🎫")

        const row2 = new ActionRowBuilder()
          .addComponents([evet, hayır])

        const row3 = new ActionRowBuilder()
          .addComponents([onay, red])

        const row31 = new ActionRowBuilder()
          .addComponents([dk])

        await i.reply({
          embeds: [new genEmbed().setDescription(`Canlı desteğe bağlanmak istediğinize emin misiniz?`).setFooter({
            text: `gereksiz isteklerde yaptırım uygulanacaktır.`
          })],
          components: [row2],
          ephemeral: true
        });
        var filter = (c) => c.user.id && i.user.id
        let collector = i.channel.createMessageComponentCollector({
          filter: filter,
          max: 1,
          time: 30000
        })
        collector.on('collect', async (collect) => {
          if (collect.customId == "evt") {
            await i.editReply({
              embeds: [new genEmbed().setDescription(`Canlı destek ekibimize bildirdik, sizi canlı destek ekibine aktarıyorum. Lütfen bekleyin!`)],
              components: [],
              ephemeral: true
            });
            let logKanalı = i.guild.kanalBul("canlı-destek")
            if (logKanalı) logKanalı.send({
              content: `${canlıDestekRolü.map(x => i.guild.roles.cache.get(x)).join(", ")}`,
              embeds: [new genEmbed().setDescription(`${member} üyesi canlı desteğe bağlanmak istiyor. Kabul ediyor musunuz?`)],
              components: [row3]
            }).then(async (msg) => {
              var filter = (i) => {
                let uyecik = i.guild.members.cache.get(i.user.id)
                return canlıDestekRolü.some(x => uyecik.roles.cache.has(x))
              }
              let collector2 = msg.createMessageComponentCollector({
                componentType: ButtonStyle.Primary, // ButtonComponent'in türü
                max: 1
              });
              collector2.on("collect", async (interaction) => {
                if (interaction.customId == "onayla") {
                  msg.edit({
                    content: null,
                    embeds: [new genEmbed().setDescription(`${member} üyesinin canlı desteği <t:${String(Date.now()).slice(0,10)}:F> tarihinde ${interaction.user} tarafından onaylandı. ${member.guild.emojiGöster(emojiler.Onay)}`)],
                    components: []
                  })

                  member.guild.channels.create({
                    name: `${member.user.tag}-destek`,
                    parent: canlıDestekKategorisi,
                    topic: member.id,
                    permissionOverwrites: [{
                        id: member.id,
                        allow: ['SendMessages', 'ViewChannel'],
                      },

                      {
                        id: interaction.user.id,
                        allow: ['SendMessages', 'ViewChannel'],
                      },
                      {
                        id: member.guild.roles.everyone.id,
                        deny: ['ViewChannel'],
                      },
                    ],
                    type: ChannelType.GuildText, // v14 Enum kullanımı
                  }).then(async c => {
                    c.send({
                      embeds: [new genEmbed().setDescription(`Canlı destek kanalı başarıyla oluşturuldu.
**NOT:** Canlı destek almaktan vaz geçerseniz veya destek bitti ise aşağıda ki düğmeyi kullanabilirsiniz.`).setFooter({
                        text: `bu canlı destek 5 dakika sonra kapatılacaktır.`
                      })],
                      components: [row31]
                    }).then(async (cmsg) => {
                      let collectorcuk = cmsg.createMessageComponentCollector({
                        time: 60000 * 5
                      })
                      collectorcuk.on('collect', async (inte) => {
                        if (inte.customId == "kapatCanliDestek") {
                          inte.deferUpdate().catch(err => {})
                          cmsg.edit({
                            embeds: [new genEmbed().setDescription(`${cmsg.guild.emojiGöster(emojiler.Onay)} ${inte.user} tarafından canlı destek kapatıldı. 10 Saniye içerisinde kanal yok olacaktır.`)],
                            components: []
                          })
                          setTimeout(() => {
                            c.delete().catch(err => {})
                          }, 10000);
                        }
                      })
                      collectorcuk.on('end', async (kapat) => {
                        c.delete().catch(err => {})
                      })
                    })
                    interaction.reply({
                      content: `[ONAYLANDI] Canlı destek kanalı oluşturuldu.`,
                      ephemeral: true
                    })
                    member.send({
                      content: `Canlı destek isteğiniz başarıyla onaylandı!\nSunucumuzda bulunan <#${c.id}> kanalını ziyaret ediniz.`
                    }).catch(err => {});

                  })

                }
                if (interaction.customId == "reddet") {
                  member.send(`Canlı destek isteğiniz, ${interaction.user} tarafından reddedildi. ${cevaplar.prefix}`).catch(err => {})
                  msg.edit({
                    content: null,
                    embeds: [new genEmbed().setDescription(`${cevaplar.prefix} ${member} üyesinin canlı destek isteği <t:${String(Date.now()).slice(0, 10)}:R> ${interaction.user} tarafından reddedildi.`)],
                    components: []
                  }).catch(err => {})
                  await interaction.reply({
                    ephemeral: true,
                    content: `${member.guild.emojiGöster(emojiler.Onay)} Başarıyla ${member} üyesinin, canlı desteğini iptal ettin.`
                  })
                  setTimeout(() => {
                    msg.delete().catch(err => {})
                  }, 10000);
                }
              })
            })

          }
          if (collect.customId == "hyr") {
            await i.editReply({
              content: `${member.guild.emojiGöster("support")} Canlı destek bağlantısını iptal ettiniz. İyi günler!`,
              components: [],
              ephemeral: true
            })
          }
        })
      }
      if (i.customId == "şüphelidenÇık") {
        let checkWeek = Date.now() - member.user.createdTimestamp <= 1000 * 60 * 60 * 24 * 7;
        let cezaPuan = await member.cezaPuan()
        if (cezaPuan >= 50) {
          i.reply({
            content: `Ceza puanınız 50 ve üzeri olduğu için şüpheliden çıkamazsınız. ${cevaplar.prefix}`,
            ephemeral: true
          })
        } else {
          if (checkWeek) {
            i.reply({
              content: `Şuan şüpheliden çıkman için çok erken! Daha sonra tekrar deneyin. ${cevaplar.prefix}`,
              ephemeral: true
            })
          } else {
            if (!member.roles.cache.has(roller.şüpheliRolü)) return i.reply({
              content: "Şüpheli değilsin ki!",
              ephemeral: true
            })
            member.roles.set(roller.kayıtsızRolleri) // .setRoles() yerine .roles.set() kullanıldı
            member.send(`Şüpheli olmadığınız belirlendi. Kayıtsız olarak sunucumuza hoş geldiniz.`).catch(err => {})
            i.reply({
              content: "Başarıyla şüpheliden çıkartıldın.",
              ephemeral: true
            })
          }
        }
      }

      if (i.customId == "sorunÇözmeci") {
        const modal = new ModalBuilder()
          .setCustomId('soruncozmecagir')
          .setTitle('Sorun Çözme Çağır')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
              .setCustomId('sorun')
              .setLabel('Sorun çeşiti?')
              .setStyle(TextInputStyle.Short) // SHORT yerine TextInputStyle.Short
              .setMinLength(5)
              .setMaxLength(100)
              .setPlaceholder('Örn: Yetkili şikayeti')
              .setRequired(true),
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
              .setCustomId('hakkında')
              .setLabel('Sorunu anlatır mısınız?')
              .setStyle(TextInputStyle.Paragraph) // LONG yerine TextInputStyle.Paragraph
              .setMinLength(5)
              .setMaxLength(500)
              .setPlaceholder('Örn: Sebepsiz yere karantinaya düştüm, böyle böyle vs.')
              .setRequired(true),
            )
          );
        await i.showModal(modal); // showModal(modal, { ... }) yerine i.showModal(modal)
      }
      if (i.customId == "basvurucuk") {
        const modal = new ModalBuilder()
          .setCustomId('ybasvuru')
          .setTitle('Yetkili Başvuru Formu')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
              .setCustomId('isimyas')
              .setLabel('İsiminiz ve yaşınız ?')
              .setStyle(TextInputStyle.Short)
              .setMinLength(5)
              .setMaxLength(25)
              .setPlaceholder('Örn: Acar 20')
              .setRequired(true),
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
              .setCustomId('referans')
              .setLabel('Referans')
              .setStyle(TextInputStyle.Short)
              .setMinLength(5)
              .setMaxLength(100)
              .setPlaceholder('Örn: acar#0001/ID')
              .setRequired(false),
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
              .setCustomId('aktiflik')
              .setLabel('Daha önce yetkilik yaptınız mı?')
              .setStyle(TextInputStyle.Short)
              .setMinLength(1)
              .setMaxLength(250)
              .setPlaceholder('Örn: Evet yaptım, "xxx" sunucusunun yönetim kadrosundaydım.')
              .setRequired(true),
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
              .setCustomId('yarar')
              .setLabel('Ne yapabilirsin bize açıklar mısınız?')
              .setStyle(TextInputStyle.Paragraph)
              .setMinLength(5)
              .setMaxLength(250)
              .setPlaceholder('Örn: Her işi yaparım vs.')
              .setRequired(true),
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
              .setCustomId('hakkında')
              .setLabel('Hakkında bir kaç şey söylemek ister misin?')
              .setStyle(TextInputStyle.Paragraph)
              .setMinLength(5)
              .setMaxLength(400)
              .setPlaceholder('Örn: Telli enstrüman çalmayı çok seviyorum.')
              .setRequired(true)
            )
          );
        await i.showModal(modal); // showModal(modal, { ... }) yerine i.showModal(modal)
      }
      if (i.customId == "soruniletcik") {
        const modal = new ModalBuilder()
          .setCustomId('botsorun')
          .setTitle('Sorunları İlet')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
              .setCustomId('textsorun')
              .setLabel('Sorunu anlatır mısınız?')
              .setStyle(TextInputStyle.Paragraph)
              .setMinLength(5)
              .setMaxLength(500)
              .setPlaceholder('Örn: Kayıt ederken bir hata oluştu ve kayıt edemiyorum.')
              .setRequired(true)
            )
          );
        await i.showModal(modal); // showModal(modal, { ... }) yerine i.showModal(modal)
      }
      if (i.customId == "istekönericik") {
        const istekOneri = new ModalBuilder()
          .setCustomId('istekoneri')
          .setTitle('İstek & Öneri Formu')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
              .setCustomId('textIstekOneri')
              .setLabel('İstek veya öneriniz nedir?')
              .setStyle(TextInputStyle.Paragraph)
              .setMinLength(10)
              .setMaxLength(980)
              .setPlaceholder('İsteğinizi ve önerinizi bizlere iletin..')
              .setRequired(true)
            )
          );
        await i.showModal(istekOneri); // showModal(modal, { ... }) yerine i.showModal(modal)
      }
    })

    client.on('interactionCreate', async (i) => {
      let member = await i.guild.members.cache.get(i.user.id)
      let Cezalar = await Punitives.find({
        Member: member.id
      })
      let InviteData = await Invite.findOne({
        guildID: member.guild.id,
        userID: member.user.id
      });
      if (i.customId == "kpaneli") {
        let name = i.values
        const total = InviteData ? InviteData.total ? InviteData.total : 0 : 0;
        const regular = InviteData ? InviteData.regular ? InviteData.regular : 0 : 0;
        const bonus = InviteData ? InviteData.bonus ? InviteData.bonus : 0 : 0;
        const leave = InviteData ? InviteData.leave ? InviteData.leave : 0 : 0;
        const fake = InviteData ? InviteData.fake ? InviteData.fake : 0 : 0;
        const invMember = await Invite.find({
          Inviter: member.user.id
        });
        const bazıları = invMember ? invMember.filter(value => member.guild.members.cache.get(value.userID)).slice(0, 7).map((value, index) => `\` • \`${member.guild.members.cache.get(value.userID)} (\`${value.userID}\`)`).join("\n") : undefined
        const daily = invMember ? member.guild.members.cache.filter((usr) => invMember.some((x) => x.userID === usr.user.id) && Date.now() - usr.joinedTimestamp < 1000 * 60 * 60 * 24).size : 0;
        const weekly = invMember ? member.guild.members.cache.filter((usr) => invMember.some((x) => x.userID === usr.user.id) && Date.now() - usr.joinedTimestamp < 1000 * 60 * 60 * 24 * 7).size : 0;
        let toplamMesaj = 0
        let toplamSes = 0
        let statData = await Stats.findOne({
          guildID: member.guild.id,
          userID: member.id
        })
        if (statData && statData.voiceStats) statData.voiceStats.forEach(c => toplamSes += c);
        if (statData && statData.chatStats) statData.chatStats.forEach(c => toplamMesaj += c);
        let returnText;
        if (name == "I") returnText = `**${member.guild.name}** Sunucusuna <t:${Number(String(Date.parse(member.joinedAt)).substring(0, 10))}:R> katılmışsınız.`
        if (name == "II") returnText = `Üstünüzde bulunan rol(ler) şunlardır:
${member.roles.cache.filter(x => x.name != "@everyone" || x.id != roller.boosterRolü).map(x => `${x} (\`${x.id}\`)`).join("\n")} 
Üzeriniz de **${member.roles.cache.size}** adet rol(ler) bulunmaktadır.`
        if (name == "XX") {
          let rol = []
          if (roller.Buttons && roller.Buttons.vk && member.roles.cache.has(roller.Buttons.vk)) rol.push(roller.Buttons.vk)
          if (roller.Buttons && roller.Buttons.dc && member.roles.cache.has(roller.Buttons.dc)) rol.push(roller.Buttons.dc)
          if (roller.etkinlikKatılımcısı && member.roles.cache.has(roller.etkinlikKatılımcısı)) rol.push(roller.etkinlikKatılımcısı)
          if (roller.cekilisKatılımcısı && member.roles.cache.has(roller.cekilisKatılımcısı)) rol.push(roller.cekilisKatılımcısı)
          member.roles.remove(rol).catch(err => {})
          returnText = "Üzerinizde bulunan etkinlik ve diğer roller temizlendi."
        }
        if (name == "III") returnText = `Hesabını <t:${Number(String(Date.parse(member.user.createdAt)).substring(0, 10))}:F> tarihinde <t:${Number(String(Date.parse(member.user.createdAt)).substring(0, 10))}:R> açılmış.`
        if (name == "IV") returnText = `Aşağı da davet bilgileri detaylı bir şekilde listelendirilmiştir.

\`•\` **Toplam**: \` ${total + bonus} \` (**Bonus**: \` +${bonus} \`)
\`•\` **Girenler**: \` +${regular} \` (**Sahte**: \`${fake}\`, **Ayrılmış**: \` -${leave} \`)
\`•\` **Günlük**: \` +${daily} \`
\`•\` **Haftalık**: \` +${weekly} \`

${bazıları ? `\` ••❯ \` Davet edilen bazı kullanıcılar: 
${bazıları}` : ''}`
        if (name == "V") returnText = `**${member.guild.name}** sunucunda **${await member.cezaPuan()}** ceza puanın bulunmakta.`
        if (name == "VI") returnText = `**${member.guild.name}** Sunucusunun Bilgisi
Sunucumuz da **${global.sayılıEmoji(member.guild.memberCount)}** üye bulunmakta.
Sunucumuz da **${global.sayılıEmoji(member.guild.members.cache.filter(m => m.presence && m.presence.status !== "offline").size)}** aktif üye bulunmakta.`

        if (name == "VII") {
          let isimveri = await Users.findById(member.id)
          if (isimveri && isimveri.Names) {
            let isimler = isimveri.Names.length > 0 ? isimveri.Names.reverse().map((value, index) => `\` • \` ${value.Name}  ${value.Staff ? "(<@"+ value.Staff + ">)" : ""} (<t:${Number(String(value.Date).substring(0, 10))}:R>) [${value.State}]
──────────────────────`).join("\n") : "";
            returnText = `
Aşağıda sunucu içerisinde ki isimleriniz (**${isimveri.Names.length || 0}**) sıralandırılmıştır:
──────────────────────
${isimler}`
          } else {
            returnText = `${member.guild.name} sunucusunda isim kaydınız bulunamadı.`
          }
        }
        let saatDakikaCevir = (date) => {
          return moment.duration(date).format('H [saat,] m [dakika]');
        };
        if (name == "VIII") returnText = `**Merhaba! ${member.user.tag}** Haftalık toplamda **${saatDakikaCevir(toplamSes)}** boyunca zaman geçirmişsin.
Haftalık toplamda **${toplamMesaj} mesaj** istatistiğiniz bulunuyor.`

        if (name == "isimGuncelleme") {
          let modal = new ModalBuilder()
            .setCustomId('isimDüzenleme')
            .setTitle('İsim Güncelleme')
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                .setCustomId('isim')
                .setLabel('Yeni İsim')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Yeni isminizi belirtin.')
                .setRequired(true),
              )
            );
          if (!member.roles.cache.has(roller.boosterRolü) && (roller.özelRoller && !roller.özelRoller.some(x => member.roles.cache.has(x))) && !member.permissions.has("ADMINISTRATOR") && !member.permissions.has("ManageRoles")) {
            return await i.reply({
              content: `Sunucumuza **boost** basmanız gerekmektedir.`,
              ephemeral: true
            })
          }
          return await i.showModal(modal); // showModal(modal, { ... }) yerine i.showModal(modal)
        }
        await i.reply({
          content: `${returnText}`,
          ephemeral: true
        })
      }

    })

    client.on("interactionCreate", async (interaction) => {
      let menu = interaction.customId
      const member = await client.guilds.cache.get(sistem.SERVER.ID).members.fetch(interaction.member.user.id)
      if (!member) return;
      let Database = await GUILD_SETTINGS.findOne({
        guildID: sistem.SERVER.ID
      })
      const data = Database.Ayarlar.Buttons


      if (menu === "renks") {
        let color = new Map([
          ["kirmizi", data.kırmızı],
          ["turuncu", data.turuncu],
          ["mavi", data.mavi],
          ["mor", data.mor],
          ["pembe", data.pembe],
          ["beyaz", data.beyaz],
          ["yeşil", data.yeşil],
          ["sarı", data.sarı],
          ["siyah", data.siyah],
        ])
        let role = color.get(interaction.values[0])
        let renkroller = [data.kırmızı, data.turuncu, data.mavi, data.mor, data.pembe, data.yeşil, data.sarı, data.siyah, data.beyaz]
        if (!member.roles.cache.has(roller.tagRolü) && !member.roles.cache.has(roller.boosterRolü) && !member.permissions.has("ADMINISTRATOR")) {
          interaction.reply({
            content: `Sadece sunucumuza boost basmış ${ayarlar.type ? `veya taglı` : ``} üyeler renk rolü seçebilir. `,
            ephemeral: true
          })
        } else {
          if (interaction.values[0] === "rolsil") {
            await member.roles.remove(renkroller)
          } else if (role) {
            if (renkroller.some(m => member.roles.cache.has(m))) {
              await member.roles.remove(renkroller)
            }
            await member.roles.add(role)
          }
          interaction.reply({
            content: `Rolleriniz güncellendi.`,
            ephemeral: true
          })
        }
      } else if (menu === "valantines") {
        let relationship = new Map([
          ["couple", data.lovers],
          ["single", data.alone]
        ])
        let role = relationship.get(interaction.values[0])
        let roles = [data.lovers, data.alone]
        if (interaction.values[0] === "rolsil") {
          await member.roles.remove(roles)
        } else if (role) {
          if (roles.some(m => member.roles.cache.has(m))) {
            await member.roles.remove(roles)
          }
          await member.roles.add(role)
        }
        interaction.reply({
          content: "Rolleriniz güncellendi.",
          ephemeral: true
        })
      } else if (menu === "games") {
        let GameMap = new Map([
          ["lol", data.lol],
          ["csgo", data.csgo],
          ["minecraft", data.minecraft], // Veri eksikliği nedeniyle varsayımsal eklendi
          ["valorant", data.valorant], // Veri eksikliği nedeniyle varsayımsal eklendi
          ["fortnite", data.fortnite], // Veri eksikliği nedeniyle varsayımsal eklendi
          ["gta5", data.gta5], // Veri eksikliği nedeniyle varsayımsal eklendi
          ["pubg", data.pubg], // Veri eksikliği nedeniyle varsayımsal eklendi
          ["wildrift", data.wildrift], // Veri eksikliği nedeniyle varsayımsal eklendi
          ["mobilelegends", data.mobilelegends], // Veri eksikliği nedeniyle varsayımsal eklendi
          ["fivem", data.fivem], // Veri eksikliği nedeniyle varsayımsal eklendi

        ])
        let roles = [data.lol, data.csgo, data.minecraft, data.valorant, data.fortnite, data.gta5, data.pubg, data.wildrift, data.mobilelegends, data.fivem]
        let role = []
        for (let index = 0; index < interaction.values.length; index++) {
          let ids = interaction.values[index]
          let den = GameMap.get(ids)
          role.push(den)
        }
        if (!interaction.values.length) {
          await member.roles.remove(roles)
        } else {
          await member.roles.remove(roles)
          await member.roles.add(role)
        }
        interaction.reply({
          content: "Rolleriniz güncellendi.",
          ephemeral: true
        })
      } else if (menu === "horoscope") {
        let HorosCope = new Map([
          ["koç", data.koç],
          ["boğa", data.boğa],
          ["ikizler", data.ikizler],
          ["yengeç", data.yengeç],
          ["aslan", data.aslan],
          ["başak", data.başak],
          ["terazi", data.terazi],
          ["akrep", data.akrep],
          ["yay", data.yay],
          ["oğlak", data.oğlak],
          ["kova", data.kova],
          ["balık", data.balık],
        ])
        let roles = [data.koç, data.boğa, data.ikizler, data.yengeç, data.aslan, data.başak, data.terazi, data.akrep, data.yay, data.oğlak, data.kova, data.balık, ]
        let role = HorosCope.get(interaction.values[0])
        if (interaction.values[0] === "rolsil") {
          await member.roles.remove(roles)
        } else if (role) {
          if (roles.some(m => member.roles.cache.has(m))) {
            await member.roles.remove(roles)
          }
          await member.roles.add(role)
        }
        interaction.reply({
          content: "Rolleriniz güncellendi.",
          ephemeral: true
        })
      } else if (menu === "etkinliks") {
        let eventsMap = new Map([
          ["etkinlik", roller.etkinlikKatılımcısı],
          ["cekilis", roller.cekilisKatılımcısı]
        ])
        let roles = [roller.etkinlikKatılımcısı, roller.cekilisKatılımcısı]
        let role = []
        for (let index = 0; index < interaction.values.length; index++) {
          let ids = interaction.values[index]
          let den = eventsMap.get(ids)
          role.push(den)
        }
        if (!interaction.values.length) {
          await member.roles.remove(roles)
        } else {
          await member.roles.remove(roles)
          await member.roles.add(role)
        }
        interaction.reply({
          content: "Rolleriniz güncellendi.",
          ephemeral: true
        })
      }
    })
  },
  run: async (client, message, args, embed) => {

    let secim = args[0]
    if (!args[0]) {
      let Database = await GUILD_SETTINGS.findOne({
        guildID: message.guild.id
      })
      let buttons = Database.Ayarlar.Buttons || {}
      let burclar = [
        buttons.oğlak ? `\`${ayarlar.emoji ? ayarlar.emoji.burç: "*"} \`Oğlak` : "",
        buttons.kova ? `\`${ayarlar.emoji ? ayarlar.emoji.burç: "*"} \`Kova` : "",
        buttons.balık ? `\`${ayarlar.emoji ? ayarlar.emoji.burç: "*"} \`Balık` : "",
        buttons.koç ? `\`${ayarlar.emoji ? ayarlar.emoji.burç: "*"} \`Koç` : "",
        buttons.boğa ? `\`${ayarlar.emoji ? ayarlar.emoji.burç: "*"} \`Boğa` : "",
        buttons.ikizler ? `\`${ayarlar.emoji ? ayarlar.emoji.burç: "*"} \`İkizler` : "",
        buttons.yengeç ? `\`${ayarlar.emoji ? ayarlar.emoji.burç: "*"} \`Yengeç` : "",
        buttons.aslan ? `\`${ayarlar.emoji ? ayarlar.emoji.burç: "*"} \`Aslan` : "",
        buttons.başak ? `\`${ayarlar.emoji ? ayarlar.emoji.burç: "*"} \`Başak` : "",
        buttons.terazi ? `\`${ayarlar.emoji ? ayarlar.emoji.burç: "*"} \`Terazi` : "",
        buttons.akrep ? `\`${ayarlar.emoji ? ayarlar.emoji.burç: "*"} \`Akrep` : "",
        buttons.yay ? `\`${ayarlar.emoji ? ayarlar.emoji.burç: "*"} \`Yay` : "",
      ]
      let iliskiler = [
        buttons.lovers ? `\`${ayarlar.emoji ? ayarlar.emoji.iliskidurumu: "*"} \`Lovers` : "",
        buttons.alone ? `\`${ayarlar.emoji ? ayarlar.emoji.iliskidurumu: "*"} \`Alone` : ""
      ]
      let renkler = [
        buttons.pembe ? `\`${ayarlar.emoji ? ayarlar.emoji.renk: "*"} \`Pembe` : "",
        buttons.mavi ? `\`${ayarlar.emoji ? ayarlar.emoji.renk: "*"} \`Mavi` : "",
        buttons.turuncu ? `\`${ayarlar.emoji ? ayarlar.emoji.renk: "*"} \`Turuncu` : "",
        buttons.kırmızı ? `\`${ayarlar.emoji ? ayarlar.emoji.renk: "*"} \`Kırmızı` : "",
        buttons.mor ? `\`${ayarlar.emoji ? ayarlar.emoji.renk: "*"} \`Mor` : "",
        buttons.beyaz ? `\`${ayarlar.emoji ? ayarlar.emoji.renk: "*"} \`Beyaz` : "",
        buttons.sarı ? `\`${ayarlar.emoji ? ayarlar.emoji.renk: "*"} \`Sarı` : "",
        buttons.yeşil ? `\`${ayarlar.emoji ? ayarlar.emoji.renk: "*"} \`Yeşil` : "",
        buttons.siyah ? `\`${ayarlar.emoji ? ayarlar.emoji.renk: "*"} \`Siyah` : "",
      ]

      let oyunlar = [
        buttons.dc ? `\`${ayarlar.emoji ? ayarlar.emoji.oyun: "*"} \`DC` : "",
        buttons.vk ? `\`${ayarlar.emoji ? ayarlar.emoji.oyun: "*"} \`VK` : "",
      ]

      message.channel.send({
        embeds: [embed.setDescription(`
${message.guild.emojiGöster(emojiler.Terfi)} ${ayarlar.serverName} sunucusunda ki özelleştirilebilir rol/buton/seçenek listesi.

\` ❯ \` **Burçlar** \`(${burclar.filter(x => x).length}/${burclar.length})\`
${burclar.filter(x => x).join("\n")}
\` ❯ \` **İlişki Durumları** \`(${iliskiler.filter(x => x).length}/${iliskiler.length})\`
${iliskiler.filter(x => x).join("\n")}
\` ❯ \` **Renkler** \`(${renkler.filter(x => x).length}/${renkler.length})\`
${renkler.filter(x => x).join("\n")}
\` ❯ \` **Oyun Rolleri** \`(${oyunlar.filter(x => x).length}/${oyunlar.length})\`
${oyunlar.filter(x => x).join("\n")}
\` ❯ \` **Diğer**
${buttons.bestFriendRolü ? `\`${ayarlar.emoji ? ayarlar.emoji.diğer: "*"} \`Best Friend` : ""}

`)],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("seçenekler").setLabel("Seçenekler").setStyle(ButtonStyle.Primary)
          )
        ]
      }).then(x => setTimeout(() => {
        x.delete().catch(err => {});
      }, 7500));
    }
    if (secim == "ayar") {
      let secim = args[1]
      if (!args[1]) return message.channel.send({
        embeds: [embed.setDescription(`${message.guild.emojiGöster(emojiler.Iptal)} **Seçenek Ayar**

\` ${sistem.a_prefix}seçenek ayar [özellik]\`

**Örnek Özellikler:**
${özellikler.map(x => `\` • \`${x.name}`).join("\n")}
`)]
      }).then(x => setTimeout(() => {
        x.delete().catch(err => {});
      }, 7500));
      if (secim == "sil") {
        let ozellik = özellikler.find(o => o.name.toLowerCase() === args[2].toLowerCase());
        if (!ozellik) return message.channel.send({
          embeds: [embed.setDescription(`${message.guild.emojiGöster(emojiler.Iptal)} **${args[2]}** isimli bir özellik bulunamadı.`)]
        }).then(x => setTimeout(() => {
          x.delete().catch(err => {});
        }, 7500));
        await GUILD_SETTINGS.findOneAndUpdate({
          guildID: message.guild.id
        }, {
          $set: {
            [`Ayarlar.Buttons.${ozellik.name}`]: ""
          }
        }, {
          upsert: true
        }).catch(e => console.log(e))
        message.channel.send({
          embeds: [embed.setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla **${başHarfBüyült(ozellik.name)}** isimli seçenek ayar rolü başarıyla sunucu ayarlarından kaldırıldı.`)]
        })
        return message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay) : undefined)
      }
      if (secim == "panel") {
        message.channel.send({
          embeds: [embed.setDescription(`Aşağıda ki düğmeyi kullanarak kendinize rol alabilirsiniz.`)],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("kullaniciPanel").setLabel("Kullanıcı Paneli").setStyle(ButtonStyle.Secondary)
            )
          ]
        }).then(x => {
          var filter = (i) => i.user.id == message.member.id
          let collector = x.createMessageComponentCollector({
            filter: filter,
            time: 60000
          })

          collector.on('collect', async (i) => {
            if (i.customId == "kullaniciPanel") {
              let Database = await GUILD_SETTINGS.findOne({
                guildID: i.guild.id
              })
              let buttons = Database.Ayarlar.Buttons || {}
              const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                .setCustomId("kpaneli")
                .setPlaceholder("Aşağıdan Kendinize Ait Bilgileri Seçin!")
                .addOptions([
                  {
                    label: "Sunucuya Katılma Tarihi",
                    description: "Sunucuya Katılma Tarihini Gösterir.",
                    value: "I",
                  },
                  {
                    label: "Üstümde ki Rol(ler)",
                    description: "Üstünüzde Bulunan Rolleri Gösterir.",
                    value: "II",
                  },
                  {
                    label: "Hesap Oluşturma Tarihi",
                    description: "Hesap Oluşturma Tarihinizi Gösterir.",
                    value: "III",
                  },
                  {
                    label: "Davet Bilgilerim",
                    description: "Sunucudaki Davet Bilgilerini Gösterir.",
                    value: "IV",
                  },
                  {
                    label: "Ceza Puanım",
                    description: "Sunucudaki Ceza Puanınızı Gösterir.",
                    value: "V",
                  },
                  {
                    label: "Sunucu Bilgisi",
                    description: "Sunucunun Bilgilerini Gösterir.",
                    value: "VI",
                  },
                  {
                    label: "İsim Geçmişim",
                    description: "Sunucudaki İsim Geçmişini Gösterir.",
                    value: "VII",
                  },
                  {
                    label: "İstatistiklerim",
                    description: "Sunucudaki İstatistiklerinizi Gösterir.",
                    value: "VIII",
                  },
                  {
                    label: "İsim Düzenleme",
                    description: "Sunucudaki İsminizi Düzenlersiniz. (Boost veya Taglı Şart)",
                    value: "isimGuncelleme",
                  },
                  {
                    label: "Rol Sıfırlama",
                    description: "Üzerinizdeki Etkinlik, Oyun ve Diğer Rolleri Sıfırlar.",
                    value: "XX",
                  },
                ]),
            );

            i.reply({
              embeds: [new genEmbed().setDescription(`Aşağıdaki menüden kendinize ait bilgileri ve yönetim panellerini görüntüleyebilirsiniz.`)],
              components: [row],
              ephemeral: true
            })
          }})

          collector.on('end', collected => {
            x.delete().catch(err => {})
          });
        })
      }
      if (secim == "etiketle") {
        let menu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
          .setCustomId("etkinliks")
          .setPlaceholder("Etkinlik Rolleri")
          .setMinValues(0)
          .setMaxValues(2)
          .addOptions([
            {
              label: "Etkinlik Katılımcısı",
              value: "etkinlik",
              emoji: {
                "id": ayarlar.emoji.etkinlik ? ayarlar.emoji.etkinlik.split(':')[2].replace('>', '') : undefined,
                "name": ayarlar.emoji.etkinlik ? ayarlar.emoji.etkinlik.split(':')[1] : undefined
              },
            },
            {
              label: "Çekiliş Katılımcısı",
              value: "cekilis",
              emoji: {
                "id": ayarlar.emoji.cekilis ? ayarlar.emoji.cekilis.split(':')[2].replace('>', '') : undefined,
                "name": ayarlar.emoji.cekilis ? ayarlar.emoji.cekilis.split(':')[1] : undefined
              },
            },
          ]),
        );
        message.channel.send({
          embeds: [embed.setDescription(`Aşağıda ki menüden kendinize sunucu etkinliklerinden ve çekilişlerinden haberdar olmak için rol alabilirsiniz.`)],
          components: [menu]
        }).then(x => {
          var filter = (i) => i.user.id == message.member.id
          let collector = x.createMessageComponentCollector({
            filter: filter,
            time: 60000
          })

          collector.on('end', collected => {
            x.delete().catch(err => {})
          });
        })
      }
      if (secim == "seçenek") {
        let Database = await GUILD_SETTINGS.findOne({
          guildID: message.guild.id
        })
        let buttons = Database.Ayarlar.Buttons || {}
        let secenekler = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
          .setCustomId("seçenekler")
          .setPlaceholder("Aşağıdan Rol Seçiniz!")
          .addOptions([
            {
              label: "Renk Rolleri",
              description: "Aşağıdan kendinize renk rolü seçebilirsiniz.",
              value: "renkler",
            },
            {
              label: "İlişki Rolleri",
              description: "Aşağıdan kendinize ilişki rolü seçebilirsiniz.",
              value: "iliski",
            },
            {
              label: "Oyun Rolleri",
              description: "Aşağıdan kendinize oyun rolü seçebilirsiniz.",
              value: "oyun",
            },
            {
              label: "Burç Rolleri",
              description: "Aşağıdan kendinize burç rolü seçebilirsiniz.",
              value: "burç",
            },
          ]),
        );

        message.channel.send({
          embeds: [embed.setDescription(`Aşağıda ki menüden kendinize rol alabilirsiniz.`)],
          components: [secenekler]
        }).then(x => {
          var filter = (i) => i.user.id == message.member.id
          let collector = x.createMessageComponentCollector({
            filter: filter,
            time: 60000
          })

          collector.on('collect', async (i) => {
            let secim = i.values[0]
            if (secim == "renkler") {
              const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                .setCustomId("renks")
                .setPlaceholder("Aşağıdan kendinize renk rolü seçiniz.")
                .addOptions([
                  buttons.kırmızı ? {
                    label: 'Kırmızı',
                    description: 'Kırmızı rengini seçmek için tıkla!',
                    value: 'kirmizi',
                  } : {
                    label: 'Kırmızı',
                    description: 'Kırmızı rengi ayarlanmamış!',
                    value: 'kirmizi',
                    default: true
                  },
                  buttons.turuncu ? {
                    label: 'Turuncu',
                    description: 'Turuncu rengini seçmek için tıkla!',
                    value: 'turuncu',
                  } : {
                    label: 'Turuncu',
                    description: 'Turuncu rengi ayarlanmamış!',
                    value: 'turuncu',
                    default: true
                  },
                  buttons.mavi ? {
                    label: 'Mavi',
                    description: 'Mavi rengini seçmek için tıkla!',
                    value: 'mavi',
                  } : {
                    label: 'Mavi',
                    description: 'Mavi rengi ayarlanmamış!',
                    value: 'mavi',
                    default: true
                  },
                  buttons.mor ? {
                    label: 'Mor',
                    description: 'Mor rengini seçmek için tıkla!',
                    value: 'mor',
                  } : {
                    label: 'Mor',
                    description: 'Mor rengi ayarlanmamış!',
                    value: 'mor',
                    default: true
                  },
                  buttons.pembe ? {
                    label: 'Pembe',
                    description: 'Pembe rengini seçmek için tıkla!',
                    value: 'pembe',
                  } : {
                    label: 'Pembe',
                    description: 'Pembe rengi ayarlanmamış!',
                    value: 'pembe',
                    default: true
                  },
                  buttons.beyaz ? {
                    label: 'Beyaz',
                    description: 'Beyaz rengini seçmek için tıkla!',
                    value: 'beyaz',
                  } : {
                    label: 'Beyaz',
                    description: 'Beyaz rengi ayarlanmamış!',
                    value: 'beyaz',
                    default: true
                  },
                  buttons.yeşil ? {
                    label: 'Yeşil',
                    description: 'Yeşil rengini seçmek için tıkla!',
                    value: 'yeşil',
                  } : {
                    label: 'Yeşil',
                    description: 'Yeşil rengi ayarlanmamış!',
                    value: 'yeşil',
                    default: true
                  },
                  buttons.sarı ? {
                    label: 'Sarı',
                    description: 'Sarı rengini seçmek için tıkla!',
                    value: 'sarı',
                  } : {
                    label: 'Sarı',
                    description: 'Sarı rengi ayarlanmamış!',
                    value: 'sarı',
                    default: true
                  },
                  buttons.siyah ? {
                    label: 'Siyah',
                    description: 'Siyah rengini seçmek için tıkla!',
                    value: 'siyah',
                  } : {
                    label: 'Siyah',
                    description: 'Siyah rengi ayarlanmamış!',
                    value: 'siyah',
                    default: true
                  },
                  {
                    label: "Rolü Kaldır",
                    description: "Üzerinizdeki renk rolünü kaldırmak için tıkla.",
                    value: "rolsil",
                  },

                ])
              );
              i.reply({
                embeds: [new genEmbed().setDescription(`Aşağıdan **Renk** rollerinden birini seçerek anında alabilirsiniz.`)],
                components: [row],
                ephemeral: true
              })

            }
            if (secim == "iliski") {
              const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                .setCustomId("valantines")
                .setPlaceholder("Aşağıdan kendinize ilişki rolü seçiniz.")
                .addOptions([
                  buttons.lovers ? {
                    label: 'Lovers',
                    description: 'Lovers rolünü seçmek için tıkla!',
                    value: 'couple',
                    emoji: {
                      id: ayarlar.emoji.iliskidurumu ? ayarlar.emoji.iliskidurumu.split(':')[2].replace('>', '') : undefined,
                      name: ayarlar.emoji.iliskidurumu ? ayarlar.emoji.iliskidurumu.split(':')[1] : undefined
                    },
                  } : {
                    label: 'Lovers',
                    description: 'Lovers rolü ayarlanmamış!',
                    value: 'couple',
                    default: true
                  },
                  buttons.alone ? {
                    label: 'Alone',
                    description: 'Alone rolünü seçmek için tıkla!',
                    value: 'single',
                    emoji: {
                      id: ayarlar.emoji.iliskidurumu ? ayarlar.emoji.iliskidurumu.split(':')[2].replace('>', '') : undefined,
                      name: ayarlar.emoji.iliskidurumu ? ayarlar.emoji.iliskidurumu.split(':')[1] : undefined
                    },
                  } : {
                    label: 'Alone',
                    description: 'Alone rolü ayarlanmamış!',
                    value: 'single',
                    default: true
                  },
                  {
                    label: "Rolü Kaldır",
                    description: "Üzerinizdeki ilişki rolünü kaldırmak için tıkla.",
                    value: "rolsil",
                  },
                ])
              );
              i.reply({
                embeds: [new genEmbed().setDescription(`Aşağıdan **İlişki** rollerinden birini seçerek anında alabilirsiniz.`)],
                components: [row],
                ephemeral: true
              })
            }
            if (secim == "oyun") {
              const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                .setCustomId("games")
                .setPlaceholder("Aşağıdan kendinize oyun rolü seçiniz.")
                .setMinValues(0)
                .setMaxValues(10)
                .addOptions([
                  buttons.lol ? {
                    label: "League of Legends",
                    value: "lol"
                  } : {
                    label: "League of Legends (Ayarlanmamış)",
                    value: "lol",
                    default: true
                  },
                  buttons.csgo ? {
                    label: "Counter Strike: Global Offensive",
                    value: "csgo"
                  } : {
                    label: "Counter Strike: Global Offensive (Ayarlanmamış)",
                    value: "csgo",
                    default: true
                  },
                  buttons.minecraft ? {
                    label: "Minecraft",
                    value: "minecraft"
                  } : {
                    label: "Minecraft (Ayarlanmamış)",
                    value: "minecraft",
                    default: true
                  },
                  buttons.valorant ? {
                    label: "Valorant",
                    value: "valorant"
                  } : {
                    label: "Valorant (Ayarlanmamış)",
                    value: "valorant",
                    default: true
                  },
                  buttons.fortnite ? {
                    label: "Fortnite",
                    value: "fortnite"
                  } : {
                    label: "Fortnite (Ayarlanmamış)",
                    value: "fortnite",
                    default: true
                  },
                  buttons.gta5 ? {
                    label: "Grand Theft Auto V",
                    value: "gta5"
                  } : {
                    label: "Grand Theft Auto V (Ayarlanmamış)",
                    value: "gta5",
                    default: true
                  },
                  buttons.pubg ? {
                    label: "PlayerUnknown's Battlegrounds",
                    value: "pubg"
                  } : {
                    label: "PlayerUnknown's Battlegrounds (Ayarlanmamış)",
                    value: "pubg",
                    default: true
                  },
                  buttons.wildrift ? {
                    label: "League of Legends: Wild Rift",
                    value: "wildrift"
                  } : {
                    label: "League of Legends: Wild Rift (Ayarlanmamış)",
                    value: "wildrift",
                    default: true
                  },
                  buttons.mobilelegends ? {
                    label: "Mobile Legends",
                    value: "mobilelegends"
                  } : {
                    label: "Mobile Legends (Ayarlanmamış)",
                    value: "mobilelegends",
                    default: true
                  },
                  buttons.fivem ? {
                    label: "FiveM",
                    value: "fivem"
                  } : {
                    label: "FiveM (Ayarlanmamış)",
                    value: "fivem",
                    default: true
                  },
                ])
              );
              i.reply({
                embeds: [new genEmbed().setDescription(`Aşağıdan **Oyun** rollerinden birini seçerek anında alabilirsiniz.`)],
                components: [row],
                ephemeral: true
              })
            }
            if (secim == "burç") {
              const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                .setCustomId("horoscope")
                .setPlaceholder("Aşağıdan kendinize burç rolü seçiniz.")
                .addOptions([
                  buttons.oğlak ? {
                    label: 'Oğlak',
                    description: 'Oğlak burcunu seçmek için tıkla!',
                    value: 'oğlak',
                  } : {
                    label: 'Oğlak',
                    description: 'Oğlak burcu ayarlanmamış!',
                    value: 'oğlak',
                    default: true
                  },
                  buttons.kova ? {
                    label: 'Kova',
                    description: 'Kova burcunu seçmek için tıkla!',
                    value: 'kova',
                  } : {
                    label: 'Kova',
                    description: 'Kova burcu ayarlanmamış!',
                    value: 'kova',
                    default: true
                  },
                  buttons.balık ? {
                    label: 'Balık',
                    description: 'Balık burcunu seçmek için tıkla!',
                    value: 'balık',
                  } : {
                    label: 'Balık',
                    description: 'Balık burcu ayarlanmamış!',
                    value: 'balık',
                    default: true
                  },
                  buttons.koç ? {
                    label: 'Koç',
                    description: 'Koç burcunu seçmek için tıkla!',
                    value: 'koç',
                  } : {
                    label: 'Koç',
                    description: 'Koç burcu ayarlanmamış!',
                    value: 'koç',
                    default: true
                  },
                  buttons.boğa ? {
                    label: 'Boğa',
                    description: 'Boğa burcunu seçmek için tıkla!',
                    value: 'boğa',
                  } : {
                    label: 'Boğa',
                    description: 'Boğa burcu ayarlanmamış!',
                    value: 'boğa',
                    default: true
                  },
                  buttons.ikizler ? {
                    label: 'İkizler',
                    description: 'İkizler burcunu seçmek için tıkla!',
                    value: 'ikizler',
                  } : {
                    label: 'İkizler',
                    description: 'İkizler burcu ayarlanmamış!',
                    value: 'ikizler',
                    default: true
                  },
                  buttons.yengeç ? {
                    label: 'Yengeç',
                    description: 'Yengeç burcunu seçmek için tıkla!',
                    value: 'yengeç',
                  } : {
                    label: 'Yengeç',
                    description: 'Yengeç burcu ayarlanmamış!',
                    value: 'yengeç',
                    default: true
                  },
                  buttons.aslan ? {
                    label: 'Aslan',
                    description: 'Aslan burcunu seçmek için tıkla!',
                    value: 'aslan',
                  } : {
                    label: 'Aslan',
                    description: 'Aslan burcu ayarlanmamış!',
                    value: 'aslan',
                    default: true
                  },
                  buttons.başak ? {
                    label: 'Başak',
                    description: 'Başak burcunu seçmek için tıkla!',
                    value: 'başak',
                  } : {
                    label: 'Başak',
                    description: 'Başak burcu ayarlanmamış!',
                    value: 'başak',
                    default: true
                  },
                  buttons.terazi ? {
                    label: 'Terazi',
                    description: 'Terazi burcunu seçmek için tıkla!',
                    value: 'terazi',
                  } : {
                    label: 'Terazi',
                    description: 'Terazi burcu ayarlanmamış!',
                    value: 'terazi',
                    default: true
                  },
                  buttons.akrep ? {
                    label: 'Akrep',
                    description: 'Akrep burcunu seçmek için tıkla!',
                    value: 'akrep',
                  } : {
                    label: 'Akrep',
                    description: 'Akrep burcu ayarlanmamış!',
                    value: 'akrep',
                    default: true
                  },
                  buttons.yay ? {
                    label: 'Yay',
                    description: 'Yay burcunu seçmek için tıkla!',
                    value: 'yay',
                  } : {
                    label: 'Yay',
                    description: 'Yay burcu ayarlanmamış!',
                    value: 'yay',
                    default: true
                  },
                  {
                    label: "Rolü Kaldır",
                    description: "Üzerinizdeki burç rolünü kaldırmak için tıkla.",
                    value: "rolsil",
                  },
                ])
              );
              i.reply({
                embeds: [new genEmbed().setDescription(`Aşağıdan **Burç** rollerinden birini seçerek anında alabilirsiniz.`)],
                components: [row],
                ephemeral: true
              })
            }
          })

          collector.on('end', collected => {
            x.delete().catch(err => {})
          });
        })
      }
      let ozellik = özellikler.find(o => o.name.toLowerCase() === secim.toLowerCase());
      if (ozellik.type) {
        let rol = message.mentions.roles.first() || message.guild.roles.cache.get(args.splice(1)[0]) || message.guild.roles.cache.find(r => r.name === args.splice(1).join(' '));
        if (!rol) return message.channel.send({
          embeds: [embed.setDescription(`${message.guild.emojiGöster(emojiler.Iptal)} **${başHarfBüyült(ozellik.name)}** isimli seçenek ayarını hangi rol yapmamı istiyorsun?`)]
        }).then(x => setTimeout(() => {
          x.delete().catch(err => {});
        }, 7500));
        await GUILD_SETTINGS.findOneAndUpdate({
          guildID: message.guild.id
        }, {
          $set: {
            [`Ayarlar.Buttons.${ozellik.name}`]: rol.id
          }
        }, {
          upsert: true
        }).catch(e => console.log(e))
        message.channel.send({
          embeds: [embed.setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla **${başHarfBüyült(ozellik.name)}** isimli seçenek ayar rolü ${rol} olarak tanımladı.`)]
        })
        return message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay) : undefined)
      }
    
    }
  }
};