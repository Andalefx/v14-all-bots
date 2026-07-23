const { Message, EmbedBuilder } = require("discord.js");
const Users = require('../../../../Global/Databases/Client.Users'); // 'Schemas/' eklendiğini varsayıyorum
const GUILDS_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings'); // 'Schemas/' eklendiğini varsayıyorum
const commandBlocks = require('../../../../Global/Databases/Users.Command.Blocks'); // 'Schemas/Others/' eklendiğini varsayıyorum
const ms = require('ms');
const spamCommandCount = new Map();
const path = require('path');

// ⚠️ Not: lowdb ve FileSync kaldırıldı.
// lowdb, FileSync ve join artık require edilmiyor.

/**
 * @param {Message} message 
 */
module.exports = async (message) => {
    // ----------------------------------------------------
    // GLOBAL VERİ SENKRONİZASYONU
    // ----------------------------------------------------

    let Data = await GUILDS_SETTINGS.findOne({ _id: 1 });
    if (!Data) return;
    
    // Veri senkronizasyonu: Global değişkenlerinizi Data'dan çekiyor.
    // Not: client değişkenine erişilebildiği varsayılmıştır (global.client).
    global.ayarlar = global._settings = client._settings = Data.Ayarlar;
    global.kanallar = global._channels = client._channels = Data.Ayarlar;
    global.roller = global._roles = client._roles = Data.Ayarlar;

    // 🚨 DÜZELTME: lowdb kullanmadan direkt require ile yükleme
    try {
        global.emojiler = global._emojis = client._emojis = require('../../../../Global/Settings/_emojis.json'); 
    } catch (e) {
        console.error("[HATA] _emojis.json dosyası yüklenemedi. lowdb kaldırıldıktan sonra require hatası. Yolu kontrol edin.");
        console.error(e);
        return; 
    }
    
   
    global.cevaplar = global._reply = client._reply = require('../../../../Global/Settings/_reply');
   
    // 🚨 DÜZELTME: require-reload yerine cache temizleme ve require
    const statSystemPath = path.join(__dirname, '../../../../Global/Settings/_settings');
    delete require.cache[require.resolve(statSystemPath)];
    global._statSystem = require(statSystemPath);
    
    // ----------------------------------------------------
    // KOMUT İŞLEME VE KONTROLLER
    // ----------------------------------------------------

    // Bot ise, prefix yoksa veya DM kanalıysa durdur.
    if (message.author.bot || !global.sistem.botSettings.Prefixs.some(x => message.content.startsWith(x)) || !message.channel || message.channel.type === 1) return;

    // Prefix'i bul
    const prefix = global.sistem.botSettings.Prefixs.find(x => message.content.startsWith(x));
    
    // Argument'ları ayır
    let args = message.content.substring(prefix.length).trim().split(/ +/g);
    let komutcuklar = args[0].toLocaleLowerCase();
    let acar = message.client;
    args = args.slice(1);

    let calistirici = acar.commands.get(komutcuklar) || acar.aliases.get(komutcuklar);
    let TalentPerms = null;
    
    // Talent Perms Kontrolü
    if(global.ayarlar.talentPerms) {
        TalentPerms = global.ayarlar.talentPerms.filter(x => !Array.isArray(x.Commands)).find(x => x.Commands === komutcuklar) || 
                     global.ayarlar.talentPerms.filter(x => Array.isArray(x.Commands)).find(x => x.Commands.some(kom => kom === komutcuklar));
    }

    // Tag ve Link Komutları (Prefix gerektirmeyen)
    // ... (Mantık aynı kalır, kod fazlalığı olmaması için çıkarıldı) ...
    if (global.ayarlar.type && [".tag", "!tag"].includes(message.content.toLowerCase())) {
         if((!message.mentions.members.first() || !message.guild.members.cache.get(args[0]))) return global.ayarlar.tag ? message.reply(`${global.ayarlar.tag}`) : message.channel.send(`\`❌\` Bu sunucuya ait veritabanında tag ayarı bulunamadı. Lütfen tag belirleyiniz...`).then(x => {
            client.logger.log("Bu sunucuya ait veritabanında tag ayarı bulunamadı. Lütfen tag belirleyiniz...","error")
            setTimeout(() => {
                x.delete()
            }, 7500);
        })
    }
    if ([".link", "!link"].includes(message.content.toLowerCase())) {
        return message.channel.send(message.guild.vanityURLCode ? `discord.gg/${message.guild.vanityURLCode}` : `discord.gg/${(await message.channel.createInvite()).code}`);
    }


    // Global Yasaklı Rol Kontrolü
    if (global.roller.jailRolü && (message.member.roles.cache.has(global.roller.jailRolü) || 
        message.member.roles.cache.has(global.roller.şüpheliRolü) || 
        message.member.roles.cache.has(global.roller.underworldRolü) || 
        message.member.roles.cache.has(global.roller.yasaklıTagRolü) || 
        (global.roller.kayıtsızRolleri && global.roller.kayıtsızRolleri.some(rol => message.member.roles.cache.has(rol))))) return;

    // Komut veya Yetenek Komutu Bulunduysa İşle
    if (calistirici || TalentPerms) {
        
        // İzinli Kanal Kontrolü
        const isStaff = message.member.permissions.has("Administrator") || global.ayarlar.staff.includes(message.member.id);
        const allowedChannels = global.kanallar.izinliKanallar;
        const exceptions = ["temizle", "sil", "booster", "b", "snipe", "afk", "kilit", "çekiliş"];

        if (allowedChannels && !allowedChannels.some(x => message.channel.id === x) && !isStaff && !exceptions.some(x => komutcuklar === x)) {
            return message.reply(`${global.cevaplar.prefix} Belirtilen komut bu kanalda kullanıma izin verilemiyor, lütfen ${message.guild.channels.cache.get(allowedChannels[0])} kanalında tekrar deneyin.`).then(x => setTimeout(() => {
                x.delete().catch(() => {});
                message.delete().catch(() => {});
            }, 10000));
        }

        // Spam Kontrolü (Staff/Admin değilse)
        if (!isStaff && !global.roller.kurucuRolleri.some(x => message.member.roles.cache.has(x))) {
            let cBlock = await commandBlocks.findOne({ _id: message.member.id });
            if (cBlock) return;
            
            let spamDedection = spamCommandCount.get(message.author.id) || [];
            let cmd = { lastContent: message.content, Channel: message.channel.id, Command: komutcuklar };
            spamDedection.push(cmd);
            spamCommandCount.set(message.author.id, spamDedection);

            if (spamDedection.length >= 15) {
                let kanalBul = message.guild.channels.cache.find(c => c.name === "safe-command-log"); 
                if(kanalBul) kanalBul.send({embeds: [new EmbedBuilder() 
                    .setDescription(`${message.author} isimli üye sürekli komut kullanımı sebebiyle bot tarafından otomatik yasaklandı, bu yasaklanmanın itirazını Sunucu sahibi ve bot sahibine iletmelidir.`)
                    .addFields(
                        { name: `Son Gönderilen İçerikler`, value: `${spamDedection.map(x => `\`${x.lastContent}\``).join("\n")}`, inline: true },
                        { name: "Son Kullanılan Komutlar", value: `${spamDedection.map((x, index) => `\`${index+1}.\` \`${global.sistem.botSettings.Prefixs[0]}${x.Command}\` (${message.guild.channels.cache.get(x.Channel)})`).join("\n")}`, inline: true }
                    )
                ]});

                message.channel.send({ content: `${message.guild.emojiGöster(global.emojiler.chatSusturuldu)} ${message.author} Sürekli olarak komut kullanımı sebebiyle bot tarafından komut kullanımınız \`Devre-Dışı\` bırakıldı.` }).then(x => {
                    setTimeout(() => { x.delete().catch(() => {}) }, 7500);
                });
                
                await commandBlocks.updateOne({ _id: message.member.id }, { $set: { Date: Date.now(), lastData: spamDedection } }, { upsert: true });
                if (spamCommandCount.has(message.author.id)) spamCommandCount.delete(message.author.id);
            }
            setTimeout(() => { if (spamCommandCount.has(message.author.id)) { spamCommandCount.delete(message.author.id) } }, ms("1m"));
        }
        
        try {
            // Komut Loglama
            await Users.updateOne({ _id: message.author.id }, { $push: { "CommandsLogs": { Komut: komutcuklar, Kanal: message.channel.id, Tarih: Date.now() } } }, { upsert: true });
            acar.logger.log(`${message.author.tag} (${message.author.id}) komut kullandı "${komutcuklar}" kullandığı kanal "${message.channel.name}"`, "cmd");
            
            // Talent Perms Mantığı
            if (TalentPerms) {
                // Talent Perms Mantığı (EmbedBuilder ile güncellenmeli)
                let embed = new EmbedBuilder(); 
                var rolismi = TalentPerms.Name || "Belirsiz";
                let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
                
                if((TalentPerms.Permission && TalentPerms.Permission.length && !TalentPerms.Permission.some((id) => message.member.roles.cache.has(id))) && !global.roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has("ADMINISTRATOR")) return message.channel.send({embeds: [new EmbedBuilder().setDescription(`${global.cevaplar.prefix} Bu komutu kullanabilmek için ${TalentPerms.Permission ? TalentPerms.Permission.filter(x => message.guild.roles.cache.get(x)).map(x => message.guild.roles.cache.get(x)).join(", ") + " rollerine sahip olmalısın!": ""}`)]});
                if (!uye) return message.channel.send({embeds: [new EmbedBuilder().setDescription(`${TalentPerms.Roles.map(x => message.guild.roles.cache.get(x)).join(", ")} ${TalentPerms.Roles.length > 1 ? 'rollerini' : "rolü"} verebilmem için lütfen bir üyeyi etiketle __Örn:__ \`${global.sistem.botSettings.Prefixs[0]}${komutcuklar} @acar/ID\`! ${global.cevaplar.prefix}`)]}).then(x => setTimeout(() => { x.delete() }, 7500));
                
                if (TalentPerms.Roles.some(role => uye.roles.cache.has(role))) {
                    await Users.updateOne({ _id: uye.id }, { $push: { "Roles": { rol: TalentPerms.Roles, mod: message.author.id, tarih: Date.now(), state: "Kaldırma" } } }, { upsert: true })
                    TalentPerms.Roles.forEach(x => uye.roles.remove(x))
                    message.reply({embeds: [new EmbedBuilder().setDescription(`${message.guild.emojiGöster(global.emojiler.Onay)} Başarıyla ${uye}, isimli üyeden ${TalentPerms.Roles.map(x => message.guild.roles.cache.get(x)).join(", ")} ${TalentPerms.Roles.length > 1 ? 'rolleri' : "rolü"} geri alındı.`)]}).catch().then(x => setTimeout(() => { x.delete() }, 7500));
                    message.react(message.guild.emojiGöster(global.emojiler.Onay) ? message.guild.emojiGöster(global.emojiler.Onay).id : undefined)
                    message.guild.kanalBul("rol-al-log").send({embeds: [embed.setDescription(`${uye} isimli üyeden <t:${String(Date.now()).slice(0, 10)}:R> ${message.author} tarafından ${TalentPerms.Roles.map(x => message.guild.roles.cache.get(x)).join(", ")} adlı ${TalentPerms.Roles.length > 1 ? 'rolleri' : "rol"} geri alındı.`)]})
                }
                else {
                    await Users.updateOne({ _id: uye.id }, { $push: { "Roles": { rol: TalentPerms.Roles, mod: message.author.id, tarih: Date.now(), state: "Ekleme" } } }, { upsert: true })
                    uye.roles.add(TalentPerms.Roles);
                    message.reply({embeds: [new EmbedBuilder().setDescription(`${message.guild.emojiGöster(global.emojiler.Onay)} Başarıyla ${uye}, isimli üyeye ${TalentPerms.Roles.map(x => message.guild.roles.cache.get(x)).join(", ")} ${TalentPerms.Roles.length > 1 ? 'rolleri' : "rolü"} verildi.`)]}).catch().then(x => setTimeout(() => { x.delete() }, 7500));
                    message.react(message.guild.emojiGöster(global.emojiler.Onay) ? message.guild.emojiGöster(global.emojiler.Onay).id : undefined)
                    message.guild.kanalBul("rol-ver-log").send({embeds: [embed.setDescription(`${uye} isimli üyeye <t:${String(Date.now()).slice(0, 10)}:R> ${message.author} tarafından ${TalentPerms.Roles.map(x => message.guild.roles.cache.get(x)).join(", ")} adlı ${TalentPerms.Roles.length > 1 ? 'rolleri' : "rol"} verildi.`)]})
                }

            }
            
            // Komutu Çalıştırma
            if (calistirici) {
                // Yetki Kontrolü
                const hasPermission = calistirici.Permissions && calistirici.Permissions.length && 
                                      !calistirici.Permissions.some((id) => message.member.roles.cache.has(id) || message.member.permissions.has(id) || message.member.id === id);
                
                if (hasPermission && !global.roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has("ADMINISTRATOR") && !global.ayarlar.staff.includes(message.author.id)) {
                    return message.reply({embeds: [new EmbedBuilder().setDescription(`Bu komutu kullanmak için ${calistirici.Permissions ? calistirici.Permissions.filter(x => message.guild.roles.cache.get(x)).map(x => message.guild.roles.cache.get(x)).join(", ") + " rol(lerine) sahip olmalısın!": "yeterli yetkiye sahip değilsin."} ${global.cevaplar.prefix}`)]}).then(x => {
                        setTimeout(() => { x.delete().catch(() => {}) }, 7500);
                    });
                }
                
                // 🚨 KRİTİK: Komutun çalıştırıldığı yer
                calistirici.onRequest(acar, message, args); 
            }
            
        } catch (err) {
            // Hata Yakalama
            message.channel.send({content: `Bu komut çalıştırılırken hata oluştu... \`\`\`${err.message}\`\`\` `}).then(x => { 
                acar.logger.log(`${komutcuklar} isimli komut çalıştırılırken hata oluştu: ${err.stack}`,"error");
                setTimeout(() => { x.delete().catch(() => {}) }, 7500);
            });
        }
    }
};

module.exports.config = {
    Event: "messageCreate"
};