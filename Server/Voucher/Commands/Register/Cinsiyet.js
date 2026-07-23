const { 
    Client, 
    Message, 
    ButtonBuilder, // V14: MessageButton yerine
    ActionRowBuilder, // V14: MessageActionRow yerine
    ButtonStyle, // V14: Düğme stilleri için
    EmbedBuilder // V14: genEmbed'in temelini EmbedBuilder olarak varsayıyorum
} = require("discord.js");

const Users = require('../../../../Global/Databases/Client.Users');
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const {genEmbed} = require('../../../../Global/İnit/Embed');
// NOT: roller, emojiler, cevaplar gibi global değişkenlerin tanımlı olduğu varsayılmıştır.

module.exports = {
    Isim: "cinsiyet",
    Komut: ["cinsiyet","cindeğiş"],
    Kullanim: "cinsiyet @andale/ID",
    Aciklama: "Belirtilen üye sunucuda kayıtsız bir üye ise kayıt etmek için kullanılır.",
    Kategori: "teyit",
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
        let regPanelEmbed = new genEmbed();
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        
        // Yetki Kontrolü
        if(!roller.teyitciRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has('ADMINISTRATOR')) return message.reply({content: cevaplar.noyt}).then(x => setTimeout(() => {x.delete().catch(err => {})}, 5000))
        
        // Üye Kontrolü
        if(!uye) return message.reply({content: cevaplar.üye}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(message.author.id === uye.id) return message.reply({content: cevaplar.kendi}).then(x => { setTimeout(() => {x.delete()}, 5000)})
        if(uye.user.bot) return message.reply({content: cevaplar.bot}).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(!uye.manageable) return message.reply({content: cevaplar.dokunulmaz}).then(x => { setTimeout(() => {x.delete().catch(err => {})}, 5000)})
        if(message.member.roles.highest.position <= uye.roles.highest.position) return message.reply({content: cevaplar.yetkiust}).then(x => { setTimeout(() => {x.delete().catch(err => {})}, 5000)})
        
        // V14: ButtonBuilder ve ActionRowBuilder kullanımı
        const genderSelect = new ActionRowBuilder().addComponents(
                       new ButtonBuilder()
                           .setCustomId('erkekyaxd')
                           .setLabel('Erkek')
                           .setStyle(ButtonStyle.Secondary)
                           .setEmoji("1516450445646626818"),
                       new ButtonBuilder()
                           .setCustomId('lesbienaq')
                           .setLabel('Kadın')
                           .setStyle(ButtonStyle.Secondary)
                           .setEmoji("1516450449341812786"),
                       new ButtonBuilder()
                           .setCustomId('iptal')
                           .setLabel('İptal')
                           .setStyle(ButtonStyle.Danger)
                           .setEmoji("1516450429997678635")
                   );

        const filter = i => i.user.id === message.member.id;
        
        // V14: ephemeral kullanılamaz, sade reply ile gönderiliyor.
        let regPanel = await message.reply({
            embeds: [regPanelEmbed.setDescription(`Aşağıda ${uye} isimli üyenin cinsiyetini değiştirmek için düğmeler verilmiştir.
Tekrardan ses teyiti alarak kontrol etmenizi öneririz. Çünkü ses teyiti alırken ses teyiti alınacak üyenin cinsiyeti değişecektir.`)], 
            components: [genderSelect] 
        });

        const collector = regPanel.createMessageComponentCollector({ filter, time: 15000 });
        let isimveri = await Users.findById(uye.id)
        let isimler = isimveri && isimveri.Name ? isimveri.Name : `${uye.displayName ? uye.displayName : uye.user.username}`
        
        collector.on('collect', async i => {
            if (i.customId === 'erkekyaxd') {
                // V14: edit yerine i.update() kullanmak daha doğrudur.
                await i.update({ embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla ${uye} isimli üye **Erkek** olarak cinsiyet değiştirildi.`)], components: [] }).then(x => {
                    setTimeout(() => {
                        regPanel.delete().catch(err => {})
                    }, 10000);
                })
                await uye.roles.remove(roller.kadınRolleri).catch(err => {})
                await uye.roles.add(roller.erkekRolleri).catch(err => {})
                
                await Users.updateOne({_id: uye.id}, { $push: { "Names": {Staff: message.member.id, Name: isimler, State: `Cinsiyet Değiştirme) (${roller.erkekRolleri.map(x => uye.guild.roles.cache.get(x)).join(",")}`, Date: Date.now() }}}, {upsert: true})
                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
            }
            if (i.customId === 'lesbienaq') {
                // V14: edit yerine i.update() kullanmak daha doğrudur.
                await i.update({ embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla ${uye} isimli üye **Kadın** olarak cinsiyet değiştirildi.`)], components: [] }).then(x => {
                    setTimeout(() => {
                        regPanel.delete().catch(err => {})
                    }, 10000);
                })
                await uye.roles.add(roller.kadınRolleri).catch(err => {})
                await uye.roles.remove(roller.erkekRolleri).catch(err => {})
                
                await Users.updateOne({_id: uye.id}, { $push: { "Names": {Staff: message.member.id, Name: isimler, State: `Cinsiyet Değiştirme) (${roller.kadınRolleri.map(x => uye.guild.roles.cache.get(x)).join(",")}`, Date: Date.now() }}}, {upsert: true})
                
                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
            }
            if (i.customId === 'iptal') {
                await i.update({ embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Iptal)} İşlem iptal edildi.`)], components: [] }).catch(err => {})
                regPanel.delete().catch(err => {})
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {})
            }
        });
        collector.on('end', collected => {
             // Süre dolduğunda da mesajı silmek veya iptal edildi şeklinde düzenlemek iyi bir pratiktir.
             if(regPanel) regPanel.delete().catch(err => {})
        });
    }
};