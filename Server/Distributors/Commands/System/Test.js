// Discord.js v14'e uygun import yapısı.
const { 
    Client, 
    Message, 
    Util, 
    ActionRowBuilder, // MessageActionRow -> ActionRowBuilder
    ButtonBuilder, // MessageButton -> ButtonBuilder
    SelectMenuBuilder, // MessageSelectMenu -> SelectMenuBuilder
    Collection, 
    PermissionsBitField, // Permissions -> PermissionsBitField
    ChannelType, // "GUILD_VOICE" -> ChannelType.GuildVoice, etc.
    ModalBuilder, // Modal -> ModalBuilder
    TextInputBuilder, // TextInputComponent -> TextInputBuilder
    TextInputStyle // SHORT -> TextInputStyle.Short, etc.
} = Discord = require("discord.js"); 

const { genEmbed } = require("../../../../Global/İnit/Embed.js");
const voiceCollection = new Collection()
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');
const Users = require('../../../../Global/Databases/Client.Users');
const Private = require('../../../../Global/Databases/Guild.Private.Rooms.js');
const {VoiceChannels, TextChannels, CategoryChannels, Roles} = require("../../../../Global/Databases/Guild.Sync");
let vkKategori = "1008826074592968779"
let dcKategori = "1008826046105260113"
let aktiviteKategori = "964168000997572678"

// discord-modals kütüphanesini V14 uyumlu olacak şekilde çağırıyoruz.
const { showModal } = dcmodal = require('discord-modals') 

