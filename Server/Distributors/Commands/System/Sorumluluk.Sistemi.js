const { 
    Client, 
    Message, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    InteractionType // Modal göndermek için gerekli
} = require("discord.js");
const Users = require('../../../../Global/Databases/Client.Users');
const moment = require("moment");
const { genEmbed } = require("../../../../Global/İnit/Embed");

require("moment-duration-format");
const mongoose = require("mongoose");
let Select = new Map()

// Sorumluluk şeması
const Sorumluluk = require('../../../../Global/Databases/Guild.Responsibility');

// Varsayılan global değişkenler
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌', Tag: '' }; 
const ayarlar = global.ayarlar || { serverName: "SUNUCU_ADI" }; 
const roller = global.roller || { altilkyetki: "ALT_ILK_YETKI_ROL_ID" }; 
const cevaplar = global.cevaplar || { prefix: "prefix" }; 
const sistem = global.sistem || { SERVER: { ID: "SUNUCU_ID" } };


module.exports = {
    Isim: "sorumluluk",
    Komut: ["sorumluluk", "sorumlu"],
    Kullanim: "sorumluluk",
    Aciklama: "Sorumluluk sistemini yönetir ve başvuru panelini kurar.",
    Kategori: "diğer",
    Extend: true,
    
    /**
     * @param {Client} client 
     */
    onLoad: function (client) {
        
        // Emoji Erişimi için Güvenli Fonksiyonlar
        const getEmoji = (emojiName) => {
             const emoji = emojiler[emojiName];
             if (client.guilds.cache.get(sistem.SERVER.ID)?.emojis.cache.has(emoji)) {
                 return client.guilds.cache.get(sistem.SERVER.ID).emojis.cache.get(emoji).toString();
             }
             return emojiName === 'Onay' ? '✅' : emojiName === 'Iptal' ? '❌' : '';
        }

        // --- INTERACTION CREATE LISTENER (V14) ---
        client.on('interactionCreate', async (i) => {
            
            // Sorumluluk Başvuru Select Menu İşlemi
            if (i.isStringSelectMenu() && i.customId === "sorumluluk_sistem") {
                await i.deferUpdate(); // Select menü etkileşimini ertele

                let _data = await Sorumluluk.find({});
                let arr = [];
                
                _data.map(d => {
                    arr.push({
                        name: d.name,
                        value: d.role,
                        leaders: d.leaders
                    })
                });

                const guild = client.guilds.cache.get(i.guildId);
                if(!guild) return;
                const uye = guild.members.cache.get(i.user.id);
                if(!uye) return;
                
                let _get = arr.find(x => i.values[0] == x.value);
                
                if(_get) {
                    Select.set(uye.id, {
                        name: _get.name,
                        role: _get.value,
                        leaders: _get.leaders 
                    });

                    // MODAL OLUŞTURMA (V14)
                    const modal = new ModalBuilder()
                        .setCustomId('sorumlulukBasvuru')
                        .setTitle(`Sorumluluk Başvurusu: ${_get.name}`);
                    
                    const isimYasInput = new TextInputBuilder()
                        .setCustomId('isimyas')
                        .setLabel('İsiminiz ve yaşınız?')
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(5)
                        .setMaxLength(25)
                        .setPlaceholder('Örn: Acar 20')
                        .setRequired(true);

                    const referansInput = new TextInputBuilder()
                        .setCustomId('referans')
                        .setLabel('Referans (Opsiyonel)')
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(0) // Minimum 5'ten 0'a düşürüldü, required false olduğu için
                        .setMaxLength(100)
                        .setPlaceholder('Örn: acar#0001/ID')
                        .setRequired(false);
                    
                    const nedenInput = new TextInputBuilder()
                        .setCustomId('sorumluluk')
                        .setLabel('Bu sorumluluğu neden istiyorsunuz?')
                        .setStyle(TextInputStyle.Paragraph) // LONG yerine Paragraph
                        .setMinLength(5)
                        .setMaxLength(500)
                        .setPlaceholder('Açıklayın...')
                        .setRequired(true);
                        
                    // Bileşenleri modal'a ekle (Her bir input bir ActionRow içinde olmalı)
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(isimYasInput),
                        new ActionRowBuilder().addComponents(referansInput),
                        new ActionRowBuilder().addComponents(nedenInput)
                    );

                    await i.showModal(modal);
                }
            }
            
            // --- MODAL SUBMIT İŞLEMLERİ (V14) ---
            if (i.type === InteractionType.ModalSubmit) {
                
                const guild = client.guilds.cache.get(sistem.SERVER.ID);
                const uye = guild ? guild.members.cache.get(i.user.id) : null;
                
                if (i.customId == "sorumluluk-kaldır") {
                    // Burası orijinal kodda boştu, işlem eklenmedi.
                }

                // Sorumluluk Başvuru İşlemi
                if (i.customId == "sorumlulukBasvuru") {
                    if (!guild || !uye) {
                        return i.reply({ content: `Sistemsel hata oluştu.`, ephemeral: true });
                    }
                    
                    const logKanalı = guild.channels.cache.find(x => x.name === "başvuru-log"); // kanalBul yerine cache.find
                    if (!logKanalı) {
                        return i.reply({ content: `Başvuru kanalı bulunmadığından dolayı, işleminize devam edemiyoruz. ${cevaplar.prefix}`, ephemeral: true });
                    }
                    
                    const isimyas = i.fields.getTextInputValue('isimyas'); 
                    const sorumluluk = i.fields.getTextInputValue('sorumluluk'); 
                    const refernas = i.fields.getTextInputValue('referans');
                    
                    let getir = Select.get(uye.id);
                    if (!getir) {
                        return i.reply({ content: `Sistemsel bir hata oluştu. ${cevaplar.prefix}`, ephemeral: true });
                    }
                    
                    const sorumlulukIsmi = getir.name;
                    const sorumlulukRolü = getir.role;
                    const Selector = getir.leaders || [];
                    
                    if (uye.roles.cache.has(sorumlulukRolü)) {
                        return i.reply({ content: `Üzerinizde bu sorumluluk rolü bulunduğu için işlem iptal edildi. ${cevaplar.prefix}`, ephemeral: true });
                    }
                    
                    const altYetki = guild.roles.cache.get(roller.altilkyetki);
                    
                    // Embed oluşturma (V14)
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: uye.user.tag, iconURL: uye.user.displayAvatarURL({ dynamic: true }) })
                        .setDescription(`${uye} isimli üye (**${sorumlulukIsmi}**) ${guild.roles.cache.get(sorumlulukRolü)} rolü için <t:${Math.floor(Date.now() / 1000)}:F> tarihinde başvurdu.`)
                        .setFooter({ text: ayarlar.serverName + " • Yeni Sorumluluk Başvurusu!", iconURL: uye.user.displayAvatarURL({ dynamic: true }) });
                    
                    // Alan Ekleme
                    const referansInfo = refernas ? 
                        (guild.members.cache.find(x => x.user.tag == refernas || x.user.username.includes(refernas) || x.id == refernas) || refernas) : 
                        "Bir referans belirtilmemiş.";

                    embed.addFields(
                        { 
                            name: `Başvuru Bilgisi`, 
                            value: `> İsim & Yaş: ${isimyas}\n> Referans: ${referansInfo}\n> Neden istiyor? ${sorumluluk}` 
                        }
                    );

                    const yetkiler = uye.roles.cache.filter(rol => altYetki && altYetki.position <= rol.position);

                    if (yetkiler.size > 0) {
                        embed.addFields(
                            { 
                                name: `Üzerindeki Yetki Rolleri`, 
                                value: yetkiler.map(x => x).join("\n") 
                            }
                        );
                    }
                    
                    // Log kanalına gönderme
                    const mentionContent = Selector.map(x => guild.roles.cache.get(x) || `<@&${x}>`).join(", ");
                    logKanalı.send({ content: mentionContent, embeds: [embed] }).catch(e => {});

                    Select.delete(uye.id);
                    return i.reply({ content: `Başarıyla ${guild.roles.cache.get(sorumlulukRolü)} rolüne başvurunuz iletilmiştir! Gerekli kontrollerden ve denetimlerden sonra ${mentionContent} rolüne sahip yöneticiler seninle ilgilenecektir. Tebrikler!`, ephemeral: true });
                }


                // Sorumluluk Ekleme İşlemi
                if (i.customId == "sorumluluk-ekle") {
                    if (!guild || !uye) {
                        return i.reply({ content: `Sistemsel hata oluştu.`, ephemeral: true });
                    }
                    
                    const name = i.fields.getTextInputValue('name');
                    const role = i.fields.getTextInputValue('role');
                    const leaders = i.fields.getTextInputValue('leaders');

                    if (role && !guild.roles.cache.get(role)) {
                        return i.reply({ content: `Belirtilen sorumluluk rolü sunucuda bulunamadı.`, ephemeral: true });
                    }

                    const leaderRoles = leaders ? leaders.split(' ') : [];
                    if (leaderRoles.length > 0 && !leaderRoles.every(x => guild.roles.cache.get(x))) {
                        return i.reply({ content: `Belirtilen sorumluluk lider rollerinden bazıları sunucuda bulunamadı.`, ephemeral: true });
                    }

                    await Sorumluluk.updateOne({ role: role }, { // Rol ID'si üzerinden güncelleme/ekleme
                        $set: {
                            name: name,
                            role: role,
                            leaders: leaderRoles,
                            date: Date.now(),
                            created: uye.id,
                        }
                    }, { upsert: true });

                    const unixTime = Math.floor(Date.now() / 1000);
                    return i.reply({ content: `${getEmoji('Onay')} Başarıyla **${name}** sorumluluğu başarıyla <t:${unixTime}:R> eklendi.`, ephemeral: true });
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

        // --- DM KONTROLÜ ---
        if (!message.guild || !message.member) return;

        // Emoji Erişimi için Güvenli Fonksiyonlar (Aynı fonksiyonu tekrar tanımlamaya gerek yok, sadece erişimini gösterdim)
        const getEmoji = (emojiName) => {
             const emoji = emojiler[emojiName];
             if (message.guild.emojis.cache.has(emoji)) {
                 return message.guild.emojis.cache.get(emoji).toString();
             }
             return emojiName === 'Onay' ? '✅' : emojiName === 'Tag' ? '' : '❌';
        }
        
        let Buttons = [
            new ButtonBuilder()
                .setLabel("Oluştur")
                .setCustomId("add")
                .setEmoji("943265806341513287") // Örnek Emoji ID
                .setStyle(ButtonStyle.Success),
        ];

        let _data = await Sorumluluk.find({});

        if(_data && _data.length > 0) {
            Buttons.push(
                new ButtonBuilder()
                    .setLabel("Kur")
                    .setEmoji("943286195406925855") // Örnek Emoji ID
                    .setCustomId("install")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setLabel("Listele")
                    .setEmoji("943290426562076762") // Örnek Emoji ID
                    .setCustomId("list")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setLabel("Kaldır")
                    .setEmoji("943265806547038310") // Örnek Emoji ID
                    .setCustomId("remove")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setLabel("Tüm Sorumlulukları Temizle")
                    .setCustomId("reset")
                    .setEmoji("927314290732576809") // Örnek Emoji ID
                    .setStyle(ButtonStyle.Danger),
            );
        }

        let msg = await message.reply({ content: `Sorumluluk sistemi yüklenirken bekleyin...` });
        let Row = new ActionRowBuilder().addComponents(Buttons); // V14: MessageActionRow -> ActionRowBuilder
        
        msg.edit({ 
            embeds: [new genEmbed().setDescription(`Aşağıda bulunan düğmeler ile sorumluluk sistemini yönetebilirsin.`)], 
            content: null, 
            components: [Row] 
        }).catch(e => {});

        var filter = (i) => i.user.id == message.author.id;
        
        let collector = msg.createMessageComponentCollector({ filter: filter, time: 120000 });

        collector.on('end', (c, reason) => {
            if(reason == "time") {
                msg.edit({ content: `Sorumluluk sistemi işlem yapma süresi doldu.`, components: [] }).catch(e => {});
                setTimeout(() => {
                    msg.delete().catch(err => {});
                }, 7500);
            }
        });
        
        collector.on('collect', async (i) => {
            await i.deferUpdate(); // Tüm buton/menü etkileşimlerini ertele

            // --- LİSTELEME ---
            if(i.customId == "list") {
                let _get = await Sorumluluk.find({});
                let _data = _get.map((x, index) => {
                    const createdMember = message.guild.members.cache.get(x.created);
                    return `**${x.name}**: \nSorumlu Rolü: ${message.guild.roles.cache.get(x.role) || "@Rol Bulunamadı"}\nLider Rolü(leri): ${x.leaders.map(x => message.guild.roles.cache.get(x) || "@Rol Bulunamadı").join(", ")}\nOluşturan: ${createdMember || `<@${x.created}>`} (<t:${Math.floor(x.date / 1000)}:R>)`
                });

                msg.edit({ 
                    embeds: [new genEmbed().setDescription(`Aşağıda **${message.guild.name}** sunucusuna ait sorumluluklar listelenmektedir.\n\n${_data.join("\n──────────────────────────\n")}`)], 
                    content: null, 
                    components: [] 
                }).catch(e => {});
            }

            // --- TEMİZLEME (RESET) ---
            if(i.customId == "reset") {
                await Sorumluluk.deleteMany({});
                msg.edit({ 
                    embeds: [new genEmbed().setDescription(`Başarıyla tüm sorumluluklar sıfırlandı. ${getEmoji('Onay')}`)], 
                    content: null, 
                    components: [] 
                }).catch(e => {});
                
                setTimeout(() => {
                    msg.edit({ embeds: [new genEmbed().setDescription(`Aşağıda bulunan düğmeler ile sorumluluk sistemini yönetebilirsin.`)], content: null, components: [Row] }).catch(e => {});
                }, 7500);
            }

            // --- SORUMLULUK SİLME (SELECT MENÜDEN) ---
            if(i.customId == "silSorumluluk" && i.isStringSelectMenu()) {
                let roleIdToDelete = i.values[0];
                let _get = await Sorumluluk.findOne({role: roleIdToDelete});

                await Sorumluluk.deleteOne({role: roleIdToDelete});

                msg.edit({
                    embeds: [new genEmbed().setDescription(`Başarıyla **${_get ? _get.name : "@"}** sorumluluğu silindi. ${getEmoji('Onay')}`)], 
                    content: null, 
                    components: [] 
                }).catch(e => {});
                
                setTimeout(() => {
                    msg.edit({ embeds: [new genEmbed().setDescription(`Aşağıda bulunan düğmeler ile sorumluluk sistemini yönetebilirsin.`)], content: null, components: [Row] }).catch(e => {});
                }, 3500);
            }

            // --- KALDIRMA (REMOVE BUTONU) ---
            if(i.customId == "remove") {
                let _data = await Sorumluluk.find({});
                
                if(_data && _data.length > 0) { 
                    let arr = [];
                    _data.forEach(x => {
                        arr.push({
                            label: x.name,
                            value: x.role,
                            description: `${message.guild.roles.cache.get(x.role) ? message.guild.roles.cache.get(x.role).name : `@Rol Bulunamadı`}`
                        });
                    });

                    let Roww = new ActionRowBuilder().addComponents( // V14: MessageActionRow -> ActionRowBuilder
                        new StringSelectMenuBuilder() // V14: MessageSelectMenu -> StringSelectMenuBuilder
                            .setCustomId("silSorumluluk")
                            .setPlaceholder("Silmek istediğin sorumluluğu seç...")
                            .setOptions(arr)
                    );

                    msg.edit({
                        embeds: [new genEmbed().setDescription(`Aşağıda bulunan ve listelenmekte olan sorumluluklardan hangisini silmek istersin?`).setFooter({text: "Minimum 1 tane rol kalana kadar rahatlıkla silebilirsiniz."})], 
                        content: null, 
                        components: [Roww]
                    }).catch(e => {});
                } else {
                    i.followUp({ content: `Silinebilcek bir sorumluluk bulunamadığından işlem iptal edildi.`, ephemeral: true }).catch(e => {});
                }
            }

            // --- KURULUM (INSTALL BUTONU) ---
            if(i.customId == "install") {
                let _data = await Sorumluluk.find({});
                
                if(_data && _data.length > 0) { 
                    let arr = [];
                    _data.forEach(x => {
                        arr.push({
                            label: x.name,
                            value: x.role,
                            emoji: { id: "963745852327886888" }, // Örnek Emoji ID
                            description: `${message.guild.roles.cache.get(x.role) ? message.guild.roles.cache.get(x.role).name : `@Rol Bulunamadı`} rolüne başvuru açıktır.`
                        });
                    });

                    let Roww = new ActionRowBuilder().addComponents( // V14: MessageActionRow -> ActionRowBuilder
                        new StringSelectMenuBuilder() // V14: MessageSelectMenu -> StringSelectMenuBuilder
                            .setCustomId("sorumluluk_sistem")
                            .setPlaceholder("Başvurmak istediğiniz sorumluluk seçin...")
                            .setOptions(arr)
                    );

                    // Yönetim mesajını düzenle
                    msg.edit({ embeds: [new genEmbed().setDescription(`Başarıyla sorumluluk sistemi kurulumu tamamlandı. ${getEmoji('Onay')}`)], content: null, components: [] }).catch(e => {});
                    setTimeout(() => {
                        msg.edit({ embeds: [new genEmbed().setDescription(`Aşağıda bulunan düğmeler ile sorumluluk sistemini yönetebilirsin.`)], content: null, components: [Row] }).catch(e => {});
                    }, 3500);

                    // Başvuru mesajını kanala gönder
                    message.channel.send({ 
                        content: `**Merhaba!** ${ayarlar.serverName} ${getEmoji('Tag')}\nAşağıda bulunan başvurusu açık sorumluluk rollerinden başvurmak istediğinizi seçiniz.`, 
                        components: [Roww] 
                    }).catch(e => {});
                    
                    i.followUp({ content: `Başarıyla ayarlamış olduğunuz sorumluluk başvuru sistemi açıldı. ${getEmoji('Onay')}`, ephemeral: true }).catch(e => {});

                } else {
                    i.followUp({ content: `Kurulum yapabilmeniz için en az bir sorumluluk oluşturmalısınız.`, ephemeral: true }).catch(e => {});
                }
            }
            
            // --- EKLEME (ADD BUTONU) ---
            if(i.customId == "add") {
                msg.delete().catch(err => {});
                
                // MODAL OLUŞTURMA (V14)
                const modal = new ModalBuilder()
                    .setCustomId('sorumluluk-ekle')
                    .setTitle(`Sorumluluk Ekleme`);
                
                const nameInput = new TextInputBuilder()
                    .setCustomId('name')
                    .setLabel('Sorumluluk Ismi')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(3)
                    .setMaxLength(120)
                    .setPlaceholder(`Örn: Davet Sorumlusu`)
                    .setRequired(true);

                const roleInput = new TextInputBuilder()
                    .setCustomId('role')
                    .setLabel('Sorumluluk Rolü (ID)')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(3)
                    .setMaxLength(120)
                    .setPlaceholder(`Örn: 945635133757587457`)
                    .setRequired(true);
                
                const leadersInput = new TextInputBuilder()
                    .setCustomId('leaders')
                    .setLabel('Sorumluluk Sorumluları Rolleri (ID)')
                    .setStyle(TextInputStyle.Paragraph) // LONG yerine Paragraph
                    .setMinLength(3)
                    .setMaxLength(1024)
                    .setPlaceholder(`Rol ID'si verilmelidir. Birden fazla için aralarına boşluk koyunuz.`)
                    .setRequired(true);
                    
                // Bileşenleri modal'a ekle
                modal.addComponents(
                    new ActionRowBuilder().addComponents(nameInput),
                    new ActionRowBuilder().addComponents(roleInput),
                    new ActionRowBuilder().addComponents(leadersInput)
                );

                await i.showModal(modal);
            }
        });
    }
};