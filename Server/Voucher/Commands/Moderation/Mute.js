const { 
    Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    StringSelectMenuBuilder, ButtonStyle, PermissionFlagsBits
} = require("discord.js");
const Mute = require('../../../../Global/Databases/Punitives.Mutes');
const voiceMute = require('../../../../Global/Databases/Punitives.Vmutes');
const ms = require('ms');
const { genEmbed } = require("../../../../Global/İnit/Embed");

// Global değişkenler tanımlanmalı
let selectSebep;
let selectMute;
const getLimitVoiceMute = new Map();
const getLimitMute = new Map();

module.exports = {
    Isim: "mute",
    Komut: ["chatmute", "voicemute","sesmute","sustur","sessustur","vmute","cmute","metinsustur","chatsustur","v-mute","c-mute"],
    Kullanim: "mute <@andale/ID>",
    Aciklama: "Belirlenen üyeyi ses ve metin kanallarında susturur.",
    Kategori: "yetkili",
    Extend: true,
    
    /**
    * @param {Client} client 
    */
    onLoad: function (client) {
        // Map'lerin client'a bağlanması gerekebilir, ancak mevcut kodda global tutulmuş.
        // client.fetchJailLimit = getLimitMute gibi bir atama yapılması gerekebilir.
    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */

    onRequest: async function (client, message, args) {
        // V14 Yetki Kontrolü için PermissionFlagsBits kullanıldı
        const hasAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
        
        if(!roller.muteHammer.some(oku => message.member.roles.cache.has(oku)) && !roller.voiceMuteHammer.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku))  && !hasAdmin) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(uye.user.bot) return message.reply(cevaplar.bot).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(!uye.manageable) return message.reply(cevaplar.dokunulmaz).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.member.roles.highest.position <= uye.roles.highest.position) return message.reply(cevaplar.yetkiust).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Yetki Kontrolü Fonksiyonları
        const canMute = roller.muteHammer.some(oku => message.member.roles.cache.has(oku)) || roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku))  || hasAdmin;
        const canVoiceMute = roller.voiceMuteHammer.some(oku => message.member.roles.cache.has(oku)) || roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku))  || hasAdmin;
        
        const sebeps = [
            // Chat Mute (Type 5)
            { label: "Kışkırtma, Trol, Dalgacı ve Ortam Bozucu Davranış", description: "10 Dakika", emoji: {name: "1️⃣"} , value: "1", date: "10m", type: 5},
            { label: "Dizi, Film ve Hikayeler Hakkında Spoiler Vermek", description: "5 Dakika", emoji: {name: "2️⃣"} ,value: "2", date: "5m", type: 5},
            { label: "Küçümseyici Ve Aşalayıcı Davranış", description: "20 Dakika", emoji: {name: "3️⃣"} ,value: "3", date: "20m", type: 5},
            { label: "Küfür, Argo, Hakaret ve Rahatsız Edici Davranış", description: "20 Dakika", emoji: {name: "4️⃣"} ,value: "4", date: "20m", type: 5},
            { label: "Ailevi Değerlere Küfür/Hakaret", description: "15 Dakika", emoji: {name: "5️⃣"} ,value: "5", date: "15m", type: 5},
            { label: `Ortamı (${ayarlar.serverName}) Kötülemek`, description: "30 Dakika", emoji: {name: "6️⃣"} ,value: "6", date: "30m", type: 5},
            { label: "Seste Yaşanan Olayları Chat'e Yansıtmak ve Uzatmak", description: "10 Dakika", emoji: {name: "7️⃣"} ,value: "7", date: "10m", type: 5},
            // Voice Mute (Type 4)
            { label: "Kışkırtma, Trol, Dalgacı ve Ortam Bozucu Davranış", description: "10 Dakika", emoji: {name: "1️⃣"} , value: "8", date: "10m", type: 4},
            { label: "Küçümseyici Ve Aşalayıcı Davranış", description: "20 Dakika", emoji: {name: "2️⃣"} ,value: "9", date: "20m", type: 4},
            { label: "Özel Odalara Uyarılmalara Rağmen İzinsiz Giriş", description: "30 Dakika", emoji: {name: "3️⃣"} ,value: "10", date: "30m", type: 4},
            { label: "Küfür, Argo, Hakaret ve Rahatsız Edici Davranış", description: "20 Dakika", emoji: {name: "4️⃣"} ,value: "11", date: "20m", type: 4},
            { label: "Soundpad, Efekt ve Ses Programları Kullanımı", description: "10 Dakika", emoji: {name: "5️⃣"} ,value: "12", date: "10m", type: 4},
            { label: "Ailevi Değerlere Küfür/Hakaret", description: "15 Dakika", emoji: {name: "6️⃣"} ,value: "13", date: "15m", type: 4},
            { label: `Ortamı (${ayarlar.serverName}) Kötülemek`, description: "30 Dakika", emoji: {name: "7️⃣"} ,value: "14", date: "30m", type: 4} 
        ]

        const isKurucuOrAdmin = roller.kurucuRolleri.some(x => message.member.roles.cache.has(x)) || ayarlar.staff.includes(message.member.id) || hasAdmin;

        // --- Chat Mute Button (V14) ---
        let chatMuteLabel = `Metin Kanallarında Sustur`;
        if (canMute) {
            if (await Mute.findById(uye.id)) chatMuteLabel += ` (Aktif Cezası Var!)`;
            else if (getLimitMute.get(message.member.id) >= ayarlar.muteLimit) chatMuteLabel += ` (Limit Doldu ${getLimitMute.get(message.member.id) || 0}/${ayarlar.muteLimit})`;
            else if (Number(ayarlar.muteLimit) && !isKurucuOrAdmin) chatMuteLabel += ` (Limit: ${getLimitMute.get(message.member.id) || 0}/${ayarlar.muteLimit})`;
        } else {
            chatMuteLabel += " (Yetki Yok)";
        }

        let chatMuteDisabled = !canMute || await Mute.findById(uye.id) || (getLimitMute.get(message.member.id) >= ayarlar.muteLimit);

        let chatMuteButton = new ButtonBuilder()
            .setCustomId(`chatmute`)
            .setLabel(chatMuteLabel)
            .setEmoji(message.guild.emojiGöster(emojiler.chatSusturuldu) || '💬')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(chatMuteDisabled);

        // --- Voice Mute Button (V14) ---
        let voiceMuteLabel = `Ses Kanallarında Sustur`;
        if (canVoiceMute) {
            if (await voiceMute.findById(uye.id)) voiceMuteLabel += ` (Aktif Cezası Var!)`;
            else if (getLimitVoiceMute.get(message.member.id) >= ayarlar.voiceMuteLimit) voiceMuteLabel += ` (Limit Doldu ${getLimitVoiceMute.get(message.member.id) || 0}/${ayarlar.voiceMuteLimit})`;
            else if (Number(ayarlar.voiceMuteLimit) && !isKurucuOrAdmin) voiceMuteLabel += ` (Limit: ${getLimitVoiceMute.get(message.member.id) || 0}/${ayarlar.voiceMuteLimit})`;
        } else {
            voiceMuteLabel += " (Yetki Yok)";
        }
        
        let voiceMuteDisabled = !canVoiceMute || await voiceMute.findById(uye.id) || (getLimitVoiceMute.get(message.member.id) >= ayarlar.voiceMuteLimit);

        let voiceMuteButton = new ButtonBuilder()
            .setCustomId(`voicemute`)
            .setLabel(voiceMuteLabel)
            .setEmoji(message.guild.emojiGöster(emojiler.sesSusturuldu) || '🔊')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(voiceMuteDisabled);

        // --- İptal Button (V14) ---
        let iptalButton = new ButtonBuilder()
            .setCustomId(`iptal`)
            .setLabel('İşlemi İptal Et')
            .setEmoji(message.guild.emojiGöster(emojiler.Iptal) || '❌')
            .setStyle(ButtonStyle.Danger);

        // --- Action Row (V14) ---
        let muteOptions = new ActionRowBuilder().addComponents(
            chatMuteButton,
            voiceMuteButton,
            iptalButton,
        );

        // --- İlk Mesaj (V14 Embed) ---
        let embed = new genEmbed().setAuthor({ 
            name: uye.user.tag, 
            iconURL: uye.user.displayAvatarURL({dynamic: true}) 
        }).setDescription(`Belirtilen ${uye} isimli üyeyi hangi türde susturmak istiyorsun?`);

        let msg = await message.reply({embeds: [embed], components: [muteOptions]}).catch(err => {})

        const filter = i => i.user.id == message.member.id 
        const collector = msg.createMessageComponentCollector({ filter, errors: ["time"], max: 3, time: 30000 })

        collector.on('collect', async i => {
            if (i.customId === `chatmute` || i.customId === `voicemute`) {
                selectMute = i.customId === `chatmute` ? 5 : 4;
                const type = selectMute;

                const v14SelectOptions = sebeps.filter(x => x.type === type).map(s => ({
                    label: s.label,
                    description: s.description,
                    value: s.value,
                    emoji: s.emoji.name ? { name: s.emoji.name } : undefined
                }));

                // V14 StringSelectMenuBuilder
                let selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`sebep`)
                    .setPlaceholder(`Susturmak istediğiniz sebebi seçinin.`)
                    .addOptions(v14SelectOptions);

                let selectRow = new ActionRowBuilder().addComponents(selectMenu);
                
                let selectEmbed = new genEmbed().setAuthor({ 
                    name: uye.user.tag, 
                    iconURL: uye.user.displayAvatarURL({dynamic: true}) 
                }).setDescription(`Belirlenen ${uye} isimli üyesini hangi sebep ile **${type === 5 ? 'metin kanallarından' : 'ses kanallarından'}** susturmamı istiyorsun?`);

                i.update({
                    embeds: [selectEmbed], 
                    components: [selectRow]
                }).catch(err => {})

            } else if (i.customId === `sebep`) {
                let seçilenSebep = sebeps.find(x => x.value == i.values[0])
                if(seçilenSebep) {
                    const isVoiceMute = selectMute == 4;
                    const limitMap = isVoiceMute ? getLimitVoiceMute : getLimitMute;
                    const limitValue = isVoiceMute ? ayarlar.voiceMuteLimit : ayarlar.muteLimit;
                    const muteModel = isVoiceMute ? voiceMute : Mute;

                    let muteCheck = await muteModel.findById(uye.id)
                    if(muteCheck) return i.reply({content: `Belirtiğin ${uye} üyesinin, aktif bir susturulma cezası mevcut!`, ephemeral: true}),msg.delete().catch(err => {}),message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌')

                    // Limit Kontrolü ve Uygulama
                    if(Number(limitValue)) {
                        if(!isKurucuOrAdmin) {
                            limitMap.set(`${message.member.id}`, (Number(limitMap.get(`${message.member.id}`) || 0)) + 1)
                            setTimeout(() => {
                                limitMap.set(`${message.member.id}`, (Number(limitMap.get(`${message.member.id}`) || 0)) - 1)
                            },1000*60*5) // 5 dakika
                        }
                    }
                    
                    i.deferUpdate()  
                    msg.delete().catch(err => {})
                    message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {})
                    
                    // addPunitives custom fonksiyonu çağrılır
                    return uye.addPunitives(seçilenSebep.type, message.member, seçilenSebep.label, message, seçilenSebep.date)
                } else {
                    return i.update({components: [], embeds: [ new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Iptal) || '❌'} İşlem sırasında hata oluştu lütfen bot sahibine başvurun.`)]})
                }
            } else if (i.customId === `iptal`) {
                msg.delete().catch(err => {})
                return await i.reply({ 
                    content: `${message.guild.emojiGöster(emojiler.Onay) || '✅'} Başarıyla mute işlemleri menüsü kapatıldı.`, 
                    components: [], 
                    embeds: [], 
                    ephemeral: true 
                });
            }
        });
        
        collector.on("end", async collected => {
            msg.edit({ components: [] }).catch(err => {})
        })
    }
};

// Not: Kullanılmayan yetkiKontrol fonksiyonu kaldırılmıştır.