module.exports = {
    Isim: "komut",
    Komut: ["komutcuk","özeloda"],
    Kullanim: "",
    Aciklama: "",
    Kategori: "-",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) {
    client.on('interactionCreate', async i => {

        // ChannelType sabitleri kullanıldı.
        let konser = client.channels.cache.find(x => x.type == ChannelType.GuildCategory && x.name.includes("Konser") || x.name.includes("KONSER"))
        let etkınlik = client.channels.cache.find(x => x.type == ChannelType.GuildCategory && x.name.includes("Etkinlik") || x.name.includes("ETKİNLİK") || x.name.includes("Etkinlık") || x.name.includes("ETKINLIK"))
        vkKategori = etkınlik ? etkınlik.id : undefined
        dcKategori = konser ? konser.id : undefined
   
      // MessageActionRow -> ActionRowBuilder
      // MessageSelectMenu -> SelectMenuBuilder
      let Row = new ActionRowBuilder().addComponents(
        new SelectMenuBuilder()
        .setCustomId("acaryöneticipaneli")
        .setPlaceholder("Yönetici işlemleri şunlardır...")
        .addOptions( // setOptions yerine addOptions metodu kullanıldı.
            {label: "Sunucu Güncelle", emoji: {id: "963745852327886888"}, description: "Sunucu üzerinde herhangi bir değişiklik yapabilirsiniz.", value: "sunucuduzenle"},
            {label: "Rolsüz Ver", emoji: {id: "963745852327886888"}, description: "Sunucu üzerinde rolü bulunmayanlara kayıtsız vermeyi sağlar.", value: "rolsüzver"},
            {label: "Özel Karakter Temizle", emoji: {id: "963745852327886888"}, description: "Sunucu üzerinde isminde ünlem, sembol vs. bulunanları temizler.",value: "özelkarakter"},
            {label: "Etkinlik & Çekiliş Katılımcısı Dağıt", emoji: {id: "963745852327886888"}, description: "Sunucu üzerinde, üstünde katılımcı rolleri bulunmayanlara dağıtır.", value: "etkinlikçekilişdağıt"},
            {label: "Public Senkronizasyon", emoji: {id: "963745852327886888"}, description: "Sunucu üzerinde değişiklikleri, tekrardan senkronize eder." ,value: "syncpublic"},
            {label: "Streamer Senkronizasyon", emoji: {id: "963745852327886888"}, description: "Sunucu üzerinde değişiklikleri, tekrardan senkronize eder." ,value: "syncstreamer"},
            {label: "Teyit Senkronizasyon", emoji: {id: "963745852327886888"}, description: "Sunucu üzerinde değişiklikleri, tekrardan senkronize eder." ,value: "syncregister"},
            {label: "Sorun Çözme Senkronizasyon", emoji: {id: "963745852327886888"}, description: "Sunucu üzerinde değişiklikleri, tekrardan senkronize eder." ,value: "syncsç"},
            {label: "Diğer Senkronizasyon", emoji: {id: "963745852327886888"}, description: "Sunucu üzerinde değişiklikleri, tekrardan senkronize eder." ,value: "syncother"},
            {label: "Genel Senkronizasyon", emoji: {id: "963745852327886888"}, description: "Sunucu üzerinde değişiklikleri, tekrardan senkronize eder." ,value: "syncguild"},
        )
      )
      let everyone = i.guild.roles.everyone
      // MessageActionRow -> ActionRowBuilder
      // MessageButton -> ButtonBuilder
      // Style dize değerleri yerine sayısal değerler veya sabitler (1: Primary, 2: Secondary, 3: Success, 4: Danger)
      let RowTwo = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setLabel(`Etkinlik Odası (${i.guild.kanalBul(vkKategori).permissionsFor(everyone).has('VIEW_CHANNEL') ? "Gösterme" : "Göster"})`)
        .setCustomId("vkgoster")
        .setStyle(i.guild.kanalBul(vkKategori).permissionsFor(everyone).has('VIEW_CHANNEL') ? 2 : 1), // SECONDARY -> 2, PRIMARY -> 1
        new ButtonBuilder()
        .setLabel(`Konser Odası (${i.guild.kanalBul(dcKategori).permissionsFor(everyone).has('VIEW_CHANNEL') ? "Gösterme" : "Göster"})`)
        .setCustomId("konsergoster")
        .setStyle(i.guild.kanalBul(dcKategori).permissionsFor(everyone).has('VIEW_CHANNEL') ? 2 : 1), // SECONDARY -> 2, PRIMARY -> 1
  
      )
        let author = i.guild.members.cache.get(i.user.id)
        if(!author) return i.deferUpdate().catch(err => {});

        // İzin kontrolü için PermissionsBitField.Flags kullanıldı.
        const isAdmin = (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => author.roles.cache.has(oku))) || author.permissions.has(PermissionsBitField.Flags.Administrator);
        const isEtkinlikSorumlusu = (roller.etkinlikSorumlusu && roller.etkinlikSorumlusu.some(oku => author.roles.cache.has(oku))) || isAdmin;

        if(i.customId == "vkgoster") {
          if(!isEtkinlikSorumlusu) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true})
          let kategori = i.guild.channels.cache.get(vkKategori)
          if(!kategori) i.reply({content: `${cevaplar.prefix} Sistem hatası oluştu, lütfen bot sahibi ile iletişime geçin.`, ephemeral: true})
          let everyone = i.guild.roles.everyone
          if (kategori.permissionsFor(everyone).has(PermissionsBitField.Flags.ViewChannel)) { // Sabit kullanıldı
            await kategori.permissionOverwrites.edit(everyone.id, { VIEW_CHANNEL: false });
            await kategori.setPosition(13).catch(err => {})
            i.guild.channels.cache.filter(x => x.parentId == kategori.id).map(async (x) => {
                await x.permissionOverwrites.edit(everyone.id, { VIEW_CHANNEL: false });
            })
            author.Leaders("etkinlik", 1, {type: "ETKINLIK"})
            RowTwo.components[0].setStyle(1).setLabel(`Etkinlik Odası (Göster)`) // PRIMARY -> 1
            i.update({components: [Row, RowTwo]})
          } else {
            await kategori.permissionOverwrites.edit(everyone.id, { VIEW_CHANNEL: true });
            await kategori.setPosition(0)
            i.guild.channels.cache.filter(x => x.parentId == kategori.id && !x.name.includes("yönetim")).map(async (x) => {
              await x.permissionOverwrites.edit(everyone.id, { VIEW_CHANNEL: true });
            })
            RowTwo.components[0].setStyle(2).setLabel(`Etkinlik Odası (Gösterme)`) // SECONDARY -> 2
            i.update({components: [Row, RowTwo]})
          }
        }
        if(i.customId == "konsergoster") {
          if(!isEtkinlikSorumlusu) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true})
          let kategori = i.guild.channels.cache.get(dcKategori)
          if(!kategori) i.reply({content: `${cevaplar.prefix} Sistem hatası oluştu, lütfen bot sahibi ile iletişime geçin.`, ephemeral: true})
          let everyone = i.guild.roles.everyone
          if (kategori.permissionsFor(everyone).has(PermissionsBitField.Flags.ViewChannel)) { // Sabit kullanıldı
            await kategori.permissionOverwrites.edit(everyone.id, { VIEW_CHANNEL: false });
            await kategori.setPosition(13).catch(err => {})
            i.guild.channels.cache.filter(x => x.parentId == kategori.id).map(async (x) => {
                await x.permissionOverwrites.edit(everyone.id, { VIEW_CHANNEL: false });
            })
            author.Leaders("etkinlik", 1, {type: "KONSER"})
            RowTwo.components[1].setStyle(1).setLabel(`Konser Odası (Göster)`) // PRIMARY -> 1
            i.update({components: [Row, RowTwo]})
          } else {
            await kategori.permissionOverwrites.edit(everyone.id, { VIEW_CHANNEL: true });
            await kategori.setPosition(0)
            i.guild.channels.cache.filter(x => x.parentId == kategori.id && !x.name.includes("yönetim")).map(async (x) => {
              await x.permissionOverwrites.edit(everyone.id, { VIEW_CHANNEL: true });
            })
            RowTwo.components[1].setStyle(2).setLabel(`Konser Odası (Gösterme)`) // SECONDARY -> 2
            i.update({components: [Row, RowTwo]})
          }
        }
        if (!i.isSelectMenu()) return;
        let Data = await GUILDS_SETTINGS.findOne({ _id: 1 })
        let uye = i.guild.members.cache.get(i.user.id)
        ayarlar = Data.Ayarlar
        if (i.customId === 'acaryöneticipaneli') {
          if(i.values[0] == "sunucuduzenle") {
            // Modal -> ModalBuilder, TextInputComponent -> TextInputBuilder, STYLE dize -> TextInputStyle sabiti
            const modal = new ModalBuilder()
            .setCustomId('sunucuDüzenleme')
            .setTitle(`Sunucu Güncelle!`);
            
            // Her TextInputComponent'ı bir ActionRowBuilder içine sarmak V14 kuralıdır.
            const nameComponent = new TextInputBuilder()
              .setCustomId('name')
              .setLabel('Sunucu İsmi')
              .setStyle(TextInputStyle.Short) // 'SHORT' -> TextInputStyle.Short
              .setMinLength(3)
              .setMaxLength(120)
              .setPlaceholder(`${i.guild.name}`)
              .setRequired(false);

            const avatarComponent = new TextInputBuilder()
              .setCustomId('avatar')
              .setLabel('Sunucu Resmi')
              .setStyle(TextInputStyle.Short) // 'SHORT' -> TextInputStyle.Short
              .setMinLength(3)
              .setMaxLength(300)
              .setPlaceholder(`${i.guild.iconURL({dynamic: true, format: "png"})}`)
              .setRequired(false);
            
            const bannerComponent = new TextInputBuilder()
              .setCustomId('banner')
              .setLabel('Sunucu Arkaplan')
              .setStyle(TextInputStyle.Short) // 'SHORT' -> TextInputStyle.Short
              .setMinLength(3)
              .setMaxLength(300)
              .setPlaceholder(`${i.guild.bannerURL({dynamic: true, format: "png"})}`)
              .setRequired(false);
              
            modal.addComponents(
                new ActionRowBuilder().addComponents(nameComponent),
                new ActionRowBuilder().addComponents(avatarComponent),
                new ActionRowBuilder().addComponents(bannerComponent)
            );

            if((roller.kurucuRolleri && !roller.kurucuRolleri.some(oku => uye.roles.cache.has(oku))) && !uye.permissions.has(PermissionsBitField.Flags.Administrator)) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true}) // Permissions -> PermissionsBitField.Flags
            
            showModal(modal, {
              client: client,
              interaction: i 
            })
          }
          if(i.values[0] == "rolsüzver") {
            if((roller.kurucuRolleri && !roller.kurucuRolleri.some(oku => uye.roles.cache.has(oku))) && !uye.permissions.has(PermissionsBitField.Flags.Administrator)) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true})
            let rolsuzuye =  i.guild.members.cache.filter(m => m.roles.cache.filter(r => r.id !== i.guildId).size == 0);
            rolsuzuye.forEach(roluolmayanlar => { 
                roller.kayıtsızRolleri.some(x => roluolmayanlar.roles.add(x).catch(err => {})) 
            });
            await i.reply({content: `Başarıyla sunucuda rolü olmayan **${rolsuzuye.size}** üyeye kayıtsız rolü verilmeye başlandı! ${i.guild.emojiGöster(emojiler.Onay)}`, ephemeral: true})
          }
          if(i.values[0] == "tagsizver") {
            if((roller.kurucuRolleri && !roller.kurucuRolleri.some(oku => uye.roles.cache.has(oku))) && !uye.permissions.has(PermissionsBitField.Flags.Administrator)) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true})
            let guild = client.guilds.cache.get(i.guildId)
            if(!guild) return await i.reply({content: `${cevaplar.prefix} Bulunduğunuz sunucu Outage'e düştüğünden dolayı işlem iptal edildi.`, ephemeral: true})
            let tagsizuye = guild.members.cache.filter(m => m.user.username.includes(ayarlar.tag) && !m.roles.cache.has(roller.tagRolü) && !m.roles.cache.has(roller.şüpheliRolü) && !m.roles.cache.has(roller.yasaklıTagRolü) &&  !m.roles.cache.has(roller.jailRolü) && !roller.kayıtsızRolleri.some(x => m.roles.cache.has(x)))
            tagsizuye.forEach(roluolmayanlar => { 
              roluolmayanlar.roles.add(roller.tagRolü).catch(err => {})
              roluolmayanlar.setNickname(roluolmayanlar.displayName.replace(ayarlar.tagsiz, ayarlar.tag)).catch(err => {})
            });
            let rollütagsiz = guild.members.cache.filter(m => m.roles.cache.has(roller.tagRolü) && !m.user.username.includes(ayarlar.tag) && !m.roles.cache.has(roller.şüpheliRolü) && !m.roles.cache.has(roller.yasaklıTagRolü) && !m.roles.cache.has(roller.jailRolü) && !roller.kayıtsızRolleri.some(x => m.roles.cache.has(x)))
            rollütagsiz.forEach(rl => {
                rl.setNickname(rl.displayName.replace(ayarlar.tag, ayarlar.tagsiz)).catch(err => {})
                rl.roles.remove(roller.tagRolü).catch(err => {})
            });
            await i.reply({content: `Başarıyla taglı olup rolü olmayan **${tagsizuye.size}** üyeye taglı rolü verildi, ve tagsız **${rollütagsiz.size}** üyeden geri alınmaya başlandı! ${i.guild.emojiGöster(emojiler.Onay)}`, ephemeral: true})
          } 
          if(i.values[0] == "etkinlikçekilişdağıt") {
            if((roller.kurucuRolleri && !roller.kurucuRolleri.some(oku => uye.roles.cache.has(oku))) && !uye.permissions.has(PermissionsBitField.Flags.Administrator)) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true})
            let olmayanlar = i.guild.members.cache.filter(x => x && !x.user.bot && (!x.roles.cache.has(roller.etkinlikKatılımcısı) || !x.roles.cache.has(roller.cekilisKatılımcısı)))
            var filter = (member) => member && !member.user.bot && (!member.roles.cache.has(roller.etkinlikKatılımcısı) || !member.roles.cache.has(roller.cekilisKatılımcısı))
            //siktirgit oç
            await i.reply({content: `Başarıyla **${olmayanlar.size}** üyeye **Etkinlik & Çekiliş** katılımcısı dağıtılmaya başlandı! ${i.guild.emojiGöster(emojiler.Onay)} `, ephemeral: true})
          }
          if(i.values[0] == "özelkarakter") {
            if((roller.kurucuRolleri && !roller.kurucuRolleri.some(oku => uye.roles.cache.has(oku))) && !uye.permissions.has(PermissionsBitField.Flags.Administrator)) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true})
            let ünlemliler = i.guild.members.cache.filter(x => x && !x.user.bot && (x.displayName.includes("!") || x.displayName.includes("!!") || x.displayName.includes("!!!") || 
            x.displayName.includes("-") || x.displayName.includes("+") || x.displayName.includes("'") || x.displayName.includes("^")))
            ünlemliler.forEach(async (uye) => {
              await uye.setNickname(uye.displayName.replace("!","").replace("!!","").replace("!!!","").replace("-","").replace("+","").replace("'","").replace("^", "")).catch(err => {})
            })
            await i.reply({content: `Başarıyla **${ünlemliler.size}** üyenin üzerindeki \`Boşluk, Ünlem vs..\` temizlenmeye başlandı! ${i.guild.emojiGöster(emojiler.Onay)} `, ephemeral: true})
          }

          // Kanal Senkronizasyonları (type ve parentId güncellemeleri)
          if(i.values[0] == "syncpublic") {
            if((roller.kurucuRolleri && !roller.kurucuRolleri.some(oku => uye.roles.cache.has(oku))) && !uye.permissions.has(PermissionsBitField.Flags.Administrator)) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true})
            i.reply({content: `${i.guild.emojiGöster(emojiler.Onay)} Başarıyla tüm public(**${i.guild.channels.cache.filter(x => x.parentId && x.parentId == kanallar.publicKategorisi && x.type == ChannelType.GuildVoice).size}** kanal) ses kanalları senkronize olmaya başladı. Bu işlem biraz uzun sürebilir...`, ephemeral: true})
            i.guild.channels.cache.filter(x => x.parentId && x.parentId == kanallar.publicKategorisi && x.type == ChannelType.GuildVoice).map(async (x) => {
              if(x.type == ChannelType.GuildVoice) { // type: "GUILD_VOICE" -> ChannelType.GuildVoice
                let data = await VoiceChannels.findOne({ channelID: x.id })
                if(data) {
                  return x.edit({
                    name: data.name,
                    bitrate: data.bitrate,
                    parent: data.parentID, // parentId -> parent
                    userLimit: data.userLimit ? data.userLimit : 0,
                  }).catch(err => {})
                }
              }
            })
          }
          if(i.values[0] == "syncother") {
            if((roller.kurucuRolleri && !roller.kurucuRolleri.some(oku => uye.roles.cache.has(oku))) && !uye.permissions.has(PermissionsBitField.Flags.Administrator)) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true})
            i.reply({content: `${i.guild.emojiGöster(emojiler.Onay)} Başarıyla diğer tüm (**${i.guild.channels.cache.filter(x => x.parentId && x.parentId != kanallar.publicKategorisi && x.parentId != kanallar.registerKategorisi && x.parentId !=  kanallar.streamerKategorisi && x.parentId != kanallar.sorunCozmeKategorisi && x.type == ChannelType.GuildVoice).size}** kanal) ses kanalları senkronize olmaya başladı. Bu işlem biraz uzun sürebilir...`, ephemeral: true})
            i.guild.channels.cache.filter(x => x.parentId && x.parentId != kanallar.publicKategorisi && x.parentId != kanallar.registerKategorisi && x.parentId !=  kanallar.streamerKategorisi && x.parentId != kanallar.sorunCozmeKategorisi && x.type == ChannelType.GuildVoice).map(async (x) => {
              if(x.type == ChannelType.GuildVoice) {
                let data = await VoiceChannels.findOne({ channelID: x.id })
                if(data) {
                  return x.edit({
                    name: data.name,
                    bitrate: data.bitrate,
                    parent: data.parentID, // parentId -> parent
                    userLimit: data.userLimit ? data.userLimit : 0,
                  }).catch(err => {})
                }
              }
            })
          }
          if(i.values[0] == "syncsç") {
            if((roller.kurucuRolleri && !roller.kurucuRolleri.some(oku => uye.roles.cache.has(oku))) && !uye.permissions.has(PermissionsBitField.Flags.Administrator)) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true})
            i.reply({content: `${i.guild.emojiGöster(emojiler.Onay)} Başarıyla tüm sorun çözme(**${i.guild.channels.cache.filter(x => x.parentId && x.parentId == kanallar.sorunCozmeKategorisi && x.type == ChannelType.GuildVoice).size}** kanal) ses kanalları senkronize olmaya başladı. Bu işlem biraz uzun sürebilir...`, ephemeral: true})
            i.guild.channels.cache.filter(x => x.parentId && x.parentId == kanallar.sorunCozmeKategorisi && x.type == ChannelType.GuildVoice).map(async (x) => {
              if(x.type == ChannelType.GuildVoice) {
                let data = await VoiceChannels.findOne({ channelID: x.id })
                if(data) {
                  return x.edit({
                    name: data.name,
                    bitrate: data.bitrate,
                    parent: data.parentID, // parentId -> parent
                    userLimit: data.userLimit ? data.userLimit : 0,
                  }).catch(err => {})
                }
              }
            })
          }
          if(i.values[0] == "syncregister") {
            if((roller.kurucuRolleri && !roller.kurucuRolleri.some(oku => uye.roles.cache.has(oku))) && !uye.permissions.has(PermissionsBitField.Flags.Administrator)) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true})
            i.reply({content: `${i.guild.emojiGöster(emojiler.Onay)} Başarıyla tüm teyit(**${i.guild.channels.cache.filter(x => x.parentId && x.parentId == kanallar.registerKategorisi && x.type == ChannelType.GuildVoice).size}** kanal) ses kanalları senkronize olmaya başladı. Bu işlem biraz uzun sürebilir...`, ephemeral: true})
            i.guild.channels.cache.filter(x => x.parentId && x.parentId == kanallar.registerKategorisi && x.type == ChannelType.GuildVoice).map(async (x) => {
              if(x.type == ChannelType.GuildVoice) {
                let data = await VoiceChannels.findOne({ channelID: x.id })
                if(data) {
                  return x.edit({
                    name: data.name,
                    bitrate: data.bitrate,
                    parent: data.parentID, // parentId -> parent
                    userLimit: data.userLimit ? data.userLimit : 0,
                  }).catch(err => {})
                }
              }
            })
          }
          if(i.values[0] == "syncstreamer") {
            if((roller.kurucuRolleri && !roller.kurucuRolleri.some(oku => uye.roles.cache.has(oku))) && !uye.permissions.has(PermissionsBitField.Flags.Administrator)) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true})
            i.reply({content: `${i.guild.emojiGöster(emojiler.Onay)} Başarıyla tüm yayıncı (**${i.guild.channels.cache.filter(x => x.parentId && x.parentId == kanallar.streamerKategorisi && x.type == ChannelType.GuildVoice).size}** kanal) ses kanalları senkronize olmaya başladı. Bu işlem biraz uzun sürebilir...`, ephemeral: true})
            i.guild.channels.cache.filter(x => x.parentId && x.parentId == kanallar.streamerKategorisi && x.type == ChannelType.GuildVoice).map(async (x) => {
              if(x.type == ChannelType.GuildVoice) {
                let data = await VoiceChannels.findOne({ channelID: x.id })
                if(data) {
                  return x.edit({
                    name: data.name,
                    bitrate: data.bitrate,
                    parent: data.parentID, // parentId -> parent
                    userLimit: data.userLimit ? data.userLimit : 0,
                  }).catch(err => {})
                }
              }
            })
          }
          if(i.values[0] == "syncguild") {
            if((roller.kurucuRolleri && !roller.kurucuRolleri.some(oku => uye.roles.cache.has(oku))) && !uye.permissions.has(PermissionsBitField.Flags.Administrator)) return await i.reply({content: `${cevaplar.prefix} Yeterli yetkiye sahip değilsin.`, ephemeral: true})
            i.reply({content: `${i.guild.emojiGöster(emojiler.Onay)} Başarıyla tüm sunucu ses kanalları (**${i.guild.channels.cache.filter(x => x.parentId && x.type == ChannelType.GuildVoice).size}** kanal)senkronize olmaya başladı. Bu işlem biraz uzun sürebilir...`, ephemeral: true})
            i.guild.channels.cache.filter(x => x.parentId && x.type == ChannelType.GuildVoice).map(async (x) => {
              if(x.type == ChannelType.GuildVoice) {
                let data = await VoiceChannels.findOne({ channelID: x.id })
                if(data) {
                  return x.edit({
                    name: data.name,
                    bitrate: data.bitrate,
                    parent: data.parentID, // parentId -> parent
                    userLimit: data.userLimit ? data.userLimit : 0,
                  }).catch(err => {})
                }
              }
            })
          }
        }

        async function filterDist(sunucu, filter) {
            let role = [roller.etkinlikKatılımcısı, roller.cekilisKatılımcısı]
            // .array() metodu v14'te yoktur, .toJSON() veya .values() kullanılabilir, ancak genellikle forEach döngüsü tercih edilir.
            let length = (sunucu.members.cache.filter(filter).size + 5); 
            const sayı = Math.floor(length / Distributors.length);
            for (let index = 0; index < Distributors.length; index++) {
              const bot = Distributors[index];
              // .array() metodu v14'te yoktur.
              const members = bot.guilds.cache.get(sunucu.id).members.cache.filter(filter).toJSON().slice((index * sayı), ((index + 1) * sayı)); 
              if (members.length <= 0) return;
              for (const member of members) {
                member.roles.add(roller.etkinlikKatılımcısı)
                member.roles.add(roller.cekilisKatılımcısı)
              }
            }
        }
    });

  },


   /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */

  onRequest: async function (client, message, args) {
    // MessageActionRow -> ActionRowBuilder
    // MessageButton -> ButtonBuilder
    // STYLE dize -> sayısal değer (3: SUCCESS)
    let Row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
      .setCustomId("özelOdaOluştur")
      .setLabel("Özel Oda Oluştur")
      .setStyle(3) // SUCCESS -> 3
    )
    message.channel.send({content: `**Merhaba!** Özel Oda Oluşturma Sistemine Hoş Geldiniz!

Bu kısımdan kendin belirleyeceğin isimde ve senin yöneteceğin bir kanal oluşturabilirsin.
Ayrıca bu kanala istediklerin girebilir, istemediklerini odaya almayabilirsin.

Belki odanı gizli yaparak devlet sırlarını konuşabilir,
Ya da herkese açık yaparak halka seslenebilirsin.

Aşağıda bulunan "Özel Oda Oluştur" düğmesine basarak oluşturabilirsiniz, iyi sohbetler dilerim.`, components: [Row]})
  }
};

