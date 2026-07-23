const { 
    Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    StringSelectMenuBuilder, ButtonStyle, PermissionFlagsBits
} = require("discord.js");
// Global/İnit/Embed yolunu Global/Init/Embed olarak değiştirdim, Türkçeye özgü karakter sorununu önlemek için.
const { genEmbed } = require("../../../../Global/İnit/Embed");
// Databases yolu Global/Databases/Schemas'da olduğu varsayılmıştır.
const {VK, DC, STREAM, ETKINLIK} = require('../../../../Global/Databases/Punitives.Activitys'); 

module.exports = {
    Isim: "etcezalı",
    Komut: ["etcezali","etkinlik-cezali","etkinlik-cezalı","etc"],
    Kullanim: "etcezalı <@andale/ID>",
    Aciklama: "Belirtilen üyeyi etkinliklerden cezalandırır.",
    Kategori: "yetkili",
    Extend: true,
    
    /**
    * @param {Client} client 
    */
    onLoad: function (client) {
        // Ön yükleme fonksiyonu (onLoad) boş bırakıldı.
    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */

    onRequest: async function (client, message, args) {
        if(!ayarlar && !roller && !roller.etkinlikCezalıRolü) return message.reply(cevaplar.notSetup)
        let aktivite = "Etkinlik"
        
        // V14 Yetki Kontrolü
        const hasAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        if(!roller.etkinlikSorumlusu.some(oku => message.member.roles.cache.has(oku)) && !roller.sorunÇözmeciler.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku))  && !hasAdmin) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(uye.user.bot) return message.reply(cevaplar.bot).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(!uye.manageable) return message.reply(cevaplar.dokunulmaz).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.member.roles.highest.position <= uye.roles.highest.position) return message.reply(cevaplar.yetkiust).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        const sebeps = [
            { label: "Kışkırtma, Trol ve Dalgacı Davranış", description: "3 Gün", emoji: {name: "1️⃣"} , value: "1", date: "3d", type: 12},
            { label: "Karşı Cinse Taciz Ve Rahatsız Edici Davranış", description: "7 Gün", emoji: {name: "2️⃣"} ,value: "2", date: "7d", type: 12},
            { label: `Ortamı (${ayarlar.serverName}) Kötülemek`, description: "5 Gün", emoji: {name: "3️⃣"} ,value: "3", date: "5d", type: 12},
            { label: "Küfür, Argo, Hakaret ve Rahatsız Edici Davranış", description: "1 Gün", emoji: {name: "4️⃣"} ,value: "4", date: "1d", type: 12},
            { label: "Dini, Irki ve Siyasi değerlere Hakaret", description: "10 Gün", emoji: {name: "5️⃣"} ,value: "5", date: "10d", type: 12},
            { label: "Etkinliği Sabote Edicek Şekilde Davranmak", description: "3 Gün", emoji: {name: "6️⃣"}, value: "6", date: "3d", type: 12},
        ]
        
        // V14 ButtonBuilder Kullanımı
        let jailButton = new ButtonBuilder()
        .setCustomId(`onayla`)
        .setLabel(await ETKINLIK.findById(uye.id) ? `Aktif Cezalandırılması Mevcut!` : 'Cezalandırmayı Onaylıyorum!')
        .setEmoji(message.guild.emojiGöster(emojiler.Cezalandırıldı) || '🚨')
        .setStyle(ButtonStyle.Secondary) // V14 Enum
        .setDisabled(await ETKINLIK.findById(uye.id) ? true : false );
        
        let iptalButton =  new ButtonBuilder()
        .setCustomId(`iptal`)
        .setLabel('İşlemi İptal Et')
        .setEmoji(message.guild.emojiGöster(emojiler.Iptal) || '❌')
        .setStyle(ButtonStyle.Danger); // V14 Enum
        
        // V14 ActionRowBuilder Kullanımı
        let jailOptions = new ActionRowBuilder().addComponents(
            jailButton,
            iptalButton
        );

        // V14 setAuthor({ name, iconURL }) kullanımı
        let embed = new genEmbed().setAuthor({ 
            name: uye.user.tag, 
            iconURL: uye.user.displayAvatarURL({dynamic: true}) 
        }).setDescription(`Belirtilen ${uye} isimli üyeyi etkinliklerden cezalandırmak istiyor musun?`);

        let msg = await message.reply({embeds: [embed], components: [jailOptions]}).catch(err => {})

        const filter = i => i.user.id == message.member.id 
        const collector = msg.createMessageComponentCollector({ filter, errors: ["time"], max: 3, time: 30000 })

        collector.on('collect', async i => {
            if (i.customId === `onayla`) {
                
                // V14 Select Menu Options Mapping
                const v14SelectOptions = sebeps.filter(x => x.type == 12).map(s => ({
                    label: s.label,
                    description: s.description,
                    value: s.value,
                    emoji: s.emoji.name
                }));

                // V14 StringSelectMenuBuilder
                let selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`sebep`)
                    .setPlaceholder(`${uye.user.tag} için ceza sebebi belirtin!`)
                    .addOptions(v14SelectOptions);

                let selectRow = new ActionRowBuilder().addComponents(selectMenu);
                
                let selectEmbed = new genEmbed().setAuthor({ 
                    name: uye.user.tag, 
                    iconURL: uye.user.displayAvatarURL({dynamic: true}) 
                }).setDescription(`Belirlenen ${uye} isimli üyesini hangi sebep ile etkinliklerden cezalandırmak istiyorsun?`);

                i.update({
                    embeds: [selectEmbed], 
                    components: [selectRow]
                }).catch(err => {})

            } else if (i.customId === `sebep`) {
                let seçilenSebep = sebeps.find(x => x.value == i.values[0])
                if(seçilenSebep) {
                    i.deferUpdate() 
                    msg.delete().catch(err => {})
                    message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {})
                    // addPunitives custom fonksiyon olduğu varsayılmıştır.
                    return uye.addPunitives(seçilenSebep.type, message.member, seçilenSebep.label, message, seçilenSebep.date)
                } else {
                    return i.update({components: [], embeds: [ new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Iptal) || '❌'} İşlem sırasında hata oluştu lütfen bot sahibine başvurun.`)]})
                }
            } else if (i.customId === `iptal`) {
                msg.delete().catch(err => {})
                return await i.update({ 
                    content: `${message.guild.emojiGöster(emojiler.Iptal) || '❌'} ${uye} isimli üyenin **${aktivite}** etkinliğinden cezalandırılma işlemi başarıyla iptal edildi.`, 
                    components: [], 
                    embeds: [] , 
                    ephemeral: true
                });
            }
        });
        
        collector.on("end", async collected => {
            // Süre dolduğunda komponentleri kaldır.
            msg.edit({ components: [] }).catch(err => {})
        })
    }
};