const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine EmbedBuilder
    PermissionsBitField,
} = require("discord.js");

// Varsayımlar: Global değişkenlerin ve Schemaların tanımlı olduğunu varsayıyoruz.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const roleBackup = require('../../../../Global/Databases/Guild.Roles');
const guildSettings = require('../../../../Global/Databases/Global.Guild.Settings');

// Emojiler ve sistem ayarları (Global değişkenlerden gelmeli)
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 
const cevaplar = global.cevaplar || { prefix: "[INFO]" };
const sistem = global.sistem || { SERVER: { ID: "SUNUCU_ID" } }; // sistem.SERVER.ID varsayımı


module.exports = {
    Isim: "rolsenkronize",
    Komut: ["rolesync","rolsenkron","rolsync"],
    Kullanim: "rolsync <Eski Rol ID> <Yeni/Hedef Rol ID>",
    Aciklama: "Yedeklenmiş bir rolün kanal izinlerini, mevcut başka bir role senkronize eder.",
    Kategori: "-",
    Extend: false,
    
    /**
     * @param {Client} client 
     * @param {Message} message 
     * @param {Array<String>} args 
     */
    onRequest: async function (client, message, args) {
        
        // --- DM KONTROLÜ ---
        if (!message.guild || !message.member) return;
        
        // Emoji Erişimi için Güvenli Fonksiyon
        const reactEmoji = (emojiName) => {
            const emoji = emojiler[emojiName];
            if (!emoji) return emojiName === 'Onay' ? '✅' : '❌';
            if (message.guild.emojis.cache.has(emoji)) {
                return message.guild.emojis.cache.get(emoji).id;
            }
            return emoji;
        }

        const embed = new genEmbed();
        
        // Argüman Kontrolleri
        const oldRoleID = args[0]; // Yedek verisi çekilecek eski rol ID
        const targetRoleID = args[1]; // İzinlerin uygulanacağı mevcut rol ID
        
        if (!oldRoleID || isNaN(oldRoleID)) return message.reply("Lütfen **eski** bir rol ID'si belirtin!").catch(e => {});
        if (!targetRoleID || isNaN(targetRoleID)) return message.reply("Lütfen izinleri senkronize olacak **hedef** rol ID'si belirtin!").catch(e => {});
        
        // Hedef Rolü Bulma
        const rolBul = message.guild.roles.cache.get(targetRoleID);
        if (!rolBul) return message.reply("Senkron edilecek rol bulunamadı.").catch(e => {});
        
        // Veritabanından Eski Rol Yedeğini Çekme
        const data = await roleBackup.findOne({ roleID: oldRoleID }).catch(err => {
            console.error("Rol yedeği çekilirken hata:", err);
            return null;
        });

        if (!data) {
            return message.channel.send({ content: `${cevaplar.prefix} Belirtilen **eski** rol ID'sine ait geçmiş veri bulunamadı.` }).then(x => {
                message.react(reactEmoji('Iptal')).catch(err => {})
            });
        }
        
        // --- İZİNLERİ SENKRONİZE ETME ---
        
        const channelPerms = data.channelOverwrites.filter(e => message.guild.channels.cache.get(e.id));
        
        if (channelPerms.length === 0) {
             return message.channel.send({ content: `${cevaplar.prefix} Veritabanında bu role ait güncel kanal izin verisi bulunamadı.` }).then(x => {
                message.react(reactEmoji('Iptal')).catch(err => {})
            });
        }

        try {
            for (const perm of channelPerms) {
                const kanal = message.guild.channels.cache.get(perm.id);
                if (!kanal) continue;

                // İzinler, V14'teki create methoduna uygun hale getiriliyor.
                const allowBits = BigInt(PermissionsBitField.resolve(perm.allow));
                const denyBits = BigInt(PermissionsBitField.resolve(perm.deny));
                
                // İzinleri sıfırlayıp yeni izinleri uygular
                await kanal.permissionOverwrites.edit(rolBul.id, {
                    allow: allowBits,
                    deny: denyBits
                }).catch(error => {
                    // Loglama için client.logger kontrolü eklendi
                    if (client.logger && client.logger.error) {
                         client.logger.error(`Kanal ${kanal.name} için rol senkronizasyonunda hata: ${error.message}`);
                    } else {
                         console.error(`Kanal ${kanal.name} için rol senkronizasyonunda hata:`, error);
                    }
                });
            }
            
            // Başarılı Mesaj
            message.react(reactEmoji('Onay')).catch(err => {});
            message.channel.send({ 
                embeds: [
                    embed.setDescription(`${reactEmoji('Onay')} Başarıyla **${rolBul.name}** rolünün kanal izinleri, eski rol ID (\`${oldRoleID}\`) verilerine göre **${channelPerms.length}** kanalda senkronize edildi.`)
                ]
            }).then(x => {
                setTimeout(() => { x.delete().catch(e => {}) }, 15000);
            });

        } catch (error) {
            console.error("Senkronizasyon sırasında ana hata:", error);
            message.react(reactEmoji('Iptal')).catch(err => {});
            message.channel.send({ content: `${cevaplar.prefix} Senkronizasyon işlemi sırasında beklenmeyen bir hata oluştu.` });
        }
    }
};