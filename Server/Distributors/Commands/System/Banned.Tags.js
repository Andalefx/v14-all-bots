const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine EmbedBuilder
    Util 
} = require("discord.js");

// Varsayımlar: Global değişkenlerin ve Schemaların tanımlı olduğunu varsayıyoruz.
const Punitives = require('../../../../Global/Databases/Global.Punitives')
const Users = require('../../../../Global/Databases/Client.Users')
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings')
const { genEmbed } = require('../../../../Global/İnit/Embed')

// Emojiler, sistem ayarları ve roller global değişkenlerden geliyor.
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌', Terfi: { miniicon: '⭐' } }; 
const sistem = global.sistem || { SERVER: { ID: "SUNUCU_ID" }, botSettings: { Prefixs: ["."] } }; 
const roller = global.roller || { yasaklıTagRolü: "YASAKLI_ROL_ID", erkekRolleri: [], kadınRolleri: [], kayıtsızRolleri: [], tagRolü: "TAG_ROL_ID" };
const ayarlar = global.ayarlar || { tag: "", tagsiz: "", taglıalım: false, type: true, isimyas: true };

module.exports = {
    Isim: "yasak-tag",
    Komut: ["yasaklı-tag","yasaktag","yasaklıtag","yasaklıtaglar","yasaktaglar","yasaklı-taglar"],
    Kullanim: "yasak-tag <[ekle/kaldır]> <[tag]>",
    Aciklama: "Sunucuda yasaklı etiket/tag ayarlarını yönetir.",
    Kategori: "-",
    Extend: true,
    
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array<String>} args 
     */
    onRequest: async function (client, message, args) {
        
        // --- DM KONTROLÜ ---
        if (!message.guild || !message.member) return;
        
        // Emoji Erişimi için Güvenli Fonksiyon (Orijinal koddaki gibi)
        const getEmoji = (emojiName) => {
            const emoji = emojiler[emojiName];
            if (message.guild.emojis.cache.has(emoji)) {
                return message.guild.emojis.cache.get(emoji).toString(); // String formatında döndür
            }
            // Unicode veya bulunamazsa string olarak döndür (tepki için ID veya undefined gerekiyorsa ayrıca kontrol edilmeli)
            return emoji || '❓';
        }
        const getEmojiID = (emojiName) => {
             const emoji = emojiler[emojiName];
             if (message.guild.emojis.cache.has(emoji)) {
                 return message.guild.emojis.cache.get(emoji).id;
             }
             return undefined; // ID değilse undefined dön
        }

        let embed = new genEmbed();
        let data = await GUILDS_SETTINGS.findOne({guildID: sistem.SERVER.ID});
        let ayar = data ? data.Ayarlar : {};

        // --- EKLEME İŞLEMİ ---
        if (["ekle", "Ekle", "add", "Add","at"].some(kontrol => kontrol === args[0])) {
            let tags = args[1];
            if(!tags) return message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌'); 
            
            if (ayar.yasakTaglar && ayar.yasakTaglar.includes(tags)) {
                return message.channel.send({embeds: [embed.setDescription(`${getEmoji('Iptal')} Eklemeye çalıştığınız \`${tags}\` zaten yasaklı tag/etiket listesinde.`)]}).then(x => {
                    setTimeout(() => { x.delete() }, 7500);
                }), message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌');
            }
            
            // Callback yapısı korundu
            GUILDS_SETTINGS.findOne({guildID: sistem.SERVER.ID}, async (err, res) => {
                let yasakTags = ayar.yasakTaglar ? [...ayar.yasakTaglar] : [];
                yasakTags.push(tags);
                
                await GUILDS_SETTINGS.updateOne({guildID: sistem.SERVER.ID}, {$set: {"Ayarlar.yasakTaglar": yasakTags}},{upsert: true});

                let uyeler = message.guild.members.cache.filter(u => u.user.username.includes(tags) || u.user.discriminator.includes(tags));
                
                await message.channel.send({embeds: [embed.setDescription(`${getEmoji('Onay')} Başarılı bir şekilde \`${tags}\` tagını yasaklı taglar/etiketler listesine ekledin.
${getEmoji('Terfi.miniicon')} Bu tagda veya etikette bulunan üyeler: ${uyeler.map(x => x).slice(0,7).join(", ")} ${uyeler.size > 7 ? `ve ${uyeler.size - 7} daha fazlası...` : ''}`)]}).then(x => {
                    setTimeout(() => { x.delete() }, 7500);
                });
                message.react(getEmojiID('Onay') ? getEmojiID('Onay') : '✅');
                
                uyeler.forEach(async (uye, index) => {
                    setTimeout(async () => {
                        uye.send(`**Merhaba!**
Üzerinizde bulunan **\` ${args[1]} \`** bu sembol veya etiket yasaklandığı için sizi yasaklı kategorisine ekledik.
\`\`\`
Üzerinizde bulunan yasaklı tag çıkarıldığında kayıtlı iseniz otomatik kayıt olacaksınız kayıtlı değilseniz kayıtsıza tekrardan düşeceksiniz.
\`\`\``).catch(err => {});
                        await uye.roles.set([roller.yasaklıTagRolü]).catch(() => {}); // .setRoles yerine .set kullandım, rol dizisi gönderilmeli
                    }, 1500);
                });
            });
        }

        // --- KALDIRMA İŞLEMİ ---
        else if (["kaldır", "sil", "remove", "delete", "Sil","çıkar","Çıkart"].some(kontrol => kontrol === args[0])) {
            let tags = args[1];
            if(!tags) return message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌');
            
            if (ayar.yasakTaglar && !ayar.yasakTaglar.includes(tags)) {
                 return message.channel.send({embeds: [embed.setDescription(`${getEmoji('Iptal')} Eklemeye çalıştığınız \`${tags}\` zaten yasaklı tag/etiket listesinde bulunmuyor.`)]}).then(x => {
                    setTimeout(() => { x.delete() }, 7500);
                }), message.react(getEmojiID('Iptal') ? getEmojiID('Iptal') : '❌');
            }
            
            const findUser = ayar.yasakTaglar.find(acar => acar == tags); // Orijinal mantık: tagı bul
            await GUILDS_SETTINGS.updateOne({ guildID: message.guild.id }, { $pull: { "Ayarlar.yasakTaglar": findUser } }, { upsert: true });
            
            let uyeler = message.guild.members.cache.filter(u => u.user.username.includes(tags) || u.user.discriminator.includes(tags));
            
            await message.channel.send({embeds: [embed.setDescription(`${getEmoji('Onay')} Başarılı bir şekilde \`${tags}\` tagını yasaklı taglar/etiketler listesinden çıkarttınız.
${getEmoji('Terfi.miniicon')} Bu tagda veya etikette bulunan üyeler: ${uyeler.map(x => x).slice(0,7).join(", ")} ${uyeler.size > 7 ? `ve ${uyeler.size - 7} daha fazlası...` : ''}`)]}).then(x => {
                setTimeout(() => { x.delete() }, 7500);
            });
            message.react(getEmojiID('Onay') ? getEmojiID('Onay') : '✅');
            
            uyeler.forEach(async (uye, index) => {
                setTimeout(async () => {
                    uye.send(`**Merhaba!**
Üzerinizde bulunan **\` ${args[1]} \`** bu sembol veya etiket yasağı kaldırıldığından dolayı sizi yasaklı kategorisinden çıkarttık.`).catch(err => {});
                    
                    let User = await Users.findOne({_id: uye.id});
                    
                    if(!ayarlar.taglıalım && User && User.Name && User.Names && User.Gender) {
                        // Üye kayıtlı ise (taglı alım kapalıysa)
                        if(uye && uye.manageable && ayarlar.type && ayarlar.isimyas) uye.setNickname(`${ayarlar.type ? uye.user.username.includes(ayarlar.tag) ? ayarlar.tag + " " : (ayarlar.tagsiz ? ayarlar.tagsiz + " " : (ayarlar.tag || "")) : ""}${User.Name}`).catch(err => {})
                        if(User.Gender == "Erkek") await uye.roles.set(roller.erkekRolleri).catch(err => {})
                        if(User.Gender == "Kadın") await uye.roles.set(roller.kadınRolleri).catch(err => {})
                        if(User.Gender == "Kayıtsız") uye.roles.set(roller.kayıtsızRolleri).catch(err => {})
                        if(uye.user.username.includes(ayarlar.tag)) uye.roles.add(roller.tagRolü).catch(err => {})
                    } else {
                        // Üye kayıtsız ise (veya taglı alım açıksa)
                        uye.roles.set(roller.kayıtsızRolleri).catch(err => {})
                        
                        // setNickname V14'e uygun olarak düzenlendi
                        if(uye && uye.manageable && ayarlar.type && ayarlar.isimyas) await uye.setNickname(`${uye.user.username.includes(ayarlar.tag) ? ayarlar.tag : (ayarlar.tagsiz ? ayarlar.tagsiz : (ayarlar.tag || ""))} İsim | Yaş`).catch(err => {})
                        else if(uye && uye.manageable && !ayarlar.type && ayarlar.isimyas) await uye.setNickname(`İsim | Yaş`).catch(err => {})
                        else if(uye && uye.manageable && !ayarlar.type && !ayarlar.isimyas) await uye.setNickname(`Kayıtsız`).catch(err => {})
                        else if(uye && uye.manageable && ayarlar.type && !ayarlar.isimyas) await uye.setNickname(`${uye.user.username.includes(ayarlar.tag) ? ayarlar.tag : (ayarlar.tagsiz ? ayarlar.tagsiz : (ayarlar.tag || ""))} Kayıtsız`).catch(err => {})
                    }
                }, 1500)
            });
        }
        
        // --- LİSTELEME İŞLEMİ (ARGS YOKSA) ---
        if(!args[0]) {
            message.reply({
                embeds: [
                    embed.setAuthor({ name: null })
                         .setFooter({ text: `${sistem.botSettings.Prefixs[0]}yasaktag <[ekle/kaldır]> <[tag]>` })
                         .setDescription(`**Merhaba!** ${message.member.user.tag}
**${message.guild.name}** sunucusuna ait yasaklı tag/etiket listesi aşağıda belirtilmiştir.

**Yasaklı taglar/etiketler sıralanmaktadır**:
${ayar.yasakTaglar ? ayar.yasakTaglar.map(x => {
    return {
        Id: x,
        Total: message.guild.members.cache.filter(u => u.user.username.includes(x) || u.user.discriminator.includes(x))
    };
}).sort((a, b) => b.Total.size - a.Total.size).splice(0, 15).map((user, index) => `\`${index + 1}.\` **${user.Id}** (\`${user.Total.size} üye\`)`).join("\n") || `\`\`\`fix
Yasaklı tag/etiket bulunamamıştır.\`\`\`` : `\`\`\`fix
Yasaklı tag/etiket bulunamamıştır.\`\`\``}`)]
            }).then(x => {
                setTimeout(() => { x.delete() }, 30000);
            })
        }
    }
};