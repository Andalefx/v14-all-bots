const { 
    Client, 
    Message, 
    EmbedBuilder // V14: genEmbed'in temelini EmbedBuilder olarak varsayıyorum
} = require("discord.js");
// NOT: MessageButton ve MessageActionRow kaldırıldı, çünkü komut içinde kullanılmıyor.

const Users = require('../../../../Global/Databases/Client.Users');
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const {genEmbed} = require('../../../../Global/İnit/Embed');
// NOT: roller, emojiler, cevaplar, ayarlar, tarihsel, _statSystem gibi global değişkenlerin tanımlı olduğu varsayılmıştır.

module.exports = {
    Isim: "erkek",
    Komut: ["e","er"],
    Kullanim: "erkek @andale/ID <isim/nick>",
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
        if(ayarlar.dugmeliKayit) return;
        let regPanelEmbed = new genEmbed();
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        
        // **V14 Uyumlu Yanıtlar**
        const replyOptions = (content, embeds = []) => ({ content: content, embeds: embeds });
        const errorReply = (content, timeout = 5000) => message.reply(replyOptions(content)).then(s => setTimeout(() => s.delete().catch(err => {}), timeout));
        const embedErrorReply = (embeds, timeout = 5000) => message.reply(replyOptions(null, embeds)).then(s => setTimeout(() => s.delete().catch(err => {}), timeout));
        
        if(!roller.teyitciRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has('ADMINISTRATOR')) return errorReply(cevaplar.noyt);
        if(!uye) return errorReply(cevaplar.üye);
        
        let uyarısıVar = await Punitives.findOne({Member: uye.id, Type: "Uyarılma"})
        
        if(message.author.id === uye.id) return errorReply(cevaplar.kendi);
        if(uye.user.bot) return errorReply(cevaplar.bot);
        if(!uye.manageable) return errorReply(cevaplar.dokunulmaz);
        if(roller.erkekRolleri.some(x => uye.roles.cache.has(x)) || roller.kadınRolleri.some(x => uye.roles.cache.has(x))) return errorReply(cevaplar.kayıtlı);
        if(message.member.roles.highest.position <= uye.roles.highest.position) return errorReply(cevaplar.yetkiust);
        
        if(ayarlar.taglıalım && ayarlar.taglıalım != false && !uye.user.username.includes(ayarlar.tag) && !uye.roles.cache.has(roller.boosterRolü) && !uye.roles.cache.has(roller.vipRolü) && !message.member.permissions.has('ADMINISTRATOR') && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) return errorReply(cevaplar.taglıalım);
        
        if(ayarlar.teyitZorunlu && !uye.voice.channel && !uye.roles.cache.has(roller.boosterRolü) && !uye.roles.cache.has(roller.vipRolü) && !message.member.permissions.has('ADMINISTRATOR') && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) {
             return embedErrorReply([
                new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Iptal)} **${ayarlar.serverName}** sunucusunda **Ses Teyit** zorunluluğu bulunduğundan dolayı ${uye} isimli üyenin kayıt işlemi \`${tarihsel(Date.now())}\` tarihinde iptal edildi.`).setFooter({text: `Belirtilen üyenin seste bulunmasıyla, tekrardan teyit alınabilir.`})
             ], 15000).then(() => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {})
             });
        }
        
        if(Date.now()-uye.user.createdTimestamp < 1000*60*60*24*7 && !message.member.permissions.has('ADMINISTRATOR') && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !roller.üstYönetimRolleri.some(oku => message.member.roles.cache.has(oku))) return errorReply(cevaplar.yenihesap);
        if(uye.roles.cache.has(roller.şüpheliRolü) || uye.roles.cache.has(roller.jailRolü) || uye.roles.cache.has(roller.underworldRolü) || uye.roles.cache.has(roller.yasaklıTagRolü) && !message.member.permissions.has('ADMINISTRATOR') && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) return errorReply(cevaplar.cezaliüye);
        
        args = args.filter(a => a !== "" && a !== " ").splice(1);
        let setName;
        let isim = args.filter(arg => isNaN(arg)).map(arg => arg.charAt(0).replace('i', "İ").toUpperCase()+arg.slice(1)).join(" ");
        if(!isim) return errorReply(cevaplar.argümandoldur);
        
        let yaş = args.filter(arg => !isNaN(arg))[0] || undefined;
        if(ayarlar.isimyas && !yaş) return errorReply(cevaplar.argümandoldur);
        if (ayarlar.isimyas && yaş < ayarlar.minYaş) return errorReply(cevaplar.yetersizyaş);
        
        if(ayarlar.isimyas) {
            setName = `${isim} | ${yaş}`;
        } else {
            setName = `${isim}`;
        }
        
        let cezaPuanı = await uye.cezaPuan()
        if(cezaPuanı >= 100 && !message.member.permissions.has('ADMINISTRATOR') && (roller.sorunÇözmeciler && !roller.sorunÇözmeciler.some(x => message.member.roles.cache.has(x))) && !roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku))) {
            return embedErrorReply([
                new genEmbed().setDescription(`Belirlenen ${uye} isimli üyenin ceza puanı 100'ün üzerinde olduğu için kayıt işlemi alınamıyor. 
Bir itirazınız var ise ${roller.sorunÇözmeciler ? roller.sorunÇözmeciler.filter(x => message.guild.roles.cache.has(x)).map(x => message.guild.roles.cache.get(x)).join(", ") : roller.altYönetimRolleri.filter(x => message.guild.roles.cache.has(x)).map(x => message.guild.roles.cache.get(x)).join(", ")} rolü ve üstündeki rollerden herhangi bir yetkiliye ulaşınız ve durumu onlara da anlatınız.`)
            ], 15000).then(() => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {})
            });
        }
        
        // Kayıt işlemleri
        
        await message.reply({ embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay)} Başarıyla ${uye} isimli üye **Erkek** olarak kayıt edildi.`)], components: [] }).then(x => {
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 10000);
        });
        
        // V14: setNickname
        uye.setNickname(`${ayarlar.type ? uye.user.username.includes(ayarlar.tag) ? ayarlar.tag + " " : (ayarlar.tagsiz ? ayarlar.tagsiz + " " : (ayarlar.tag || "")) : ``}${setName}`).catch(err => message.reply(cevaplar.isimapi));
        
        // Register fonksiyonu botunuzun özel fonksiyonu olduğu için çağrımı değiştirilmedi.
        uye.Register(`${setName}`, "Erkek", message.member);
        
        // Upstaffs fonksiyonu botunuzun özel fonksiyonu olduğu için çağrımı değiştirilmedi.
        client.Upstaffs.addPoint(message.member.id,_statSystem.points.record, "Kayıt")
        
        message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined).catch(err => {})
    }
};