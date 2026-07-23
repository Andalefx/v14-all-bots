const { 
    Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    StringSelectMenuBuilder, ButtonStyle, PermissionFlagsBits
} = require("discord.js");
const Jail = require('../../../../Global/Databases/Punitives.Jails')
const { genEmbed } = require("../../../../Global/İnit/Embed");
const getLimit = client.fetchJailLimit = new Map();

module.exports = {
    Isim: "jail",
    Komut: ["cezalı","cezalandır"],
    Kullanim: "cezalı <@andale/ID>",
    Aciklama: "Belirtilen üyeyi cezalandırır.",
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
        if(!ayarlar && !roller && !roller.jailHammer || !roller.üstYönetimRolleri || !roller.yönetimRolleri || !roller.kurucuRolleri || !roller.altYönetimRolleri) return message.reply(cevaplar.notSetup)
        
        // V14 Yetki Kontrolü
        const hasAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        if(!roller.jailHammer.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku))  && !hasAdmin) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(uye.user.bot) return message.reply(cevaplar.bot).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(!uye.manageable) return message.reply(cevaplar.dokunulmaz).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.member.roles.highest.position <= uye.roles.highest.position) return message.reply(cevaplar.yetkiust).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        const sebeps = [
            { label: "Kışkırtma, Trol ve Dalgacı Davranış", description: "3 Gün", emoji: {name: "1️⃣"} , value: "1", date: "3d", type: 3},
            { label: `Ortamı (${ayarlar.serverName}) Kötülemek`, description: "5 Gün", emoji: {name: "2️⃣"} ,value: "2", date: "5d", type: 3},
            { label: "Küfür, Argo, Hakaret ve Rahatsız Edici Davranış", description: "1 Gün", emoji: {name: "3️⃣"} ,value: "3", date: "1d", type: 3},
            { label: "Sunucu Düzeni Ve Huzursuzluk Yaratmak", description: "4 Gün", emoji: {name: "4️⃣"} ,value: "4", date: "4d", type: 3},
            { label: "Kayıt Odalarında Gereksiz Trol Yapmak", description: "3 Gün", emoji: {name: "5️⃣"}, value: "5", date: "3d", type: 3},
        ]
        
        // V14 ButtonBuilder Kullanımı
        let jailButton = new ButtonBuilder()
        .setCustomId(`onayla`)
        .setLabel(await Jail.findById(uye.id) ? `Aktif Cezalandırılması Mevcut!` : getLimit.get(message.member.id) >= ayarlar.jailLimit ? `Limit Doldu (${getLimit.get(message.member.id) || 0} / ${ayarlar.jailLimit})` : 'Cezalandırmayı Onaylıyorum!')
        .setEmoji(message.guild.emojiGöster(emojiler.Cezalandırıldı) || '🚨')
        .setStyle(ButtonStyle.Secondary) // V14 Enum
        .setDisabled(await Jail.findById(uye.id) ? true : getLimit.get(message.member.id) >= ayarlar.jailLimit ? true : false );
        
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

        // V14 EmbedBuilder ve setAuthor({ name, iconURL }) kullanımı
        let embed = new genEmbed().setAuthor({ 
            name: uye.user.tag, 
            iconURL: uye.user.displayAvatarURL({dynamic: true}) 
        }).setDescription(`Belirtilen ${uye} isimli üyeyi cezalandırmak istediğinize emin misiniz?`);

        let msg = await message.reply({embeds: [embed], components: [jailOptions]}).catch(err => {})

        const filter = i => i.user.id == message.member.id 
        const collector = msg.createMessageComponentCollector({ filter, errors: ["time"], max: 3, time: 30000 })

        collector.on('collect', async i => {
            if (i.customId === `onayla`) {
                
                // Limit Metni Hesaplama
                let limitText = !roller.kurucuRolleri.some(x => message.member.roles.cache.has(x)) && !ayarlar.staff.includes(message.member.id) && !hasAdmin ? 
                                Number(ayarlar.jailLimit) ? 
                                `Kullanılabilir Limit: \`${getLimit.get(message.member.id) || 0} / ${ayarlar.jailLimit}\`` : 
                                `` : 
                                ``;
                
                // V14 Select Menu Options Mapping
                const v14SelectOptions = sebeps.filter(x => x.type == 3).map(s => ({
                    label: s.label,
                    description: s.description,
                    value: s.value,
                    emoji: s.emoji.name ? { name: s.emoji.name } : undefined
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
                }).setDescription(`Belirtilen ${uye} isimli üyesini hangi sebep ile cezalandırmak istiyorsun?\n${limitText}`);


                i.update({
                    embeds: [selectEmbed], 
                    components: [selectRow]
                }).catch(err => {})

            } else if (i.customId === `sebep`) {
                let seçilenSebep = sebeps.find(x => x.value == i.values[0])
                if(seçilenSebep) {
                    
                    if(getLimit.get(message.member.id) >= ayarlar.jailLimit) return i.update({ content: `${message.guild.emojiGöster(emojiler.Iptal) || '❌'} ${uye} isimli üyenin cezalandırılma işlemi limit dolumundan dolayı iptal edildi.`, components: [], embeds: [] , ephemeral: true});
                    
                    // Limit Kontrolü ve Uygulama
                    if(Number(ayarlar.jailLimit)) {
                        if(!hasAdmin && !ayarlar.staff.includes(message.member.id) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) {
                            getLimit.set(`${message.member.id}`, (Number(getLimit.get(`${message.member.id}`) || 0)) + 1)
                            setTimeout(() => {
                                getLimit.set(`${message.member.id}`, (Number(getLimit.get(`${message.member.id}`) || 0)) - 1)
                            },1000*60*5)
                        }
                    }
                    
                    i.deferUpdate()  
                    msg.delete().catch(err => {})
                    message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {})
                    
                    // Custom fonksiyonların çalıştırılması (V14'e uyumluluk için varsayılmıştır)
                    uye.removeStaff()
                    uye.dangerRegistrant()
                    return uye.addPunitives(seçilenSebep.type, message.member, seçilenSebep.label, message, seçilenSebep.date)
                } else {
                    return i.update({components: [], embeds: [ new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Iptal) || '❌'} İşlem sırasında hata oluştu lütfen bot sahibine başvurun.`)]})
                }
            } else if (i.customId === `iptal`) {
                msg.delete().catch(err => {})
                return await i.update({ 
                    content: `Belirtilen ${uye} üyesinin cezalandırılma işlemi başarıyla iptal edildi.`, 
                    components: [], 
                    embeds: [] , 
                    ephemeral: true
                });
            }
        });
        
        collector.on("end", async collected => {
            // Süre dolduğunda butonları kaldırır.
            msg.edit({ components: [] }).catch(err => {})
        })
    }
};