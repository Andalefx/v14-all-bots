const { 
    Client, 
    Message, 
    ButtonBuilder, 
    ActionRowBuilder, 
    SelectMenuBuilder, 
    EmbedBuilder, 
    ButtonStyle,
    ModalBuilder, // V14 Modal Sınıfı
    TextInputBuilder, // V14 TextInput Sınıfı
    TextInputStyle // V14 TextInput Stil Enum'u
} = require("discord.js");
const TalentPerms = require('../../../../Global/Databases/Global.Guild.Settings');
const task = require('../../../../Global/Databases/Client.Users.Tasks');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const ms = require('ms');

// NOT: Kodunuzda kullanılan ancak tanımlanmamış bazı değişkenler için varsayılan değerler eklendi.
let ayarlar = global.ayarlar || { staff: ["STAFF_ID"] }; 
let emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' };
let cevaplar = global.cevaplar || { prefix: '❌' };

module.exports = {
    Isim: "tp",
    Komut: ["talentperm","talentperms","özelkomut","rolkomut"],
    Kullanim: "",
    Aciklama: "",
    Kategori: "-",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) {
    // V14: client.on('modalSubmit', ...) yerine interactionCreate içinde kontrol edilir.
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isModalSubmit()) return;

      let guild = client.guilds.cache.get(interaction.guildId);

      if(!guild) {
        await interaction.deferReply({ ephemeral: true });
        return await interaction.followUp({content: `Sistemsel olarak bir hata oluştu.`, ephemeral: true });
      }

      let uye = guild.members.cache.get(interaction.user.id);
      if(!uye){
        await interaction.deferReply({ ephemeral: true });
        return await interaction.followUp({content: `Sistemsel hata oluştu.`, ephemeral: true });
      }

      // V14: input verisini almak için fields.getTextInputValue kullanılır.
      if(interaction.customId == "tp-kaldır") {
        let cmdName = interaction.fields.getTextInputValue('tp_isim');
        let check = await TalentPerms.findOne({guildID: guild.id});
        let cmd = check.talentPerms.find(acar => acar.Commands == cmdName);

        if(!cmd) {
          await interaction.deferReply({ ephemeral: true });
          return await interaction.followUp({content: `Belirtilen isimde aktif bir komut bulunmamakta. ${cevaplar.prefix}` , ephemeral: true });
        }

        await TalentPerms.updateOne({guildID: guild.id}, { $pull: { "talentPerms": cmd } }, { upsert: true });
        await interaction.deferReply({ ephemeral: true });
        return await interaction.followUp({content: `Başarıyla **${cmdName}** komutu <t:${String(Date.now()).slice(0, 10)}:R> kaldırıldı. ${guild.emojiGöster(emojiler.Onay)}` , ephemeral: true });
      }

      if(interaction.customId == "tp-detay") {
        let cmdName = interaction.fields.getTextInputValue('tp_isim');
        let check = await TalentPerms.findOne({guildID: guild.id});
        let cmd = check.talentPerms.find(acar => acar.Commands == cmdName);
        
        if(!cmd) {
          await interaction.deferReply({ ephemeral: true });
          return await interaction.followUp({content: `Belirtilen isimde aktif bir komut bulunmamakta. ${cevaplar.prefix}` , ephemeral: true });
        }
       
        await interaction.deferReply({ ephemeral: true });
        // V14: setFooter formatı güncellendi
        return await interaction.followUp({embeds: [new genEmbed()
          .setThumbnail(guild.iconURL({dynamic: true}))
          .setFooter({text: uye.user.tag, iconURL: uye.user.avatarURL({dynamic: true})})
          .setDescription(`Aşağı da **${cmdName}** isimli rol (ver/al) veya alt komutun detaylı bilgileri belirtilmiştir.\n
Bu komut ${cmd.Author ? guild.members.cache.get(cmd.Author) ? guild.members.cache.get(cmd.Author) : `<@${cmd.Author}>` : uye} tarafından ${cmd.Date ? `<t:${String(cmd.Date).slice(0, 10)}:R>` : `<t:${String(Date.now()).slice(0, 10)}:R>`} oluşturdu.

**Verilen rol(ler)**:
${cmd.Roles ? cmd.Roles.map(x => guild.roles.cache.get(x)).join(", ") : "@rol bulunamadı"} rol veya rollerini veriyor.
**Kullanacak rol(ler)**:
${cmd.Permission ? cmd.Permission.map(x => guild.roles.cache.get(x)).join(", ") : "@rol bulanamadı"} rol veya rolleri kullanabilir.`)] , ephemeral: true });
      }

      if(interaction.customId == "tp-ekle") {
        let cmdName = interaction.fields.getTextInputValue('tp_isim');
        let cmdType = interaction.fields.getTextInputValue("tp_kullancakroller") || [];
        let cmdContent = interaction.fields.getTextInputValue('tp_vericekroller') || [];

        cmdType = cmdType.split(' ').filter(r => r.length > 0); // Boşlukları filtrele
        cmdContent = cmdContent.split(' ').filter(r => r.length > 0); // Boşlukları filtrele

        let _Permission = cmdType;
        let _Roles = cmdContent;
        
        let check = await TalentPerms.findOne({guildID: guild.id});
        let cmd = check?.talentPerms?.find(acar => acar.Commands == cmdName);
        
        if(cmd) {
          await interaction.deferReply({ ephemeral: true });
          return await interaction.followUp({content: `Belirtilen isimde aktif bir komut bulunmakta. ${cevaplar.prefix}` , ephemeral: true });
        }

        if((_Roles && !_Roles.some(x => guild.roles.cache.has(x))) || (_Permission && !_Permission.some(x => guild.roles.cache.has(x)))) {
          await interaction.deferReply({ ephemeral: true });
          return await interaction.followUp({content: `Belirtilen rol veya roller ${guild.name} sunucusunda bulunamadı. ${cevaplar.prefix}` , ephemeral: true });
        }

        await TalentPerms.updateOne({guildID: guild.id}, { $push: {"talentPerms": {
          Name: başHarfBüyült(cmdName),
          Commands: cmdName,
          Permission: _Permission,
          Roles: _Roles,
          Date: Date.now(),
          Author: uye.id,
        }}}, {upsert: true});

        await interaction.deferReply({ ephemeral: true });
        return await interaction.followUp({content: `Başarıyla **${cmdName}** komutu <t:${String(Date.now()).slice(0, 10)}:R> eklendi. ${guild.emojiGöster(emojiler.Onay)}` , ephemeral: true });
      }
    });
  },

   /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */

  onRequest: async function (client, message, args) {
    if(!ayarlar.staff.includes(message.member.id) && message.guild.ownerId != message.member.id) return;  
    // const embed = new genEmbed() // Zaten aşağıda kullanılıyor

      let Tp = await TalentPerms.findOne({guildID: message.guild.id});

      let load = await message.reply({
        content: `${message.guild.name} sunucusuna ait rol (ver/al) komut oluşturma sistemi yükleniyor. Lütfen bekleyin!`
      });

      // V14: ActionRowBuilder ve ButtonBuilder kullanılıyor. Style enum'ları kullanılıyor.
      let Row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Success)
          .setEmoji("943265806341513287")
          .setLabel("Komut Oluştur")
          .setCustomId("tp_ekle"),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setEmoji("963743753036791879")
          .setLabel("Komut Bilgileri")
          .setCustomId("tp_bilgileri"),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("943265806547038310")
          .setLabel("Komut Kaldır")
          .setCustomId("tp_kaldır"),
      );
    
      let TalentPerm = Tp?.talentPerms || []; // null check eklendi
      let komutlar = []
      // let komutListe = [] // Bu değişken kullanılmıyor

      if(TalentPerm.length > 0) {
        TalentPerm.filter(x => !Array.isArray(x.Commands)).forEach(x =>  komutlar.push({name: x.Commands, roles: `${x.Roles.map(a => message.guild.roles.cache.get(a) ? message.guild.roles.cache.get(a) : "@rol bulunamadı").join(", ")}`}))
        // TalentPerm.filter(x => !Array.isArray(x.Commands)).forEach(data => {
        //   komutListe.push([
        //     {label: başHarfBüyült(data.Commands), value: data.Commands, emoji: {id: "1023821496025612359"}, description: `${data.Roles.map(x => message.guild.roles.cache.get(x) ? message.guild.roles.cache.get(x).name : "@rol bulunamadı").join(", ")} veriyor.`},
        //   ])
        // })
      }

      load.edit({content: null, embeds: [
        new genEmbed()
        .setDescription(`Aşağıda ${message.guild.name} sunucusuna ait rol (ver/al) komut oluşturma, görüntüleme ve kaldırma işlemi yapabilirsiniz.\n
Sunucuda toplamda **${komutlar.length}** alt komut veya rol (ver/al) komutu bulunmakta. Eklemek için aşağıda bulunan "**Komut Oluştur**" düğmesini kullanabilirsiniz.\n
${komutlar.length > 0 ? `Aşağıda sunucuda bulunan alt komut veya rol (ver/al) komutları listelenmekte:
${komutlar.map(x => `${message.guild.emojiGöster("acar_arrow")} **${x.name}** (${x.roles})`).join("\n")}` : ``}`)
        .setThumbnail(message.guild.iconURL({dynamic: true}))
      ],
      components: [Row]
    });
      
      var filter = (i) => i.user.id == message.member.id;
      let collector = load.createMessageComponentCollector({ filter: filter, time: 60000});

      collector.on('collect', async (i) => {
        if(i.customId == "tp_bilgileri") {
          // V14: ModalBuilder ve TextInputBuilder kullanılıyor.
          const modal = new ModalBuilder()
          .setCustomId('tp-detay')
          .setTitle(`Alt Komut Bilgi`);

          const komutIsmiInput = new TextInputBuilder()
            .setCustomId('tp_isim')
            .setLabel('Komut İsmi')
            .setStyle(TextInputStyle.Short) // V14 Enum
            .setMinLength(3)
            .setMaxLength(120)
            .setPlaceholder(`Örn: vip`)
            .setRequired(true);

          const firstActionRow = new ActionRowBuilder().addComponents(komutIsmiInput);

          modal.addComponents(firstActionRow);

          // V14: i.showModal() kullanılır.
          await i.showModal(modal);
        }

        if(i.customId == "tp_kaldır") {
          // V14: ModalBuilder ve TextInputBuilder kullanılıyor.
          const modal = new ModalBuilder()
          .setCustomId('tp-kaldır')
          .setTitle(`Alt Komut Kaldırma`);

          const komutIsmiInput = new TextInputBuilder()
            .setCustomId('tp_isim')
            .setLabel('Komut İsmi')
            .setStyle(TextInputStyle.Short) // V14 Enum
            .setMinLength(3)
            .setMaxLength(120)
            .setPlaceholder(`Örn: vip`)
            .setRequired(true);

          const firstActionRow = new ActionRowBuilder().addComponents(komutIsmiInput);

          modal.addComponents(firstActionRow);

          // V14: i.showModal() kullanılır.
          await i.showModal(modal);
        }

        if(i.customId == "tp_ekle") {
          // V14: ModalBuilder ve TextInputBuilder kullanılıyor.
          const modal = new ModalBuilder()
          .setCustomId('tp-ekle')
          .setTitle(`Alt Komut Komut Ekleme`);

          const komutIsmiInput = new TextInputBuilder()
            .setCustomId('tp_isim')
            .setLabel('Komut İsmi')
            .setStyle(TextInputStyle.Short) // V14 Enum
            .setMinLength(3)
            .setMaxLength(120)
            .setPlaceholder(`Örn: vip`)
            .setRequired(true);

          const kullanacakRollerInput = new TextInputBuilder()
            .setCustomId('tp_kullancakroller')
            .setLabel('Kullanıcak Rol(ler) ID')
            .setStyle(TextInputStyle.Paragraph) // LONG yerine Paragraph (V14 Enum)
            .setMinLength(3)
            .setMaxLength(250)
            .setPlaceholder(`Birden fazla ID için boşluk bırakın.`)
            .setRequired(true);

          const verilecekRollerInput = new TextInputBuilder()
            .setCustomId('tp_vericekroller')
            .setLabel('Verilecek Rol(ler) ID')
            .setStyle(TextInputStyle.Paragraph) // LONG yerine Paragraph (V14 Enum)
            .setMinLength(3)
            .setMaxLength(250)
            .setPlaceholder(`Birden fazla ID için boşluk bırakın.`)
            .setRequired(true);

          // V14'te modal bileşenleri ActionRow'lara eklenmelidir.
          modal.addComponents(
            new ActionRowBuilder().addComponents(komutIsmiInput),
            new ActionRowBuilder().addComponents(kullanacakRollerInput),
            new ActionRowBuilder().addComponents(verilecekRollerInput)
          );

          // V14: i.showModal() kullanılır.
          await i.showModal(modal);
        }
      });

      collector.on('end', (collected, reason) => {
          if(reason == "time") {
            // V14: Bileşenleri güncellemek için ActionRowBuilder'ın kopyası oluşturulup güncellenir.
            const disabledRow = new ActionRowBuilder()
              .addComponents(
                Row.components[0].setDisabled(true),
                Row.components[1].setDisabled(true),
                Row.components[2].setDisabled(true),
              );
            
            load.edit({components: [disabledRow], embeds: [
              new genEmbed().setDescription(`Zaman aşımına uğradığı için işleminiz sonlandırıldı. ${cevaplar.prefix}`)
            ]});
            setTimeout(() => {
              message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
              load.delete().catch(err => {})
            }, 7500);
          }
      });
  }

};


function başHarfBüyült(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}