// client.on olayları v14'te aynı şekilde çalışır.

client.on("voiceChannelLeave", async (member, channel) => {
  let guild = client.guilds.cache.get(global.sistem.SERVER.ID)
  if(!guild) return;
  let Data = await Private.findOne({voiceChannelId: channel.id})
  if(!Data) return;
  let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
  if(Data.permaRoom) return;
  setTimeout(async () => {
    if(sesKanalı && sesKanalı.members.size <= 0) { 
      await Private.deleteOne({guildID: Data.guildID, userID: Data.userID})
      setTimeout(() => {
         sesKanalı.delete().catch(err => {})
      }, 2000); 
    }
  }, 5000);
});

client.on("voiceChannelSwitch", async (member, channel, newChannel) => {
  let guild = client.guilds.cache.get(global.sistem.SERVER.ID)
  if(!guild) return;
  let Data = await Private.findOne({voiceChannelId: channel.id})
  if(!Data) return;
  if(Data.permaRoom) return;
  let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
  setTimeout(async () => {
    if(sesKanalı && sesKanalı.members.size <= 0) {
      await Private.deleteOne({guildID: Data.guildID, userID: Data.userID})
      setTimeout(() => {
         sesKanalı.delete().catch(err => {})
      }, 2000); 
    }
  }, 5000);
});


