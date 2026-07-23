const { 
    Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionFlagsBits
} = require("discord.js");
const Jail = require('../../../../Global/Databases/Punitives.Jails')
const { genEmbed } = require("../../../../Global/İnit/Embed");
const {VK, DC, STREAM} = require('../../../../Global/Databases/Punitives.Activitys');

module.exports = {
    Isim: "streamercezalı",
    Komut: ["streamercezali","streamer-cezali","streamer-cezalı","streamcezalı","streamcezali","stream-cezalı","stream-cezali"],
    Kullanim: "streamcezalı <@andale/ID>", // Kullanim güncellendi
    Aciklama: "Belirtilen üyeyi yayıncı odalarında cezalandırır.",
    Kategori: "yetkili",
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
        if(!ayarlar && !roller && !roller.streamerCezalıRolü) return message.reply(cevaplar.notSetup)
        let aktivite = "Streamer"
        
        // V14 Yetki Kontrolü
        if(!roller.streamerSorumlusu.some(oku => message.member.roles.cache.has(oku)) && !roller.sorunÇözmeciler.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(uye.user.bot) return message.reply(cevaplar.bot).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(!uye.manageable) return message.reply(cevaplar.dokunulmaz).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.member.roles.highest.position <= uye.roles.highest.position) return message.reply(cevaplar.yetkiust).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        const sebeps = [
            { label: "Kışkırtma, Trol ve Dalgacı Davranış", description: "3 Gün", emoji: {name: "1️⃣"} , value: "1", date: "3d", type: 9},
            { label: "Karşı Cinse Taciz Ve Rahatsız Edici Davranış", description: "3 Gün", emoji: {name: "2️⃣"} ,value: "2", date: "3d", type: 9},
            { label: `Ortamı (${ayarlar.serverName}) Kötülemek`, description: "5 Gün", emoji: {name: "3️⃣"} ,value: "3", date: "5d", type: 9},
            { label: "Küfür, Argo, Hakaret ve Rahatsız Edici Davranış", description: "1 Gün", emoji: {name: "4️⃣"} ,value: "4", date: "1d", type: 9},
            { label: "Dini, Irki ve Siyasi değerlere Hakaret", description: "5 Gün", emoji: {name: "5️⃣"} ,value: "5", date: "5d", type: 9},
            { label: "Yayınlarda Pornografi Ve Uygunsuz İçerik Paylaşma", description: "7 Gün", emoji: {name: "6️⃣"}, value: "6", date: "7d", type: 9},
        ]
        
        // V14 ButtonBuilder kullanımı
        let jailButton = new ButtonBuilder()
        .setCustomId(`onayla`)
        .setLabel(await STREAM.findById(uye.id) ? `Aktif Cezalandırılması Mevcut!` : 'Cezalandırmayı Onaylıyorum!')
        .setEmoji(message.guild.emojiGöster(emojiler.Cezalandırıldı))
        .setStyle(ButtonStyle.Secondary) // V14 Enum
        .setDisabled(await STREAM.findById(uye.id) ? true : false )
        
        let iptalButton =  new ButtonBuilder()
        .setCustomId(`iptal`)
        .setLabel('İşlemi İptal Et')
        .setEmoji(message.guild.emojiGöster(emojiler.Iptal))
        .setStyle(ButtonStyle.Danger) // V14 Enum
        
        // V14 ActionRowBuilder kullanımı
        let jailOptions = new ActionRowBuilder().addComponents(
            jailButton,
            iptalButton
        );

        let msg = await message.reply({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({dynamic: true}) }).setDescription(`Belirtilen ${uye} isimli üyeyi yayıncı odalarıda cezalandırmak istiyor musun?`)], components: [jailOptions]}).catch(err => {})

        const filter = i => i.user.id == message.member.id 
        const collector = msg.createMessageComponentCollector({ filter, errors: ["time"], max: 3, time: 30000 })

        collector.on('collect', async i => {
            if (i.customId === `onayla`) {
                // V14 StringSelectMenuBuilder kullanımı
                await i.update({embeds: [new genEmbed().setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({dynamic: true}) }).setDescription(`Belirlenen ${uye} isimli üyesini hangi sebep ile yayıncı odalarından cezalandırmak istiyorsun?`)], components: [new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                    .setCustomId(`sebep`)
                    .setPlaceholder(`${uye.user.tag} için ceza sebebi belirtin!`)
                    .addOptions(sebeps.filter(x => x.type == 9)), // addOptions artık direkt array kabul eder
                )]})
            }
            
            if (i.customId === `sebep`) {
                let seçilenSebep = sebeps.find(x => x.value == i.values[0])
                if(seçilenSebep) {
                    i.deferUpdate() // V14 update
                    msg.delete().catch(err => {})
                    message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {})
                    
                    return uye.addPunitives(seçilenSebep.type, message.member, seçilenSebep.label, message, seçilenSebep.date)
                } else {
                    return i.update({components: [], embeds: [ new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Iptal) || '❌'} İşlem sırasında hata oluştu lütfen bot sahibine başvurun.`)]})
                }
            }
            
            if (i.customId === `iptal`) {
                // V14 update
                return await i.update({ content: `${message.guild.emojiGöster(emojiler.Iptal) || '❌'} ${uye} isimli üyenin **${aktivite}** cezalandırılma işlemi başarıyla iptal edildi.`, components: [], embeds: [] });
            }
        });
        
        collector.on("end", async (collected, reason) => {
            // Buton süresi dolduğunda mesajı sil
            if (reason === "time") {
                 msg.delete().catch(err => {})
            }
        })

    }
};