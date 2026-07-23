const { Client, Message, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
const roller = require("../../../../Global/Settings/Roles.json")
const cevaplar = require("../../../../Global/Settings/Reply")

module.exports = {
    Isim: "rolsay",
    Komut: ["rol-say"],
    Kullanim: "rolsay <Rol-ID>",
    Aciklama: "Belirtilen roldeki üyeleri sayar.",
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
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0])
        
        if (!role) return message.reply({content: `${cevaplar.prefix} Sayabilmem için lütfen bir **rol** belirtiniz.`, ephemeral: true }).catch(e => {})
        
        // Üye listesini etiketleme formatında hazırlama
        const memberList = role.members.map(e => `<@${e.id}>`).join(", ")
        
        // message.member.Leaders() fonksiyonunun var olduğu varsayılmıştır.
        
        // Özet bilgiyi gönderme (CodeBlock stringi doğrudan kullanıldı)
        const summary = `Sunucumuzda ${role.name} | ${role.id} rolünde ${role.members.size < 1 ? "kimse bulunmuyor" : role.members.size + " kişi bulunuyor"}`;

        await message.channel.send(`\`\`\`js\n${summary}\n\`\`\``);

        // Üyeleri listeleme
        if (role.members.size >= 1) {
            
            let currentContent = memberList;
            const maxChunkSize = 1950; // Discord'un 2000 karakter sınırından biraz az
            const chunks = [];

            // Manuel olarak parçalama döngüsü
            while (currentContent.length > maxChunkSize) {
                // Sınırın hemen altından bölmeye çalış
                let slicePoint = currentContent.slice(0, maxChunkSize).lastIndexOf(',');
                
                // Eğer virgül bulamazsak (nadiren olur, tek bir etiketin boyutu 1950'yi aşmaz)
                if (slicePoint === -1) {
                    slicePoint = maxChunkSize; 
                }

                chunks.push(currentContent.slice(0, slicePoint));
                currentContent = currentContent.slice(slicePoint + 1).trim(); // Virgülü ve başındaki boşluğu at
            }

            // Kalan son parçayı ekle
            if (currentContent.length > 0) {
                chunks.push(currentContent);
            }

            // Parçaları mesaj olarak gönderme
            for (const element of chunks) {
                 await message.channel.send(`\`\`\`js\n${element}\n\`\`\``).catch(e => {});
            }
        }
    }
};