// Modal Submit handler
client.on('modalSubmit', async (modal) => { 
  if(modal.customId == "limitOzelOdacik") {
    let guild = client.guilds.cache.get(global.sistem.SERVER.ID)
    if(!guild) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
    let uye = guild.members.cache.get(modal.user.id)
    if(!uye)  {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
    if(ayarlar && !ayarlar.özelOda && !ayarlar.özelOdaOluştur) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel olarak özel oda oluştur kapalı.` , ephemeral: true })
    }
    let privOdalar = guild.channels.cache.get(ayarlar.özelOdaOluştur)
    if(!privOdalar) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel olarak özel oda oluştur kapalı.` , ephemeral: true })
    }
  
    let Data = await Private.findOne({guildID: guild.id, userID: uye.id})
    if(!Data) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Bu kullanıcı için özel oda oluşturma yetkisi yok.` , ephemeral: true })
    }
    let limit = parseInt(modal.getTextInputValue('name'))
    if(isNaN(limit)) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Lütfen geçerli bir sayı girin.` , ephemeral: true })
    }
    let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
    if(sesKanalı) {
      sesKanalı.setUserLimit(Number(limit))
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Özel oda limiti başarıyla değiştirildi.` , ephemeral: true })
    } else {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
  }
  if(modal.customId == "isimDegistirme") {
    let guild = client.guilds.cache.get(global.sistem.SERVER.ID)
    if(!guild) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
    let uye = guild.members.cache.get(modal.user.id)
    if(!uye)  {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
    if(ayarlar && !ayarlar.özelOda && !ayarlar.özelOdaOluştur) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel olarak özel oda oluştur kapalı.` , ephemeral: true })
    }
    let privOdalar = guild.channels.cache.get(ayarlar.özelOdaOluştur)
    if(!privOdalar) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel olarak özel oda oluştur kapalı.` , ephemeral: true })
    }
  
    let Data = await Private.findOne({guildID: guild.id, userID: uye.id})
    if(!Data) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
    let isim = modal.getTextInputValue('name'); 
    if(!isim) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Lütfen isim giriniz.` , ephemeral: true })
    }
    let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
    if(sesKanalı) {
      let kanalIsim = sesKanalı.name.replace("🔓", "").replace("🔒", "")
      await sesKanalı.setName(sesKanalı.name.replace(kanalIsim, isim))
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Özel oda ismi değiştirildi.` , ephemeral: true })
    } else {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
  }
  if(modal.customId == "ozelOdaBanla") {
    let guild = client.guilds.cache.get(global.sistem.SERVER.ID)
    if(!guild) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
    let uye = guild.members.cache.get(modal.user.id)
    if(!uye)  {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
    if(ayarlar && !ayarlar.özelOda && !ayarlar.özelOdaOluştur) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel olarak özel oda oluştur kapalı.` , ephemeral: true })
    }
    let privOdalar = guild.channels.cache.get(ayarlar.özelOdaOluştur)
    if(!privOdalar) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel olarak özel oda oluştur kapalı.` , ephemeral: true })
    }
  
    let Data = await Private.findOne({guildID: guild.id, userID: uye.id})
    if(!Data) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Özel oda oluşturmadığınız için bu işlemi yapmaya hakkınız yok.` , ephemeral: true })
    }
    let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
    if(sesKanalı) { 
      let id = modal.getTextInputValue('name'); 
      let izinVerilcek = guild.members.cache.get(id)
      if(izinVerilcek) {
        if(izinVerilcek.voice && izinVerilcek.voice.channel && izinVerilcek.voice.channel.id == sesKanalı.id) izinVerilcek.voice.disconnect()
        sesKanalı.permissionOverwrites.delete(izinVerilcek.id);
        sesKanalı.permissionOverwrites.create(izinVerilcek.id, { Connect: false, ViewChannel: false }); // CONNECT -> Connect, VIEW_CHANNEL -> ViewChannel
        await modal.deferReply({ ephemeral: true })
        return await modal.followUp({content: `Başarıyla "${sesKanalı}" kanalında ${izinVerilcek} üyesi yasaklandı. ${guild.emojiGöster(emojiler.Onay)}` , ephemeral: true })
      } else {
        await modal.deferReply({ ephemeral: true })
        return await modal.followUp({content: `Belirttiğiniz ID ile bir üye eşleşmedi. Lütfen geçerli bir ID numarası girin. ${cevaplar.prefix}` , ephemeral: true })
      }
    } else {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel olarak özel oda oluştur kapalı.` , ephemeral: true })
    }
  }

  if(modal.customId == "ozelOdaIzin") {
    let guild = client.guilds.cache.get(global.sistem.SERVER.ID)
    if(!guild) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
    let uye = guild.members.cache.get(modal.user.id)
    if(!uye)  {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
    if(ayarlar && !ayarlar.özelOda && !ayarlar.özelOdaOluştur) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel olarak özel oda oluştur kapalı.` , ephemeral: true })
    }
    let privOdalar = guild.channels.cache.get(ayarlar.özelOdaOluştur)
    if(!privOdalar) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel olarak özel oda oluştur kapalı.` , ephemeral: true })
    }
  
    let Data = await Private.findOne({guildID: guild.id, userID: uye.id})
    if(!Data) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Özel oda oluşturmadığınız için bu işlemi yapmaya hakkınız yok.` , ephemeral: true })
    }
    let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
    if(sesKanalı) { 
      let id = modal.getTextInputValue('name'); 
      let izinVerilcek = guild.members.cache.get(id)
      if(izinVerilcek) {
        sesKanalı.permissionOverwrites.create(izinVerilcek.id, { Connect: true,  ViewChannel: true }); // CONNECT -> Connect, VIEW_CHANNEL -> ViewChannel
        await modal.deferReply({ ephemeral: true })
        return await modal.followUp({content: `Başarıyla "${sesKanalı}" kanalına ${izinVerilcek} üyesi eklendi. ${guild.emojiGöster(emojiler.Onay)}` , ephemeral: true })
      } else {
        await modal.deferReply({ ephemeral: true })
        return await modal.followUp({content: `Belirttiğiniz ID ile bir üye eşleşmedi. Lütfen geçerli bir ID numarası girin. ${cevaplar.prefix}` , ephemeral: true })
      }
    } else {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel olarak özel oda oluştur kapalı.` , ephemeral: true })
    }
  }

  if(modal.customId == "ozelOdaOlusturma") {
    let guild = client.guilds.cache.get(global.sistem.SERVER.ID)
    if(!guild) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
    let uye = guild.members.cache.get(modal.user.id)
    if(!uye)  {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel hata oluştu.` , ephemeral: true })
    }
    if(ayarlar && !ayarlar.özelOda && !ayarlar.özelOdaOluştur) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel olarak özel oda oluştur kapalı.` , ephemeral: true })
    }
    let privOdalar = guild.channels.cache.get(ayarlar.özelOdaOluştur)
    if(!privOdalar) {
      await modal.deferReply({ ephemeral: true })
      return await modal.followUp({content: `Sistemsel olarak özel oda oluştur kapalı.` , ephemeral: true })
    }
  
    let Data = await Private.findOne({guildID: guild.id, userID: uye.id})
    
    let odaIsmi = modal.getTextInputValue('name'); 
    let odaIzin = modal.getTextInputValue('everyone');
    guild.channels.create({ // V14 tek obje alır
      name: `${odaIzin != "HAYIR"  ? "🔓" : "🔒"} ${odaIsmi}`,
      parent: privOdalar,
      permissionOverwrites: [{
          id: uye.id,
          allow: [
            PermissionsBitField.Flags.Connect, 
            PermissionsBitField.Flags.Speak, 
            PermissionsBitField.Flags.Stream,
            PermissionsBitField.Flags.PrioritySpeaker,
            PermissionsBitField.Flags.MuteMembers, 
            PermissionsBitField.Flags.DeafenMembers, 
            PermissionsBitField.Flags.MoveMembers
          ], // Permissions.FLAGS.* -> PermissionsBitField.Flags.*
        },
      ],
      type: ChannelType.GuildVoice, // 'GUILD_VOICE' -> ChannelType.GuildVoice
    }).then(async (kanal) => {
      if(odaIzin == "HAYIR") { 
        await kanal.permissionOverwrites.edit(uye.guild.roles.everyone.id, { Connect: false,Speak: true, Stream: true }); // CONNECT -> Connect
      } else { 
        await kanal.permissionOverwrites.edit(uye.guild.roles.everyone.id, { Connect: true, SPEAK: true, Stream: true }); // CONNECT -> Connect
      }
      setTimeout(async () => {
        if(kanal && kanal.members.size <= 0) {
          setTimeout(async () => {
            await Private.deleteOne({guildID: guild.id, userID: uye.id})
            kanal.delete().catch(err => {})
          }, 1250)
        }
      }, 30000)

      // MessageActionRow -> ActionRowBuilder, MessageButton -> ButtonBuilder
      let Row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("kanalBilgisi_ozelOda")
        .setLabel("Kanal Bilgisi")
        .setStyle(2), // SECONDARY -> 2
        new ButtonBuilder()
        .setCustomId("izinVer_ozelOda")
        .setLabel("Oda İzni Ver")
        .setStyle(2), // SECONDARY -> 2
        new ButtonBuilder()
        .setCustomId("yasakla_ozelOda")
        .setLabel("Odadan Yasakla")
        .setStyle(2), // SECONDARY -> 2
        new ButtonBuilder()
        .setCustomId("limit_ozelOda")
        .setLabel("Oda Limiti Düzenle")
        .setStyle(2), // SECONDARY -> 2
        new ButtonBuilder()
        .setCustomId("isimDegistir_ozelOda")
        .setLabel("Odanın İsmini Güncelle")
        .setStyle(2), // SECONDARY -> 2
      )
      // MessageActionRow -> ActionRowBuilder, MessageButton -> ButtonBuilder
      let RowTwo = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("herkeseAcik_ozelOda")
        .setLabel(odaIzin != "HAYIR"  ? "Sadece İzinliler'e Ayarla" : "Herkese Açık Ayarla")
        .setStyle(odaIzin != "HAYIR"  ? 2 : 1), // SECONDARY -> 2, PRIMARY -> 1
        new ButtonBuilder()
        .setCustomId("odaIzinSıfırla")
        .setLabel("Kanal İzinleri Temizle")
        .setStyle(4), // DANGER -> 4
        new ButtonBuilder()
        .setCustomId("kaldır_ozelOda")
        .setLabel("Kanalı Kaldır")
        .setStyle(4), // DANGER -> 4
      )
      if(kanal) kanal.send({content : `Özel Oda Yönetim Paneline Hoş Geldin! ${uye}

