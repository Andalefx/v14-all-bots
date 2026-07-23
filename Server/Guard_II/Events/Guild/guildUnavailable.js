const { MessageEmbed, Guild } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

/**
* @param {Guild} guild
*/


module.exports = async (guild) => {
    // Sunucu objesinin geçerli olduğunu varsayıyoruz (guildUnavailable tarafından sağlanır).
    
    const client = guild.client;

    // Not: Bu event'in normalde Guard veritabanı kontrolü olmaz çünkü sunucu kullanılmaz hale gelmiştir.
    // Ancak orijinal kodda Guard veritabanı kontrolü yoktu, sadece işlemi yapar.
    
    let embed = new genEmbed().setTitle("Sunucu Kullanılmaz Halde!")
    
    // Güvenlik Önlemi: Tüm İzinleri Kapat
    // client.allPermissionClose() fonksiyonunun hala tanımlı olduğu varsayılmıştır.
    client.allPermissionClose()
    
    embed.setDescription(`Sunucu **kullanılmaz hale getirildiği** için otomatik olarak sunucu içerisindeki tüm yönetici, rol yönet, kanal yönet ve diğer izinleri tamamiyle **kapattım**.`);
    
    let loged = guild.kanalBul("guard-log");
    if(loged) await loged.send({embeds: [embed]}).catch(err => {
        // Log kanalına mesaj gönderilemeyebilir (sunucu kullanılamaz olduğu için)
    });
    
    const owner = await guild.fetchOwner().catch(err => {
        // Sunucu sahibi de erişilemez olabilir
        client.logger.error(`[Unavailable] ${guild.name} sunucusunun sahibine erişilemedi.`);
    });
    
    if(owner) owner.send({embeds: [embed]}).catch(err => {})
}

module.exports.config = {
    Event: "guildUnavailable"
}