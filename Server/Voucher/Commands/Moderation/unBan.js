const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits 
} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "yargıkaldır",
    Komut: ["yargıkaldır","yargı-kaldır","yargi-kaldir","yargikaldir","unyargı", "unban"],
    Kullanim: "yargıkaldır <@andale/ID>", // Kullanim güncellendi
    Aciklama: "Belirlenen üyenin sunucudan olan kalıcı yasaklamasını kaldırır.",
    Kategori: "kurucu",
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
        if(!roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let hedefArg = args[0];
        let uye;
        
        // Üye/Kullanıcı Çekme (GuildMember öncelikli, ardından User)
        let sunucudabul = message.mentions.members.first() || message.guild.members.cache.get(hedefArg);
        uye = sunucudabul ? sunucudabul.user : undefined;

        if (!uye && hedefArg) {
            try {
                // Sunucuda olmasa bile genel kullanıcı objesini çek
                uye = await client.users.fetch(hedefArg); 
            } catch (e) {
                // Hata durumunda uye null kalır
            }
        }
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Ban kayıtlarını çekme ve kontrol etme
        const yasaklar = await message.guild.bans.fetch().catch(() => new Map()); // Hata yakalama
        if(yasaklar.size == 0) return message.channel.send(cevaplar.yasaklamayok);
        
        // Yasaklı üye kontrolü
        let yasakliuye = yasaklar.find(yasakli => yasakli.user.id == uye.id);
        if(!yasakliuye) return message.channel.send(`${cevaplar.prefix} \`${uye.tag || uye.user.tag}\` isimli üyenin sunucuda aktif bir yasaklaması bulunamadı.`);

        // Veritabanından aktif ceza kaydını çek
        const res = await Punitives.findOne({Member: uye.id, Type: "Yasaklama", Active: true});

        if(res) {
            // Ceza atan yetkili kontrolü (Kurucu/ADMINISTRATOR rolü bu kontrolü atlar)
            if(res.Staff !== message.author.id && message.guild.members.cache.get(res.Staff) && !ayarlar.staff.includes(message.member.id) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
                 let cezalandıran = message.guild.members.cache.get(res.Staff) || res.Staff;
                return message.channel.send({embeds: [new genEmbed().setDescription(`${cevaplar.prefix} Bu ceza ${cezalandıran} (\`${res.Staff}\`) tarafından cezalandırılmış. **Bu Cezayı Açman Mümkün Değil!**`).setFooter({text: "Yaptırım yapılan cezada yaptırımı yapan yetkili işlem uygulayabilir."})]})
                .then(x => {
                    message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {});
                    setTimeout(() => {
                        x.delete().catch(err => {});
                    }, 7500);
                });
            }
        }
        
        // Veritabanı kaydını pasifleştirme
        if(res) await Punitives.updateOne({ No: res.No }, { $set: { "Active": false, Expried: Date.now(), Remover: message.member.id} }, { upsert: true });

        // Sunucu yasağını kaldırma
        await message.guild.members.unban(uye.id).catch(err => {
            message.channel.send(`${cevaplar.prefix} Sunucu yasağını kaldırırken bir hata oluştu: \`${err.message}\``).catch(err => {});
        });
        
        // Loglama
        let findChannel = message.guild.kanalBul("ban-log");
        if(findChannel) {
            await findChannel.send({embeds: [new genEmbed().setDescription(`**${uye.tag || uye.user.tag}** uyesinin sunucudaki ${res ? `\`#${res.No}\` ceza numaralı yasaklaması` : "yasaklaması"}, <t:${String(Date.now()).slice(0, 10)}:R> ${message.author} tarafından kaldırıldı.`)]}).catch(err => {});
        }
        
        // Başarılı Mesaj
        await message.reply({content: `${message.guild.emojiGöster(emojiler.Onay) || '✅'} Başarıyla **${uye.tag || uye.user.tag}** üyesinin ${res ? `(\`#${res.No}\`) ceza numaralı` : "sunucudaki"} yasaklaması kaldırıldı!`});
        
        // Reaksiyon
        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});

        // Leaderboard güncellemeleri
        message.member.Leaders("ceza", 5, {type: "CEZA", user: uye.id});
        message.member.Leaders("sorun", 5, {type: "CEZA", user: uye.id});
        message.member.Leaders("criminal", 5, {type: "CEZA", user: uye.id});
    }
};