Özel odanız herkese açık ise yasakladığınız üyeler dışında herkes giriş yapabilir.
Özel odanız sadece izinliler olarak ayarlandığında izin verdiğiniz herkes giriş yapabilir.`, components: [Row, RowTwo]})
      await modal.deferReply({ ephemeral: true })
      await Private.updateOne({guildID: guild.id, userID: uye.id}, {$set: {"Date": Date.now(), "voiceChannelId": kanal.id, "messageChannelId": kanal.id}}, {upsert: true});
      await Private.updateOne({guildID: guild.id, userID: uye.id}, {$set: {"Date": Date.now(), "voiceChannelId": kanal.id, "messageChannelId": kanal.id}}, {upsert: true})
      await modal.followUp({content: `Ses kanalınız başarıyla oluşturuldu! <#${kanal.id}> (**${odaIzin != "EVET"  ? "Sadece İzinliler!" : "Herkese Açık!"}**)
Oluşturulan kanalınızı yönetmek ister misiniz? Yeni özellikle beraber artık ses kanalınızın sohbet yerinden hem kontrol hem mikrofonu olmayan arkadaşlarınızla oradan sohbet edebilirsiniz.` , ephemeral: true })
    })
  }
  
})

// Interaction handler devamı
client.on("interactionCreate", async (i) => {
  let guild = client.guilds.cache.get(i.guild.id)
  if(!guild) return;
  let uye = guild.members.cache.get(i.user.id)
  if(!uye) return;
  if(!ayarlar) return;
  if(ayarlar && !ayarlar.özelOda && !ayarlar.özelOdaOluştur) return;
  let privOdalar = guild.channels.cache.get(ayarlar.özelOdaOluştur)
  if(!privOdalar) return;

  let Data = await Private.findOne({guildID: guild.id, userID: uye.id})
  if(i.customId == "limit_ozelOda") {
    if(!Data) return i.reply({content: `Kanal'ın isimi için bir özel oda oluşturmalısınız.`, ephemeral: true});
    let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
    if(sesKanalı) { 
      // Modal -> ModalBuilder, TextInputComponent -> TextInputBuilder, STYLE dize -> TextInputStyle sabiti
      let özelOda = new ModalBuilder()
      .setCustomId('limitOzelOdacik')
      .setTitle(`${sesKanalı.name.replace("🔒", "").replace("🔓","")} Kanalı Limiti Düzenle!`);
      
      const limitInput = new TextInputBuilder()
        .setCustomId('name')
        .setLabel('Kanal Limiti')
        .setStyle(TextInputStyle.Short)
        .setMinLength(1)
        .setMaxLength(2)
        .setPlaceholder(`Örn: 31`)
        .setRequired(true);

      özelOda.addComponents(new ActionRowBuilder().addComponents(limitInput));
      
      showModal(özelOda, {
        client: client,
        interaction: i,
      })
    } else {
      return i.reply({content: `Sistemsel bir hata oluştu, lütfen yöneticilere başvurun.`, ephemeral: true});
    }
  }

  if(i.customId == "odaIzinSıfırla") {
    if(!Data) return i.reply({content: `Kanal'ın isimi için bir özel oda oluşturmalısınız.`, ephemeral: true});
    let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
    if(sesKanalı) { 
      sesKanalı.permissionOverwrites.cache.filter(x => x.type == 1 && x.id != i.user.id).map(async (x) => { // type == "member" -> type == 1
        await sesKanalı.permissionOverwrites.delete(x.id)
      })
      return i.reply({content: `Başarıyla sen hariç tüm üyelerin izinleri ve yasakları sıfırlandı.`, ephemeral: true});
    } else {
      return i.reply({content: `Sistemsel bir hata oluştu, lütfen yöneticilere başvurun.`, ephemeral: true});
    }
  }

  if(i.customId == "isimDegistir_ozelOda") {
    if(!Data) return i.reply({content: `Kanal'ın isimi için bir özel oda oluşturmalısınız.`, ephemeral: true});
    
    let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
    if(sesKanalı) { 
      // Modal -> ModalBuilder, TextInputComponent -> TextInputBuilder, STYLE dize -> TextInputStyle sabiti
      let isimDegistirme = new ModalBuilder()
      .setCustomId('isimDegistirme')
      .setTitle(`${sesKanalı.name.replace("🔒", "").replace("🔓","")} Kanalı Düzenle`);

      const isimInput = new TextInputBuilder()
        .setCustomId('name')
        .setLabel('Kanal İsmi')
        .setStyle(TextInputStyle.Short)
        .setMinLength(2)
        .setMaxLength(32)
        .setPlaceholder(`${sesKanalı.name.replace("🔒", "").replace("🔓","")}`)
        .setRequired(true);

      isimDegistirme.addComponents(new ActionRowBuilder().addComponents(isimInput));
      
      showModal(isimDegistirme, {
        client: client,
        interaction: i,
      })
    } else {
      return i.reply({content: `Sistemsel bir hata oluştu, lütfen yöneticilere başvurun.`, ephemeral: true});
    }
  }

  if(i.customId == "herkeseAcik_ozelOda") {
    if(!Data) return i.reply({content: `Kanal'ın görünürlüğü için bir özel oda oluşturmalısınız.`, ephemeral: true});
    let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
    if(sesKanalı) { 
      // Bileşenler ve stiller güncellendi
      let Row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("kanalBilgisi_ozelOda")
        .setLabel("Kanal Bilgisi")
        .setStyle(2), // SECONDARY -> 2
        new ButtonBuilder()
        .setCustomId("izinVer_ozelOda")
        .setLabel("Oda İzni Ver")
        .setStyle(2), // SECONDARY -> 2
        new ButtonBuilder()
        .setCustomId("yasakla_ozelOda")
        .setLabel("Odadan Yasakla")
        .setStyle(2), // SECONDARY -> 2
        new ButtonBuilder()
        .setCustomId("limit_ozelOda")
        .setLabel("Oda Limiti Düzenle")
        .setStyle(2), // SECONDARY -> 2
        new ButtonBuilder()
        .setCustomId("isimDegistir_ozelOda")
        .setLabel("Odanın İsmini Güncelle")
        .setStyle(2), // SECONDARY -> 2
      )
      let RowTwo = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("herkeseAcik_ozelOda")
        .setLabel(sesKanalı.permissionsFor(uye.guild.roles.everyone).has(PermissionsBitField.Flags.Connect) ? "Sadece İzinliler'e Ayarla" : "Herkese Açık Ayarla") // CONNECT -> Connect
        .setStyle(sesKanalı.permissionsFor(uye.guild.roles.everyone).has(PermissionsBitField.Flags.Connect) ? 2 : 1), // CONNECT -> Connect, SECONDARY -> 2, PRIMARY -> 1
        new ButtonBuilder()
        .setCustomId("odaIzinSıfırla")
        .setLabel("Kanal İzinleri Temizle")
        .setStyle(4), // DANGER -> 4
        new ButtonBuilder()
        .setCustomId("kaldır_ozelOda")
        .setLabel("Kanalı Kaldır")
        .setStyle(4), // DANGER -> 4
      )
      if (sesKanalı.permissionsFor(uye.guild.roles.everyone).has(PermissionsBitField.Flags.Connect)) { // CONNECT -> Connect
        await sesKanalı.permissionOverwrites.edit(uye.guild.roles.everyone.id, { Connect: false, Speak: true, Stream: true }); // CONNECT -> Connect
        sesKanalı.setName(sesKanalı.name.replace("🔓", "🔒"))
        RowTwo.components[0].setStyle(1).setLabel(`Herkese Açık Ayarla`) // PRIMARY -> 1
        i.update({components: [Row, RowTwo]})
      } else {
        await sesKanalı.permissionOverwrites.edit(uye.guild.roles.everyone.id, { Connect: true, Speak: true, Stream: true }); // CONNECT -> Connect
        RowTwo.components[0].setStyle(2).setLabel(`Sadece İzinliler'e Ayarla`) // SECONDARY -> 2
        sesKanalı.setName(sesKanalı.name.replace("🔒", "🔓"))
        i.update({components: [Row, RowTwo]})
      } 
    } else {
      return i.reply({content: `Sistemsel bir hata oluştu, lütfen yöneticilere başvurun.`, ephemeral: true});
    }
}

  if(i.customId == "yasakla_ozelOda") {
    
    if(!Data) return i.reply({content: `Kanal'a izinli kaldırmam için bir özel oda oluşturmalısınız.`, ephemeral: true});
    let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
    if(sesKanalı) { 
      // Modal -> ModalBuilder, TextInputComponent -> TextInputBuilder, STYLE dize -> TextInputStyle sabiti
      let izinOdaBanla = new ModalBuilder()
      .setCustomId('ozelOdaBanla')
      .setTitle(`${sesKanalı.name.replace("🔒", "").replace("🔓","")} Kanalı Yasaklama Paneli`);

      const idInput = new TextInputBuilder()
        .setCustomId('name')
        .setLabel('ID')
        .setStyle(TextInputStyle.Short)
        .setMinLength(18)
        .setMaxLength(22)
        .setPlaceholder(`Örn: 327236967265861633`)
        .setRequired(true);

      izinOdaBanla.addComponents(new ActionRowBuilder().addComponents(idInput));
      
      showModal(izinOdaBanla, {
        client: client,
        interaction: i,
      })
    } else {
      return i.reply({content: `Sistemsel bir hata oluştu, lütfen yöneticilere başvurun.`, ephemeral: true});
    }
}

  if(i.customId == "izinVer_ozelOda") {
      if(!Data) return i.reply({content: `Kanal'a izinli eklemem için bir özel oda oluşturmalısınız.`, ephemeral: true});
      let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
      if(sesKanalı) { 
        // Modal -> ModalBuilder, TextInputComponent -> TextInputBuilder, STYLE dize -> TextInputStyle sabiti
        let izinOda = new ModalBuilder()
        .setCustomId('ozelOdaIzin')
        .setTitle(`${sesKanalı.name.replace("🔒", "").replace("🔓","")} Kanalı İzin Paneli`);

        const idInput = new TextInputBuilder()
          .setCustomId('name')
          .setLabel('ID')
          .setStyle(TextInputStyle.Short)
          .setMinLength(18)
          .setMaxLength(22)
          .setPlaceholder(`Örn: 327236967265861633`)
          .setRequired(true);
        
        izinOda.addComponents(new ActionRowBuilder().addComponents(idInput));

        showModal(izinOda, {
          client: client,
          interaction: i,
        })
      } else {
        return i.reply({content: `Sistemsel bir hata oluştu, lütfen yöneticilere başvurun.`, ephemeral: true});
      }
  }
  if(i.customId == "kaldır_ozelOda") {
    if(!Data) return i.reply({content: `Kanal'ı kaldırmam için bir özel oda oluşturmalısınız.`, ephemeral: true});

    let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
    if(sesKanalı) { 
      setTimeout(async () => {
        await Private.deleteOne({guildID: guild.id, userID: uye.id})
        await sesKanalı.delete().catch(err => {})
      }, 5000);
      i.reply({content: `Başarıyla kanal silme işleminiz tamamlandı.
5 Saniye içerisinde ${sesKanalı} kanalınız silinecektir. ${uye.guild.emojiGöster(emojiler.Onay)}`, ephemeral: true})
    } else {
      return i.reply({content: `Sistemsel bir hata oluştu, lütfen yöneticilere başvurun.`, ephemeral: true});
    }
  }
  if(i.customId == "kanalBilgisi_ozelOda") {
    if(!Data) return i.reply({content: `Kanal bilginizi görüntüleyebilmem için bir özel oda oluşturmalısınız.`, ephemeral: true});
    let sesKanalı = guild.channels.cache.get(Data.voiceChannelId)
    if(sesKanalı) {
      let yasaklılar = []
      let izinliler = []
      sesKanalı.permissionOverwrites.cache.filter(x => x.type == 1 && x.id != i.user.id).map(x => { // type == "member" -> type == 1
        if(sesKanalı.permissionsFor(x.id) && sesKanalı.permissionsFor(x.id).has(PermissionsBitField.Flags.Connect)) { // CONNECT -> Connect
          izinliler.push(x.id)
        } else {
          yasaklılar.push(x.id)
        }
      })

      i.reply({content: `
Ses kanalın görünürlüğü: **${sesKanalı.permissionsFor(uye.guild.roles.everyone).has(PermissionsBitField.Flags.Connect) ? "Herkese Açık!" : "Sadece İzinliler!"}**
Oluşturulma tarihi: <t:${String(Data.Date).slice(0, 10)}:F> (<t:${String(Data.Date).slice(0, 10)}:R>)

Ses kanalında izinliler:
${izinliler.length > 0 ? izinliler.map(x => `> ${uye.guild.members.cache.get(x)} (\`${x}\`)`).join("\n") : "İzinli bulunamadı!"}

Ses kanalında yasaklılar:
${yasaklılar.length > 0 ? yasaklılar.map(x => `> ${uye.guild.members.cache.get(x)} (\`${x}\`)`).join("\n") : "Yasaklı bulunamadı!"}

`, ephemeral: true})
    } else {
      return i.reply({content: `Sistemsel bir hata oluştu, lütfen yöneticilere başvurun.`, ephemeral: true});
    }
  }

  // Modal -> ModalBuilder, TextInputComponent -> TextInputBuilder, STYLE dize -> TextInputStyle sabiti
  const modal = new ModalBuilder()
  .setCustomId('ozelOdaOlusturma')
  .setTitle('Özel Oda Oluşturma');

  const nameInput = new TextInputBuilder()
    .setCustomId('name')
    .setLabel('Oda İsmi Giriniz!')
    .setStyle(TextInputStyle.Short)
    .setMinLength(3)
    .setMaxLength(60)
    .setPlaceholder(`Örn: Acar'ın Odası`)
    .setRequired(true);

  const everyoneInput = new TextInputBuilder()
    .setCustomId('everyone')
    .setLabel('SES HERKESE AÇIK MI? (EVET/HAYIR)')
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(10)
    .setPlaceholder('Sadece "EVET" veya "HAYIR" yazın.')
    .setRequired(true);

  // Her bir bileşen bir ActionRowBuilder içinde olmalı.
  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(everyoneInput)
  );

  if(i.customId == "özelOdaOluştur") {
    if(Data) return i.reply({content: `Aktif bir özel odanız olduğundan dolayı bir özel oda oluşturmazsınız.`, ephemeral: true});
    showModal(modal, {
      client: client,
      interaction: i 
    })
  }
})

