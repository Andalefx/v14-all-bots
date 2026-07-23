const { 
    Client, 
    Message, 
    EmbedBuilder, // MessageEmbed yerine EmbedBuilder
} = require("discord.js");

// Varsayımlar: Global değişkenlerin ve Schemaların tanımlı olduğunu varsayıyoruz.
const { genEmbed } = require("../../../../Global/İnit/Embed");
const guildSettings = require('../../../../Global/Databases/Global.Guild.Settings');

// Emojiler ve diğer global ayarlar
const emojiler = global.emojiler || { Onay: '✅', Iptal: '❌' }; 
const cevaplar = global.cevaplar || { prefix: "[INFO]" };
const sistem = global.sistem || { botSettings: { Prefixs: ["."] } }; // Prefix varsayımı


module.exports = {
    Isim: "rolsil",
    Komut: ["rolsil"],
    Kullanim: "rolsil <@rol/ID>",
    Aciklama: "Belirtilen rolü sunucudan siler.",
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
        
        // Veri Çekme (Kullanılmasa da orijinal yapıyı koruduk)
        let veriData = await guildSettings.findOne({ guildID: message.guild.id });
        let sunucuData = veriData ? veriData.Ayarlar : {};
        
        // Rol Bulma
        const rol = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);

        if (!rol) {
            // Hata mesajı gönderiliyor
            message.reply({ content: `${cevaplar.prefix} Lütfen geçerli bir rol belirtin!` }).then(x => {
                setTimeout(() => { x.delete().catch(err => {}) }, 7500)
            });
            // Tepki veriliyor (Hata mesajına)
            message.react(reactEmoji('Iptal')).catch(err => {});
            return;
        }

        // --- ROLÜ SİLME İŞLEMİ VE GERİ BİLDİRİM ---
        
        // 1. Kullanıcıya başarılı mesajını ve geri kurma bilgisini gönder
        // Rol silinmeden önce mesajı gönderiyoruz
        message.channel.send({ 
            embeds: [
                embed.setFooter({ text: `silinen rolü tekrardan kurmak istermisin? ${sistem.botSettings.Prefixs[0]}rolkur ${rol.id}` })
                     .setDescription(`${reactEmoji('Onay')} Başarıyla **${rol.name}** (\`${rol.id}\`) isimli rol \`${message.guild.name}\` sunucusundan **silinecek**.`)
            ] 
        }).then(x => {
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 35000)
        });
        
        // 2. Mesaja başarılı tepkisi ver
        message.react(reactEmoji('Onay')).catch(err => {});

        // 3. Rolü biraz bekleyerek sil
        setTimeout(async () => {
            await rol.delete(`Manuel olarak ${message.author.tag} tarafından silindi.`).catch(err => {
                 console.error(`Rol silinirken hata oluştu: ${err.message}`);
                 // Eğer silinemezse, kullanıcıya tepkiyi iptal edebiliriz veya loglayabiliriz.
            });
        }, 2500);
    }
};