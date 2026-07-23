const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType 
} = require("discord.js");
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require('../../../../Global/İnit/Embed');

// Global değişkenlerin ve fonksiyonların varlığı varsayılmıştır.
// const { roller, ayarlar, cevaplar, emojiler, _statSystem } = global;

module.exports = {
    Isim: "taglı",
    Komut: ["tagaldır", "tagli", "tag"],
    Kullanim: "tag <@andale/ID>",
    Aciklama: "Belirlenen üyeyi komutu kullanan üyenin taglısı olarak belirler.",
    Kategori: "stat",
    Extend: ayarlar.type, // ayarlar.type'ın var olduğu varsayılır
    
    onLoad: function (client) {},

    onRequest: async function (client, message, args) {
        let embed = new genEmbed();
        
        // Emoji Bulucu Helper Fonksiyon (V14'e uygun cache üzerinden çeker)
        const getEmoji = (name) => message.guild.emojis.cache.get(emojiler[name]) || (name === "Onay" ? '✅' : '❌');
        
        // İzin Kontrolü
        const hasPermission = roller.teyitciRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.Yetkiler.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku)) || 
                              message.member.permissions.has(PermissionFlagsBits.Administrator);
                              
        if (!hasPermission) return; // İzni yoksa sessizce çıkar

        // Üye Bulma
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!uye) return message.reply({ content: cevaplar.üye }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Kendi kendine işlem kontrolü
        if (message.author.id === uye.id) return message.reply({ content: cevaplar.kendi }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));

        // Tag kontrolü (Eğer ayarlar.type açıksa)
      if (ayarlar.type && !uye.roles.cache.has(ayarlar.tagRolu)) {
    return message.reply({ content: cevaplar.taglıalım }).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
}
        
        // Hesap yaş kontrolü (7 günden küçük)
        const sevenDays = 1000 * 60 * 60 * 24 * 7;
        if (Date.now() - uye.user.createdTimestamp < sevenDays) {
            return message.reply({ content: cevaplar.yenihesap }).then(x => {
                setTimeout(() => { x.delete().catch(err => {}); }, 7500);
            });
        }
        
        // Zaten bir başkası tarafından taglı olarak belirlenmiş mi?
        let kontrol = await Users.findOne({ _id: uye.id });
        if (kontrol && kontrol.Tagged) {
            return message.reply({ content: `${cevaplar.prefix} ${uye} isimli üye zaten bir başkası tarafından taglı olarak belirlenmiş.` }).then(x => {
                setTimeout(() => { x.delete().catch(err => {}); }, 5000);
            });
        }
        
        // --------------------------------------------------------------------------------
        // Onay Mesajı ve Butonlar (V14 Builders)
        // --------------------------------------------------------------------------------

        embed.setDescription(`${message.member.toString()} isimli yetkili seni **taglı** olarak belirlemek istiyor. Kabul ediyor musun?`);
        
        const OKButton = new ButtonBuilder()
            .setCustomId("OK")
            .setEmoji(getEmoji("Onay").id || getEmoji("Onay"))
            .setLabel("Kabul Ediyorum!")
            .setStyle(ButtonStyle.Success);

        const NOButton = new ButtonBuilder()
            .setCustomId("NO")
            .setEmoji(getEmoji("Iptal").id || getEmoji("Iptal"))
            .setLabel("Kabul Etmiyorum!")
            .setStyle(ButtonStyle.Secondary);

        const Row = new ActionRowBuilder().addComponents(OKButton, NOButton);
        
        // Mesajı gönderme ve Collector başlatma
        message.channel.send({ 
            content: uye.toString(), 
            embeds: [embed], 
            components: [Row] 
        }).then(async (msg) => {
            const filter = i => i.user.id === uye.id;
            const collector = msg.createMessageComponentCollector({ filter, errors: ["time"], time: 30000 });
            
            collector.on('collect', async (i) => {
                await i.deferUpdate(); // Buton etkileşimini ertele

                if (i.customId == "OK") {
                    // Başarılı İşlem
                    message.react(getEmoji("Onay").id || getEmoji("Onay")).catch(err => {});
                    
                    // Veritabanı Güncelleme
                    await Users.updateOne({ _id: uye.id }, { $set: { "Tagged": true, "TaggedGiveAdmin": message.member.id } }, { upsert: true });
                    await Users.updateOne({ _id: message.member.id }, { $push: { "Taggeds": { id: uye.id, Date: Date.now() } } }, { upsert: true });
                    
                    // Puan ve Liderlik Güncelleme (Varsayılan Global Fonksiyonlar)
                    client.Upstaffs.addPoint(message.member.id, _statSystem.points.tagged, "Taglı");
                    message.member.Leaders("tag", _statSystem.points.tagged, { type: "TAGGED", user: uye.id });

                    // Sonuç Mesajı
                    const successEmbed = new genEmbed().setDescription(`${getEmoji("Onay")} ${uye.toString()} üyesi ${message.author} tarafından <t:${String(Date.now()).slice(0, 10)}:R> başarıyla **taglı** olarak belirlendi!`);
                    msg.edit({ content: uye.toString(), embeds: [successEmbed], components: [] }).catch(err => {});
                    
                    // Log Kanalına Gönderme
                    let taglıLog = message.guild.kanalBul("taglı-log");
                    if (taglıLog) {
                        taglıLog.send({ embeds: [new genEmbed().setDescription(`${uye} isimli üye <t:${String(Date.now()).slice(0, 10)}:R> ${message.author} tarafından **taglı** olarak belirlendi.`)] }).catch(err => {});
                    }
                }
                
                if (i.customId == "NO") {
                    // Reddedilme İşlemi
                    message.react(getEmoji("Iptal").id || getEmoji("Iptal")).catch(err => {});
                    
                    const rejectEmbed = new genEmbed().setColor("Red").setDescription(`${getEmoji("Iptal")} ${uye.toString()} isimli üye, **${message.guild.name}** taglı belirleme teklifini **reddetti!**`);
                    
                    msg.edit({ content: message.member.toString(), embeds: [rejectEmbed], components: [] }).catch(err => {});
                }
                
                collector.stop(); // İşlem bittiğinde collector'ü durdur
            });
            
            collector.on('end', collected => {
                if (collected.size === 0) {
                    // Zaman aşımı (Kimse basmadıysa)
                    const timeoutEmbed = new genEmbed().setColor("Red").setDescription(`${getEmoji("Iptal")} Onay süresi dolduğu için işlem iptal edildi.`);
                    msg.edit({ content: uye.toString(), embeds: [timeoutEmbed], components: [] }).catch(err => {});
                }
            });
            
        }).catch(err => {
            // Mesaj gönderme hatası
            console.error("Taglı Onay Mesajı Gönderilirken Hata:", err);
        });
    }
};