function başHarfBüyült(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

async function voiceKur(idcik, message, embed) {
    let sesKurma = await VoiceChannels.find({ parentID: idcik })
    if(sesKurma) {
      sesKurma.forEach(async (data) => {
         message.guild.channels.create({ // V14 tek obje alır
          name: data.name,
          type: ChannelType.GuildVoice, // 'GUILD_VOICE' -> ChannelType.GuildVoice
          bitrate: data.bitrate,
          parent: idcik, // parentId -> parent
          position: data.position,
          userLimit: data.userLimit ? data.userLimit : 0
        }).then(async (gg) => {
          await gg.setParent(idcik)
        }).catch(err => {})
      })
    }
}

async function textKur(idcik, message, embed) {
  let metinkurma = await TextChannels.find({ parentID: idcik })
  if(metinkurma) {
    metinkurma.forEach(async (data) => {
      await message.guild.channels.create({ // V14 tek obje alır
        name: data.name,
        type: ChannelType.GuildText, // 'GUILD_TEXT' -> ChannelType.GuildText
        nsfw: data.nsfw,
        parent: idcik, // parentId -> parent
        position: data.position,
        rateLimit: data.rateLimit,
      }).then(async (gg) => {
        await gg.setParent(idcik)
      }).catch(err => {});
    })
  }
}