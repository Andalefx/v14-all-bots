const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const moment = require('moment');
// moment-duration-format ve moment-timezone gereksinimleri genellikle global olarak çözülür.
// require('moment-duration-format'); 
// require('moment-timezone'); 
const { genEmbed } = require("../../../../Global/İnit/Embed");  // Bu dosyanın v14 uyumlu olduğunu varsayıyorum.
const Heykel = require('../../../../Global/Databases/Middle.Heykels');
const CronJob = require('cron').CronJob; // cron modülünün kurulu olduğunu varsayıyoruz.

// Global değişkenler: sistem, roller, ayarlar, cevaplar, emojiler
const { sistem, roller, ayarlar, cevaplar, emojiler } = global;

module.exports = {
    Isim: "best",
    Komut: ["best", "best-friend", "bestfriend"],
    Kullanim: "best <@uye/ID> | best liste",
    Aciklama: "Belirlenen üyeyi Best Friend rol sistemi için veri tabanına ekler/kaldırır.",
    Kategori: "kurucu",
    Extend: false,

    /**
    * @param {Client} client 
    */
    onLoad: function (client) {
        // Her gün gece 00:00'da çalışacak CronJob
        let heykelTemizle = new CronJob('0 0 * * *', async function() {
            if (!sistem.SERVER || !roller.Buttons || !roller.Buttons.bestFriendRolü) return;

            const guild = client.guilds.cache.get(sistem.SERVER.ID);
            if (!guild) return console.error("Sunucu (Guild) cache'de bulunamadı.");

            // Tüm üyeleri fetch etmeye gerek yok, sadece rolü olanları cache'de kontrol edebiliriz
            guild.members.cache.filter(x => x.roles.cache.has(roller.Buttons.bestFriendRolü)).forEach(async uye => {
                try {
                    // Rolü olan herkesten rolü kaldır
                    await uye.roles.remove(roller.Buttons.bestFriendRolü, "Günlük Best Friend rol temizliği").catch(err => {});
                } catch (err) {
                    console.error(`Best Friend rolü ${uye.id} adlı üyeden kaldırılamadı:`, err);
                }
            });
            console.log("[CRON] Best Friend rolleri temizlendi.");
        }, null, true, 'Europe/Istanbul');
        
        heykelTemizle.start();
    },

    /**
    * @param {Client} client 
    * @param {Message} message 
    * @param {Array<String>} args 
    */
    onRequest: async function (client, message, args) {
        if (!roller.Buttons || !roller.Buttons.bestFriendRolü) return;
        
        // V14 EmbedBuilder kullanımı
        let embed = new EmbedBuilder();

        // İzin kontrolü
        const hasPermission = ayarlar.staff.includes(message.member.id) || roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku));
        if (!hasPermission) {
            const reply = await message.reply(cevaplar.noyt).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
            }, 5000);
            return;
        }

        // Liste komutu
        let allData = await Heykel.find({});
        if (args[0] === "liste") {
            const listText = allData && allData.length > 0
                ? allData.filter(x => message.guild.members.cache.has(x._id)).map((x, index) => {
                    const addedBy = x.added && message.guild.members.cache.get(x.added) ? `(${message.guild.members.cache.get(x.added)})` : "";
                    return `\` ${index + 1} \` ${message.guild.members.cache.get(x._id)} ${addedBy}`;
                }).join("\n")
                : "Yakın arkadaş sistemine eklenmiş bir üye bulunamadı.";
            
            embed.setDescription(listText);
            return message.channel.send({ embeds: [embed] }).catch(err => {});
        }

        // Üye bulma (V14'e uygun fetch/cache kullanımı)
        let uye = message.mentions.members.first() || 
                  message.guild.members.cache.get(args[0]) || 
                  await message.guild.members.fetch({ user: args[0], force: false }).catch(() => null) ||
                  message.guild.members.cache.find(x => x.user.username.toLowerCase() === args.slice(0).join(" ").toLowerCase() || x.user.username === args[0]);

        if (!uye) {
            const reply = await message.reply(cevaplar.üye).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
            }, 5000);
            return;
        }
        
        if (message.author.id === uye.id) {
            const reply = await message.reply(cevaplar.kendi).catch(err => {});
            setTimeout(() => {
                reply.delete().catch(err => {});
            }, 5000);
            return;
        }
        
        const data = await Heykel.findOne({ _id: uye.id });
        const buttonKanalı = message.guild.channels.cache.find(c => c.name === "best-friends"); // Kanal adına göre bulma

        if (!buttonKanalı) {
            return message.reply("`best-friends` adında bir kanal bulunamadı!").catch(err => {});
        }
        
        const bestFriendRole = message.guild.roles.cache.get(roller.Buttons.bestFriendRolü);
        const roleName = bestFriendRole ? bestFriendRole : "@Best Friend";


        if (data) {
            // KALDIRMA İŞLEMİ
            embed.setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla ${uye} üyesinin **${roleName}** rolünü alması için izin kaldırıldı!`);
            
            const sentMessage = await message.channel.send({ embeds: [embed] }).catch(err => {});
            if(sentMessage) {
                setTimeout(() => { sentMessage.delete().catch(err => {}) }, 7500);
            }
            
            await Heykel.deleteOne({ _id: uye.id });
            
            // Rol kaldırma
            if(bestFriendRole) {
                uye.roles.remove(bestFriendRole).catch(err => {});
            }

            // Kanal izni kaldırma (VIEW_CHANNEL: false)
            await buttonKanalı.permissionOverwrites.edit(uye.id, { 
                ViewChannel: false, 
                ReadMessageHistory: false 
            }).catch(err => {
                console.error("Kanal izin kaldırma hatası:", err);
            });

        } else if (!data) {
            // EKLEME İŞLEMİ
            embed.setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla ${uye} üyesinin **${roleName}** rolünü alması için izin eklendi!`);
            
            const sentMessage = await message.channel.send({ embeds: [embed] }).catch(err => {});
            if(sentMessage) {
                setTimeout(() => { sentMessage.delete().catch(err => {}) }, 7500);
            }

            // Veritabanına ekle
            await Heykel.updateOne({ _id: uye.id }, { $set: { "added": message.member.id, "date": Date.now() } }, { upsert: true });

            // Kanal izni ekleme (VIEW_CHANNEL: true)
            await buttonKanalı.permissionOverwrites.edit(uye.id, { 
                ViewChannel: true, 
                ReadMessageHistory: true 
            }).catch(err => {
                console.error("Kanal izin ekleme hatası:", err);
            });
        }
        
        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {});
    }
};