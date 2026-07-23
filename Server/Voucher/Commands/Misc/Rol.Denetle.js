const { Client, Message, EmbedBuilder, PermissionsBitField, Formatters, splitMessage, Util } = require("discord.js");
// V14: MessageEmbed yerine EmbedBuilder, Util.splitMessage yerine splitMessage kullanıldı.

const { genEmbed } = require("../../../../Global/İnit/Embed");
// Varsayım: 'roller', 'cevaplar', 'tarihsel' ve 'message.member.Leaders' gibi özel fonksiyonların erişilebilir olduğu varsayılmıştır.
const roller = require("../../../../Global/Settings/Roles.json")
const cevaplar = require("../../../../Global/Settings/Reply")
module.exports = {
    Isim: "roldenetle",
    Komut: ["rol-denetle","roldenetim","rol-denetim"],
    Kullanim: "roldenetim <Rol-ID>",
    Aciklama: "Belirtilen bir rolün üyelerinin seste olup olmadığını ve rol bilgilerini gösterir.",
    Kategori: "yönetim",
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
        let embed = new genEmbed();
        
        // Yetki Kontrolü
        const requiredRoles = [
            ...(roller.üstYönetimRolleri || []),
            ...(roller.yönetimRolleri || []),
            ...(roller.kurucuRolleri || [])
        ];
        
        const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || requiredRoles.some(oku => message.member.roles.cache.has(oku));
        
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Rol Bulma
        // message.guild.rolBul() fonksiyonunun var olduğu varsayılmıştır.
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || message.guild.roles.cache.find(x => x.name.toLowerCase().includes(args[0] ? args[0].toLowerCase() : "")) || message.guild.rolBul(args[0])
        
        if (!role) return message.reply({content: `${cevaplar.prefix} Denetleyebilmem için lütfen bir rol belirtiniz.`, ephemeral: true }).catch(e => {})

        // Üye Filtreleme
        let unVoice = role.members.filter(member => !member.voice.channel);
        
        // Dosya İçeriği Hazırlama
        let list = 1
        // tarihsel() fonksiyonunun var olduğu varsayılmıştır.
        let veri = `${tarihsel(Date.now())} Tarihinde ${message.member.user.tag} tarafından istenmiştir!\n` + 
                   role.members.map((e) => {
                       // V14: member.displayName yerine e.displayName kullanıldı (e zaten member objesi)
                       return `#${list++} ••❯ ID: ${e.id} - İsim: ${e.displayName} - ${e.voice.channel ? "Seste" : "Seste Değil"}`
                   }).join("\n")

        // message.member.Leaders() fonksiyonunun var olduğu varsayılmıştır.
        message.member.Leaders("rol", 0.01, {type: "ROLE", role: role.id, channel: message.channel.id})
        
        // Bilgi Mesajı ve Dosyayı Gönderme
        // V14 Tarih Formatı: <t:timestamp:R>
        const timestamp = String(Date.now()).slice(0, 10);
        
        await message.channel.send({
            content: `\` ••❯ \` Aşağıda <t:${timestamp}:R> istenen **${role.name}** isimli rol bilgisi ve rol denetimi belirtilmiştir. (**Dosya içerisinde genel seste olan olmayan olarak üyeleri listelenmiştir.**)
${Formatters.codeBlock("fix", `Rol: ${role.name} | ${role.id} | ${role.members.size} Toplam Üye | ${unVoice.size} Seste Olmayan Üye`)}`,
            files: [{
                attachment: Buffer.from(veri),
                name: `${role.id}-genelbilgisi.txt`
            }]
        }).catch(e => console.error("Dosya gönderme hatası:", e));
        
        // Seste Olmayan Üyeleri Listeleme
        if(unVoice.size > 0) {
             message.channel.send({content: `Aşağıda **${role.name}** (\`${role.id}\`) isimli rolünün **seste olmayan** üyeleri sıralandırılmıştır.`}).then(xx => {
                const unVoiceMembers = unVoice.map(e => `<@${e.id}>`).join(", ");
                
                // V14: splitMessage fonksiyonunu kullanıyoruz.
                const arr = splitMessage(unVoiceMembers, { maxLength: 1950, char: "," });
                
                arr.forEach(element => {
                    message.channel.send(Formatters.codeBlock("diff", element)).catch(e => {}); // Formatters kullanıldı
                });
             }).catch(e => {});
        } else {
             message.channel.send({content: `**${role.name}** (\`${role.id}\`) isimli rolündeki tüm üyeler şu anda seste bulunuyor!`}).catch(e => {});
        }
    }
};