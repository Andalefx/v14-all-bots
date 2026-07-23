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

// Emojiler ve diğer global ayarlar
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 
const cevaplar = global.cevaplar || { prefix: "[INFO]" };
const sistem = global.sistem || { botSettings: { Prefixs: ["."] } }; 


module.exports = {
    Isim: "rolkur",
    Komut: ["kur"],
    Kullanim: "rolkur <Yedek Rol ID>",
    Aciklama: "Silinmiş bir rolün yedeğini kurar ve üyelerine dağıtır.",
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
        
        // Rol ID Kontrolü
        if (!args[0] || isNaN(args[0])) {
            return message.reply("Lütfen bir rol ID'si belirtin!");
        }
        
        const oldRoleID = args[0];
        
        // Veritabanından Rol Yedeğini Çekme
        const data = await roleBackup.findOne({ roleID: oldRoleID }).catch(err => {
            console.error("Rol yedeği çekilirken hata:", err);
            return null;
        });

        if (!data) {
            return message.channel.send({ content: `${cevaplar.prefix} Belirtilen rol geçmişte bulunamadığından işlem iptal edildi ` }).then(x => {
                message.react(reactEmoji('Iptal')).catch(err => {})
            });
        }
        
        // --- YENİ ROLÜ OLUŞTURMA ---
        
        let newRole;
        
        // Rol oluşturma seçenekleri
        const roleOptions = {
            name: data.name,
            color: data.color || '#000000', // Renk yoksa varsayılan
            hoist: data.hoist,
            permissions: new PermissionsBitField(BigInt(data.permissions)), // V14 için BigInt ve PermissionsBitField
            position: data.position,
            mentionable: data.mentionable,
            reason: `Rol Silindiği İçin Tekrar Oluşturuldu! (Yedek ID: ${oldRoleID})`,
        };
        
        // Eğer ikon verisi varsa (V14'te sadece boost seviyesi 2+ olan sunucularda geçerlidir)
        if (data.icon) {
            roleOptions.icon = data.icon;
        }

        try {
            newRole = await message.guild.roles.create(roleOptions);
        } catch (error) {
            console.error("Rol oluşturulurken hata:", error);
            return message.channel.send({ content: `${cevaplar.prefix} Rol oluşturulurken bir hata oluştu: ${error.message}` });
        }
        
        // --- BAŞARI VE DAĞITIM BİLGİSİ ---

        message.react(reactEmoji('Onay')).catch(err => {});
        
        // Tahmini Süre Hesaplama
        const memberCount = data.members.length;
        const estimatedTime = memberCount > 1000 
            ? `${parseInt((memberCount * (250 / 1000)) / 60)} dakika` 
            : `${parseInt(memberCount * (250 / 1000))} saniye`;

        await message.channel.send({ 
            embeds: [
                embed.setFooter({ text: "Rol üyelerine dağıtılmaya ve kanal izinleri eklenmeye başlanıyor." })
                     .setDescription(`${reactEmoji('Onay')} <@&${newRole.id}> (\`${newRole.id}\`) isimli rol oluşturuldu ve gereken ayarları yapıldı.
**Dağıtılacak Rol**: ${newRole}
**Dağıtılacak Üye Sayısı**: ${memberCount}
**Tahmini Dağıtım Süresi**: ${estimatedTime}`)
            ] 
        });
        
        // 4. Dağıtım ve İzin Güncelleme İşlemlerini Başlatma
        // client.rolKur ve client.queryManage fonksiyonlarının varlığını varsayıyoruz.
        if (client.rolKur) {
            await client.rolKur(oldRoleID, newRole.id); // Rol ID'lerini güncelle
        }
        if (client.queryManage) {
            await client.queryManage(oldRoleID, newRole.id).catch(err => {}); // Kanal izinlerini güncelle
        }
    }
};