const { 
    Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits, ButtonStyle 
} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Mute = require('../../../../Global/Databases/Punitives.Mutes');
const voiceMute = require('../../../../Global/Databases/Punitives.Vmutes');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "unmute",
    Komut: ["unchatmute", "susturmakaldır", "unsesmute", "sesmutekaldır"],
    Kullanim: "unmute <#No/@andale/ID>", // Kullanim güncellendi
    Aciklama: "Belirlenen üyenin metin ve/veya ses kanallarındaki susturmasını kaldırır.",
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
        // V14 Yetki Kontrolü
        const hasPermission = roller.muteHammer.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.voiceMuteHammer.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator);
                              
        if(!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let hedefArg = args[0];
        
        // Ceza Numarası Kontrolü
        if(Number(hedefArg)) {
            let cezanobul = await Mute.findOne({No: hedefArg}) || await voiceMute.findOne({No: hedefArg});
            if(cezanobul) hedefArg = cezanobul._id;
        }

        // Üye Çekme
        let uye = message.mentions.members.first() || message.guild.members.cache.get(hedefArg);
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(uye.user.bot) return message.reply(cevaplar.bot).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(!uye.manageable) return message.reply(cevaplar.dokunulmaz).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.member.roles.highest.position <= uye.roles.highest.position) return message.reply(cevaplar.yetkiust).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let cezakontrol = await Mute.findById(uye.id) || await voiceMute.findById(uye.id)
        if(!cezakontrol) {
            message.reply(cevaplar.cezayok).catch(err => {});
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {});
            return;
        };
        
        // Aktif Susturma Kayıtlarını Çekme
        const chatmute = await Punitives.findOne({ Member: uye.id, Active: true, Type: "Metin Susturulma" });
        const sesmute = await Punitives.findOne({ Member: uye.id, Active: true, Type: "Ses Susturulma" });

        // Buton Yetki Kontrolleri
        const hasChatMutePerms = roller.muteHammer.some(oku => message.member.roles.cache.has(oku)) || roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || message.member.permissions.has(PermissionFlagsBits.Administrator);
        
        const hasVoiceMutePerms = roller.voiceMuteHammer.some(oku => message.member.roles.cache.has(oku)) || roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || message.member.permissions.has(PermissionFlagsBits.Administrator);
        
        // V14 ButtonBuilder ve ActionRowBuilder kullanımı
        let metinButton = new ButtonBuilder()
            .setCustomId("metin")
            .setLabel(hasChatMutePerms ? `Metin Kanallarında` : `Metin Kanallarında (Yetkin Yok)`)
            .setStyle(chatmute ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(hasChatMutePerms ? await Mute.findById(uye.id) ? false : true : true);
            
        let sesButton = new ButtonBuilder()
            .setCustomId("ses")
            .setLabel(hasVoiceMutePerms ? `Ses Kanallarında` : `Ses Kanallarında (Yetkin Yok)`)
            .setStyle(sesmute ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(hasVoiceMutePerms ? await voiceMute.findById(uye.id) ? false : true : true);
            
        let iptalButton = new ButtonBuilder()
            .setCustomId(`iptal`)
            .setLabel('İşlemi İptal Et')
            .setEmoji(message.guild.emojiGöster(emojiler.Iptal) || '❌')
            .setStyle(ButtonStyle.Danger);
            
        let Row = new ActionRowBuilder().addComponents(metinButton, sesButton, iptalButton);

        // Açıklama Metni Hazırlama
        let açıklama = ``;
        if(chatmute) açıklama += `metin kanallarında **\`#${chatmute.No}\`** ceza numaralı susturulmasını`;
        if(sesmute && chatmute) açıklama += ` ve `;
        if(sesmute) açıklama += `ses kanallarında ki **\`#${sesmute.No}\`** ceza numaralı susturulmasını`;
        
        const embed = new genEmbed()
            .setAuthor({ name: message.member.user.tag, iconURL: message.member.user.displayAvatarURL({dynamic: true}) })
            .setDescription(`**Merhaba!** ${message.author.tag}\nBelirtilen ${uye} üyesinin ${açıklama} kaldırmak için aşağıda ki düğmeleri kullanabilirsiniz.`);
            
        let msg = await message.reply({ components: [Row], embeds: [embed] });

        var filter = (i) => i.user.id == message.member.id;
        let collector = msg.createMessageComponentCollector({filter: filter, time: 30000});

        collector.on('collect', async (i) => {
            if(i.customId == "metin") {
                // Yetki Tekrar Kontrol
                if (!hasChatMutePerms) return i.reply({ content: `Belirtilen ${uye} isimli üyenin metin kanallarında ki susturmasını kaldırmak için yetkiniz yok. ${cevaplar.prefix}`, ephemeral: true }).catch(err => {});
                if (!chatmute) return i.reply({ content: `Üyenin aktif bir metin susturması bulunmuyor.`, ephemeral: true }).catch(err => {});

                // Ceza Atan Yetkili Kontrolü
                if(chatmute && chatmute.Staff !== message.author.id && message.guild.members.cache.get(chatmute.Staff) && !message.member.permissions.has(PermissionFlagsBits.Administrator) && (roller.sorunÇözmeciler && !roller.sorunÇözmeciler.some(x => message.member.roles.cache.has(x))) && !roller.kurucuRolleri.some(x => message.member.roles.cache.has(x))) {
                    let cezalandıran = message.guild.members.cache.get(chatmute.Staff) || chatmute.Staff;
                    i.deferUpdate().catch(err => {}),msg.delete().catch(err => {}),message.reply({embeds: [new genEmbed().setDescription(`${cevaplar.prefix} Bu ceza ${cezalandıran} (\`${chatmute.Staff}\`) Tarafından cezalandırılmış. **Bu Cezayı Açman Mümkün Değil!**`).setFooter({text: "yaptırım yapılan cezada yaptırımı yapan yetkili işlem uygulayabilir."})]})
                    .then(x => { message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {}); setTimeout(() => { x.delete().catch(err => {}); }, 7500); });
                    return;
                }

                // İşlemler
                await Punitives.updateOne({ No: chatmute.No }, { $set: { "Active": false, Expried: Date.now(), Remover: message.member.id} }, { upsert: true });
                await Mute.findByIdAndDelete(uye.id);
                if(uye && uye.manageable) await uye.roles.remove(roller.muteRolü).catch(x => client.logger.log("Chatmute rolü geri alınamadı lütfen Rol ID'sini kontrol et.", "caution"));
                
                let findChannel = message.guild.kanalBul("mute-log");
                if(findChannel) findChannel.send({embeds: [new genEmbed().setDescription(`${uye} uyesinin \`#${chatmute.No}\` numaralı metin susturulması, <t:${String(Date.now()).slice(0, 10)}:R> ${message.member} tarafından kaldırıldı.`)]}).catch(err => {});
                
                await i.reply({content: `${message.guild.emojiGöster(emojiler.Onay) || '✅'} Başarıyla ${uye} üyesinin (\`#${chatmute.No}\`) ceza numaralı **metin** susturulması kaldırıldı!`, ephemeral: true});
                if(uye) uye.send({content: `Sunucumuz da \`${message.author.tag}\` tarafından **\`#${chatmute.No}\`** numaralı metin kanallarında susturulma cezanız <t:${String(Date.now()).slice(0,10)}:R> kaldırıldı. Eğer ki ceza geçmişiniz hakkında bir itirazınız var ise üst yetkililerimize ulaşmaktan çekinme.`}).catch(x => {});
                
                message.member.Leaders("ceza", 5, {type: "CEZA", user: uye.id});
                message.member.Leaders("sorun", 5, {type: "CEZA", user: uye.id});
                message.member.Leaders("criminal", 5, {type: "CEZA", user: uye.id});
                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
                msg.delete().catch(err => {});
            }

            if(i.customId == "ses") {
                // Yetki Tekrar Kontrol
                if (!hasVoiceMutePerms) return i.reply({ content: `Belirtilen ${uye} isimli üyenin ses kanallarında ki susturmasını kaldırmak için yetkiniz yok. ${cevaplar.prefix}`, ephemeral: true }).catch(err => {});
                if (!sesmute) return i.reply({ content: `Üyenin aktif bir ses susturması bulunmuyor.`, ephemeral: true }).catch(err => {});
                
                // Ceza Atan Yetkili Kontrolü
                if(sesmute && sesmute.Staff !== message.author.id && message.guild.members.cache.get(sesmute.Staff) && !message.member.permissions.has(PermissionFlagsBits.Administrator) && (roller.sorunÇözmeciler && !roller.sorunÇözmeciler.some(x => message.member.roles.cache.has(x))) && !roller.kurucuRolleri.some(x => message.member.roles.cache.has(x))) {
                    let cezalandıran = message.guild.members.cache.get(sesmute.Staff) || sesmute.Staff;
                    i.deferUpdate().catch(err => {}),msg.delete().catch(err => {}),message.reply({embeds: [new genEmbed().setDescription(`${cevaplar.prefix} Bu ceza ${cezalandıran} (\`${sesmute.Staff}\`) Tarafından cezalandırılmış. **Bu Cezayı Açman Mümkün Değil!**`).setFooter({text: "yaptırım yapılan cezada yaptırımı yapan yetkili işlem uygulayabilir."})]})
                    .then(x => { message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {}); setTimeout(() => { x.delete().catch(err => {}); }, 7500); });
                    return;
                }
                
                // İşlemler
                await Punitives.updateOne({ No: sesmute.No }, { $set: { "Active": false, Expried: Date.now(), Remover: message.member.id} }, { upsert: true });
                await voiceMute.findByIdAndDelete(uye.id);
                if(uye && uye.voice.channel) await uye.voice.setMute(false).catch(err => {}); // Sunucu Susturmasını Kaldırma
                
                let findChannel = message.guild.kanalBul("sesmute-log");
                if(findChannel) findChannel.send({embeds: [new genEmbed().setDescription(`${uye} uyesinin \`#${sesmute.No}\` numaralı seste susturulması, <t:${String(Date.now()).slice(0, 10)}:R> ${message.member} tarafından kaldırıldı.`)]}).catch(err => {});
                
                await i.reply({content: `${message.guild.emojiGöster(emojiler.Onay) || '✅'} Başarıyla ${uye} üyesinin (\`#${sesmute.No}\`) ceza numaralı **ses** kanallarındaki susturulması kaldırıldı!`, ephemeral: true});
                if(uye) uye.send({content: `Sunucumuz da \`${message.author.tag}\` tarafından **\`#${sesmute.No}\`** numaralı seste susturulma cezanız <t:${String(Date.now()).slice(0,10)}:R> kaldırıldı. Eğer ki ceza geçmişiniz hakkında bir itirazınız var ise üst yetkililerimize ulaşmaktan çekinme.`}).catch(x => {});

                message.member.Leaders("ceza", 5, {type: "CEZA", user: uye.id});
                message.member.Leaders("sorun", 5, {type: "CEZA", user: uye.id});
                message.member.Leaders("criminal", 5, {type: "CEZA", user: uye.id});
                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
                msg.delete().catch(err => {});
            }

            if (i.customId === `iptal`) {
                msg.delete().catch(err => {});
                return await i.reply({ content: `${message.guild.emojiGöster(emojiler.Onay) || '✅'} Başarıyla mute işlemleri menüsü kapatıldı.`, ephemeral: true });
            }
        });

        collector.on('end', async (collected, reason) => {
            if(reason == "time") {
                msg.delete().catch(err => {});
            }
        });
    }
};