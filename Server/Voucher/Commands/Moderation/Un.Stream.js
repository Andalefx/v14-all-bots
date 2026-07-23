const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits 
} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const {VK, DC, STREAM} = require('../../../../Global/Databases/Punitives.Activitys');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "stream-kaldır",
    Komut: ["stream-kaldir", "streamkaldir","streamkaldır","streamcezalı-kaldır","streamcezalıkaldır","streamcezalikaldir","unstream","unstreamer"],
    Kullanim: "unstream <#No/@andale/ID>", // Kullanim güncellendi
    Aciklama: "Belirlenen üyenin yayıncı cezalı rolünü kaldırır.",
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

        let aktivite = "**Stream**";
        
        // V14 Yetki Kontrolü
        if(!roller.streamerSorumlusu.some(oku => message.member.roles.cache.has(oku)) && !roller.sorunÇözmeciler.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let hedefArg = args[0];
        let uye;

        // Ceza Numarası Kontrolü
        if(Number(hedefArg)) {
            let cezanobul = await STREAM.findOne({No: hedefArg});
            if(cezanobul) hedefArg = cezanobul._id; // ID'yi ceza sahibinin ID'si ile değiştir
        }
        
        // Üye Çekme
        if (hedefArg) {
            uye = message.mentions.members.first() || message.guild.members.cache.get(hedefArg);
        }
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(uye.user.bot) return message.reply(cevaplar.bot).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(!uye.manageable) return message.reply(cevaplar.dokunulmaz).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.member.roles.highest.position <= uye.roles.highest.position) return message.reply(cevaplar.yetkiust).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let cezakontrol = await STREAM.findById(uye.id);
        
        if(!cezakontrol) {
            message.channel.send(cevaplar.cezayok);
            message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {});
            return;
        };
        
        let cezabilgisi = await Punitives.findOne({ Member: uye.id, Active: true, Type: "Streamer Cezalandırma" });
        
        // Ceza atan yetkili kontrolü (ADMINISTRATOR V14 uyumu)
        if(cezabilgisi && cezabilgisi.Staff !== message.author.id && message.guild.members.cache.get(cezabilgisi.Staff) && !message.member.permissions.has(PermissionFlagsBits.Administrator) && (roller.sorunÇözmeciler && !roller.sorunÇözmeciler.some(x => message.member.roles.cache.has(x))) && !roller.kurucuRolleri.some(x => message.member.roles.cache.has(x))) {
            let cezalandıran = message.guild.members.cache.get(cezabilgisi.Staff) || cezabilgisi.Staff;
            
            return message.channel.send({embeds: [new genEmbed().setDescription(`${cevaplar.prefix} Bu ceza ${cezalandıran} (\`${cezabilgisi.Staff}\`) tarafından cezalandırılmış. **Bu Cezayı Açman Mümkün Değil!**`).setFooter({text: "Yaptırım yapılan cezada yaptırımı yapan yetkili işlem uygulayabilir."})]})
            .then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : '❌').catch(err => {});
                setTimeout(() => {
                    x.delete().catch(err => {});
                }, 7500);
            });
        }
        
        // Ceza kaydını pasife çek
        await Punitives.updateOne({ No: cezakontrol.No }, { $set: { "Active": false, Expried: Date.now(), Remover: message.member.id} }, { upsert: true });
        
        // Aktif ceza kaydını sil
        if(await STREAM.findById(uye.id)) {
            await STREAM.findByIdAndDelete(uye.id);
        }
        
        // Rolü Kaldır
        if(uye && uye.manageable) await uye.roles.remove(roller.streamerCezalıRolü).catch(err => {});
        
        // Başarılı Mesaj
        await message.reply({content: `${message.guild.emojiGöster(emojiler.Onay) || '✅'} Başarıyla ${uye} üyesinin (\`#${cezakontrol.No}\`) ceza numaralı ${aktivite} cezası kaldırıldı!`})
        .then(x => {
            setTimeout(() => {
                x.delete().catch(err => {});
            }, 10500);
        });
        
        // Kullanıcıya DM Gönder
        let unbanEmbed = new genEmbed().setDescription(`${message.author} tarafından <t:${String(Date.now()).slice(0, 10)}:R> \`#${cezakontrol.No}\` ceza numaralı ${aktivite} cezası kaldırıldı.`);
        if(uye) uye.send({embeds: [unbanEmbed]}).catch(x => {});
        
        // Reaksiyon
        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
    }
};