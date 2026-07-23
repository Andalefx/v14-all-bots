const { 
    Client, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    PermissionFlagsBits, Util // V14'te Util'i bu şekilde içe aktarmanız gerekir.
} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Kalkmaz = require('../../../../Global/Databases/Punitives.Forcebans');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");
const getLimit = new Map();

module.exports = {
    Isim: "banlist",
    Komut: ["banlistesi","yasaklamalar","ban-list"],
    Kullanim: "yasaklamalar",
    Aciklama: "Sunucudaki yasaklı üyeleri listeler.",
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
        if(!ayarlar && !roller && !roller.banHammer || !roller.üstYönetimRolleri || !roller.yönetimRolleri || !roller.kurucuRolleri || !roller.altYönetimRolleri) return message.reply(cevaplar.notSetup)
        
        // V14 Yetki Kontrolü
        const hasAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        if(!roller.banHammer.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !hasAdmin) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let toplamBan = 0
        await message.guild.bans.fetch().then(async (banned) => {
            toplamBan = banned.size
        })
        
        // V14 ButtonBuilder Kullanımı
        let buttons = [];

        buttons.push(
            new ButtonBuilder()
            .setCustomId("bans")
            .setLabel(toplamBan > 0 ? "⛔ Yasaklama" : "🔓 Yasaklama")
            .setDisabled(toplamBan > 0 ? false : true)
            .setStyle(toplamBan > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary),
        )

        let kalkmazYasaklama = await Kalkmaz.find()
        let forceBanList = '';
        
        if(kalkmazYasaklama && kalkmazYasaklama.length > 0) {
            // Buton listesine yeni butonu ekle
            buttons.push(
                new ButtonBuilder()
                .setCustomId("forcebans")
                .setLabel(kalkmazYasaklama.length > 0 ? `📛 Kalkmaz Yasaklama (${kalkmazYasaklama.length})` : "🔓 Kalkmaz Yasaklama")
                .setDisabled(kalkmazYasaklama.length > 0 ? false : true)
                .setStyle(kalkmazYasaklama.length > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary),
            ) 
            
            // Kalkmaz yasaklama listesini oluştur
            for (const uye of kalkmazYasaklama) {
                let hesap = await client.getUser(uye._id)
                if (hesap) forceBanList += `#${uye.No} | ${hesap.tag} (${hesap.id})\n`
            }
        }
        
        // V14 ActionRowBuilder Kullanımı
        let Row = new ActionRowBuilder().addComponents(buttons);
        
        let banList = '';
        if(toplamBan > 0) {
            const banned = await message.guild.bans.fetch();
            for (const ban of banned.values()) {
                let cezaBul = await Punitives.findOne({Member: ban.user.id, Type: "Yasaklama"})
                banList += `${cezaBul ? `#${cezaBul.No} |` : "Sağ-Tık |"} ${ban.user.tag} (${ban.user.id})\n`
            }
        }
        
        await message.reply({content: `:tada: Aşağıda \`${message.guild.name}\` sunucusuna ait yasaklamalar listelenmektedir.`, components: [Row]}).then(async (msg) => {
            message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {})
            
            const filter = i => i.user.id == message.member.id 
            const collector = msg.createMessageComponentCollector({ filter, errors: ["time"], time: 60000 })
            
            collector.on("collect", async (i) => {
                if(i.customId == "bans") {
                    if (banList.length > 0) {
                        try {
                            // Liste 2000 karakterden uzunsa bölme işlemi (Util.splitMessage V14 kullanımı)
                            const arr = Util.splitMessage(banList, { maxLength: 1950, char: "\n" });
                            await msg.edit({content: `:x: Aşağıda \`${message.guild.name}\` sunucusuna ait **yasaklı üyeler** listelenmektedir (**${toplamBan}**). \n\`\`\`${arr[0]}\`\`\``, components: []});
                            if (arr.length > 1) {
                                for (let j = 1; j < arr.length; j++) {
                                    message.channel.send(`\`\`\`${arr[j]}\`\`\``);
                                }
                            }
                        } catch (err) {
                            msg.edit({content: `:x: Aşağıda \`${message.guild.name}\` sunucusuna ait **yasaklı üyeler** listelenmektedir (**${toplamBan}**).\n\`\`\`${banList}\`\`\``, components: []});
                        }
                    } else {
                         msg.edit({content: `:x: Sunucuda herhangi bir **yasaklı üye** bulunmamaktadır.`, components: []});
                    }
                    i.deferUpdate().catch(err => {})

                }
                
                if(i.customId == "forcebans") {
                    if (forceBanList.length > 0) {
                        try {
                            // Liste 2000 karakterden uzunsa bölme işlemi (Util.splitMessage V14 kullanımı)
                            const arr = Util.splitMessage(forceBanList, { maxLength: 1950, char: "\n" });
                            await msg.edit({content: `:x: Aşağıda \`${message.guild.name}\` sunucusuna ait **kalkmaz yasaklanan üyeler** listelenmektedir (**${kalkmazYasaklama.length}**).\n\`\`\`${arr[0]}\`\`\``, components: []});
                             if (arr.length > 1) {
                                for (let j = 1; j < arr.length; j++) {
                                    message.channel.send(`\`\`\`${arr[j]}\`\`\``);
                                }
                            }
                        } catch (err) {
                            msg.edit({content: `:x: Aşağıda \`${message.guild.name}\` sunucusuna ait **kalkmaz yasaklanan üyeler** listelenmektedir (**${kalkmazYasaklama.length}**).\n\`\`\`${forceBanList}\`\`\``, components: []});
                        }
                    } else {
                        msg.edit({content: `:x: Sunucuda herhangi bir **kalkmaz yasaklı üye** bulunmamaktadır.`, components: []});
                    }
                    i.deferUpdate().catch(err => {})
                }
            })
            
            collector.on("end", i => {
                // Mesajı silmek yerine butonları kaldırmak daha iyi olabilir.
                msg.edit({ components: [] }).catch(err => {})
            })
        })
    }
};