const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits 
} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "unban",
    Komut: ["yasaklama-kaldır","bankaldır","yasaklamakaldır", "underworldkaldır", "ununderworld"],
    Kullanim: "unban <#No/@andale/ID>", // Kullanim güncellendi
    Aciklama: "Belirlenen üyenin Underworld cezasını kaldırır.",
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
        if(!roller.banHammer.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let hedefArg = args[0];
        let uye;

        // Ceza Numarası Kontrolü
        if(Number(hedefArg)) {
            let cezanobul = await Punitives.findOne({Type: "Underworld", No: hedefArg, Active: true});
            if(cezanobul) hedefArg = cezanobul.Member;
        }
        
        // Üye/Kullanıcı Çekme (JoinedAt hatası riskini azaltmak için GuildMember öncelikli)
        uye = message.mentions.members.first() || message.guild.members.cache.get(hedefArg);

        if (!uye && hedefArg) {
            try {
                // Sunucuda olmasa bile genel kullanıcı objesini çek
                uye = await client.users.fetch(hedefArg); 
            } catch (e) {
                // Kullanıcı bulunamazsa uye null kalır
            }
        }
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));

        // Mongoose exec artık Promise döndüğü için .then/.catch veya async/await kullanılabilir.
        const res = await Punitives.findOne({Member: uye.id, Type: "Underworld", Active: true});

        if(!res) return message.channel.send({embeds: [new genEmbed().setDescription(`${cevaplar.prefix} Belirtilen **${uye.tag || uye.user.tag}** isimli üyenin **Underworld** cezası bulunamadı.`)]}).then(x => {
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 7500);
        });
            
        // Ceza atan yetkili kontrolü (ADMINISTRATOR V14 uyumu)
        if(res.Staff !== message.author.id && message.guild.members.cache.get(res.Staff) && !ayarlar.staff.includes(message.member.id) && (roller.sorunÇözmeciler && !roller.sorunÇözmeciler.some(x => message.member.roles.cache.has(x))) && !roller.kurucuRolleri.some(x => message.member.roles.cache.has(x))) {
            let cezalandıran = message.guild.members.cache.get(res.Staff) || res.Staff;

            return message.channel.send({embeds: [new genEmbed().setDescription(`${cevaplar.prefix} Bu ceza ${cezalandıran} (\`${res.Staff}\`) tarafından cezalandırılmış. **Bu Cezayı Açman Mümkün Değil!**`).setFooter({text: "Yaptırım yapılan cezada yaptırımı yapan yetkili işlem uygulayabilir."})]})
            .then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {})
                setTimeout(() => {
                    x.delete().catch(err => {})
                }, 7500);
            });
        }
        
        // Ceza kaydını pasife çek
        if(res) await Punitives.updateOne({ No: res.No }, { $set: { "Active": false, Expried: Date.now(), Remover: message.member.id} }, { upsert: true });

        // Üye sunucuda ise rol ve takma ad işlemleri
        let bul = message.guild.members.cache.get(uye.id);
        
        if(bul) {
            let User = await Users.findOne({_id: uye.id});
            
            // Üyenin yönetilebilir olup olmadığını tekrar kontrol et (sadece GuildMember ise)
            if(bul.manageable) { 
                
                // Kayıt sistemi mantığına göre rol ve takma ad verme
                if(!ayarlar.taglıalım && User && User.Name && User.Names && User.Gender) {
                    
                    // Takma ad ayarlama
                    let nickname = `${ayarlar.type ? bul.user.username.includes(ayarlar.tag) ? ayarlar.tag + " ": (ayarlar.tagsiz ? ayarlar.tagsiz + " " : (ayarlar.tag || "")): ""}${User.Name}`;
                    await bul.setNickname(nickname).catch(err => {});
                    
                    // Rol verme
                    let roller_to_set = [];
                    if(User.Gender == "Erkek") roller_to_set = roller.erkekRolleri;
                    if(User.Gender == "Kadın") roller_to_set = roller.kadınRolleri;
                    if(User.Gender == "Kayıtsız") roller_to_set = roller.kayıtsızRolleri;
                    
                    await bul.setRoles(roller_to_set).catch(err => {});
                    if(bul.user.username.includes(ayarlar.tag)) await bul.roles.add(roller.tagRolü).catch(err => {});
                    
                } else {
                    // Kayıtsız rolü ve varsayılan takma ad verme
                    await bul.setRoles(roller.kayıtsızRolleri).catch(err => {});
                    
                    let nickname = 'Kayıtsız'; // Varsayılan Kayıtsız takma adı
                    
                    if(ayarlar.isimyas) {
                        if(ayarlar.type) {
                            nickname = `${bul.user.username.includes(ayarlar.tag) ? ayarlar.tag : (ayarlar.tagsiz ? ayarlar.tagsiz : (ayarlar.tag || ""))} İsim | Yaş`;
                        } else {
                            nickname = `İsim | Yaş`;
                        }
                    } else if (ayarlar.type) {
                         nickname = `${bul.user.username.includes(ayarlar.tag) ? ayarlar.tag : (ayarlar.tagsiz ? ayarlar.tagsiz : (ayarlar.tag || ""))} Kayıtsız`;
                    }
                    
                    await bul.setNickname(nickname).catch(err => {});
                }
            }
        }
        
        // Loglama
        let findChannel = message.guild.kanalBul("underworld-log");
        if(findChannel) {
            await findChannel.send({embeds: [new genEmbed().setDescription(`**${uye.tag || uye.user.tag}** uyesinin sunucudaki ${res ? `\`#${res.No}\` ceza numaralı Underworld'ü` : `Underworld'ü`}, <t:${String(Date.now()).slice(0, 10)}:R> ${message.author} tarafından kaldırıldı.`)]}).catch(err => {});
        }
        
        // Başarılı Mesaj
        await message.reply({content: `${message.guild.emojiGöster(emojiler.Onay) || '✅'} Başarıyla **${uye.tag || uye.user.tag}** üyesinin ${res ? `(\`#${res.No}\`) ceza numaralı` : "sunucudaki"} Underworld'ü kaldırıldı!`});
        
        // Reaksiyon
        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
        
        // Leaderboard güncellemeleri
        message.member.Leaders("ceza", 5, {type: "CEZA", user: uye.id})
        message.member.Leaders("sorun", 5, {type: "CEZA", user: uye.id})
        message.member.Leaders("criminal", 5, {type: "CEZA", user: uye.id})
    }
};