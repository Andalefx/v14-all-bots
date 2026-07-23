const { 
    Client, Message, EmbedBuilder, PermissionFlagsBits, ChannelType
} = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "taşı",
    Komut: ["kanal-taşı"],
    Kullanim: "taşı <@andale/ID> <Kanal ID>",
    Aciklama: "Belirlenen üyeyi sesten başka bir kanala taşır.",
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
        const hasAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

        if(!roller.altYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.yönetimRolleri.some(oku => message.member.roles.cache.has(oku))  && !hasAdmin) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0]) 
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let kanal = message.guild.channels.cache.get(args[1]);
        
        if(!kanal) return message.reply(cevaplar.argümandoldur).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // V14 Kanal Tipi Kontrolü: GuildVoice kanal tipi (2) kontrolü yapıldı.
        if(kanal.type !== ChannelType.GuildVoice) return message.reply(`${cevaplar.prefix} \`Ses kanalı değil!\` Belirtilen kanal ses kanalı değil.`).then(x => x.delete({timeout: 8500}));
        
        if(message.author.id === uye.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(uye.user.bot) return message.reply(cevaplar.bot).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.member.roles.highest.position <= uye.roles.highest.position) return message.reply(cevaplar.yetkiust).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(!uye.voice.channel) return message.reply(`${cevaplar.prefix} \`Seste Bulunamadı!\` Belirtilen üye seste bulunamadı.`).then(x => x.delete({timeout: 8500}));
        
        // Üyeyi kanala taşıma işlemi
        await uye.voice.setChannel(kanal.id).catch(err => {});
        
        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : '✅').catch(err => {});
        
        // V14 EmbedBuilder Kullanımı
        uye.send({embeds: [new genEmbed().setDescription(`${message.author} tarafından <t:${String(Date.now()).slice(0, 10)}:R> **${kanal.name}** adlı kanala taşındın.`)]}).catch(x => {
            // DM kapalıysa hata yakalanır
        })
    }
};