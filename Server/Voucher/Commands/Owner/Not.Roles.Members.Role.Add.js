const { Client, Message, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
// Global fonksiyonların doğru import edildiği varsayılmıştır.
// V14'te EmbedBuilder kullanıldığı için bu satırı değiştirdik.
const { genEmbed } = require("../../../../Global/İnit/Embed");

// Global değişkenlerin doğru import edildiği varsayılmıştır.
// const { ayarlar, roller, cevaplar, emojiler } = global; 

module.exports = {
    Isim: "rolsuzver",
    Komut: ["rolsüzver"],
    Kullanim: "rolsüzver",
    Aciklama: "Sunucuda hiçbir role sahip olmayan üyelere kayıtsız rolünü verir.",
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
        // İzin Kontrolü (Administrator veya kurucu rolleri)
        const hasPermission = message.member.permissions.has(PermissionFlagsBits.Administrator) || 
                              (roller.kurucuRolleri && roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)));
                              
        if (!hasPermission) {
            return message.reply({ content: cevaplar.noyt }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        }
        
        // Rolü olmayan üyeleri filtreleme
        // message.guildId, @everyone rolünün ID'sidir. Sadece @everyone rolüne sahip olanlar filtrelenir.
        const rolsuzuye = message.guild.members.cache.filter(m => 
            // m.roles.cache.size == 1 kontrolü, üyenin sadece @everyone rolüne sahip olduğunu belirtir (ki bu her zaman vardır).
            m.roles.cache.size === 1
        );
        
        // V14 Embed Oluşturma
        const embed = new genEmbed(); 
        // Veya genEmbed'i kullanmayacaksanız: new EmbedBuilder().setColor("Random")
        
        // Rolü olmayan üyelere kayıtsız rolünü verme işlemi
        rolsuzuye.forEach(roluolmayanlar => {
            roluolmayanlar.roles.add(roller.kayıtsızRolleri).catch(err => {
                // Hata yakalama
                console.error(`Rol verme hatası (${roluolmayanlar.user.tag}): ${err.message}`);
            });
        });
        
        // Bilgilendirme mesajı gönderme
        message.channel.send({
            embeds: [embed.setDescription(`Sunucuda rolü olmayan **\`${rolsuzuye.size}\`** üyeye kayıtsız rolü verilmeye başlandı!`)]
        }).then(x => {
            // Mesajı silme
            setTimeout(() => {
                x.delete().catch(err => {});
            }, 7500);
        });

        // Emojiyi tepki olarak ekleme (V14'te emoji Gösterimi)
        // Global emojiler objesi ve guild.emojiGöster fonksiyonunun varlığı varsayılmıştır.
        const onayEmoji = message.guild.emojis.cache.get(emojiler.Onay); 
        if (onayEmoji) {
            message.react(onayEmoji).catch(err => {});
        } else if (emojiler.Onay) {
            // ID ile reaksiyon ekleme (ID string ise)
            message.react(emojiler.Onay).catch(err => {}); 
        }
    }
};