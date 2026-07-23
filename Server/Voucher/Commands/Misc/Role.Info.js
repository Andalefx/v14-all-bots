const { Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, PermissionsBitField, splitMessage } = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");
const roller = require("../../../../Global/Settings/Roles.json")
const cevaplar = require("../../../../Global/Settings/Reply")
const emojiler = require("../../../../Global/Settings/Emoji.json")

module.exports = {
    Isim: "rolbilgi",
    Komut: ["rol-bilgi", "rolinfo", "bilgirol"],
    Kullanim: "rolbilgi <@Rol/ID>",
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
        let role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0])
        
        if(!role) {
            message.reply({content: `Belirtilen argümanlarda rol'e ait herhangi bir bilgi bulunamadı.`}).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined).catch(err => {})
                setTimeout(() => {
                    x.delete().catch(err => {})
                }, 5000);
            })
            return;
        }

        // message.member.Leaders() fonksiyonunun var olduğu varsayılmıştır.
        message.member.Leaders("rol", 0.01, {type: "ROLE", role: role.id, channel: message.channel.id})
        
        let load = await message.reply({content: `Belirtilen **${role.name}** rolünün bilgileri getirilirken lütfen bekleyin.`})
        
        // Gelişmiş Filtreleme (Çevrimdışı ve Bilinmeyen durumu kapsar)
        
        // Çevrim-Dışı/Bilinmeyen Status ve Seste Olmayanlar
        let offlinemembers = role.members.filter(x => !x.user.bot && !x.voice.channel && (x.presence?.status === "offline" || !x.presence?.status));
        
        // Aktif (Online/Idle/DND) ve Seste Olanlar
        let sestemembers = role.members.filter(x => !x.user.bot && x.presence?.status && x.presence.status !== "offline" && x.voice.channel);
        
        // Aktif (Online/Idle/DND) ve Seste Olmayanlar
        let sesteolmayanaktif = role.members.filter(x => !x.user.bot && x.presence?.status && x.presence.status !== "offline" && !x.voice.channel);
        
        // Çevrim-Dışı/Bilinmeyen Status ancak Seste Olanlar
        let offlineamaseste = role.members.filter(x => !x.user.bot && x.voice.channel && (x.presence?.status === "offline" || !x.presence?.status));


        let text = `**Rol Adı**: ${role.name} (\`${role.id}\`)
**Rol Rengi**: ${role.hexColor} (\`${role.color}\`)
**Rol Pozisyon**: ${role.rawPosition}
**Rol Üye Sayısı**:  ${role.members.size} 
─────────────────────
**Üyeler (\`Çevrim-Dışı/Bilinmeyen - Seste Olmayan\`) (\`${offlinemembers.size} üye\`)**
─────────────────────
${offlinemembers.size > 0 ? offlinemembers.map(x => {
    return `<@${x.id}> [\`${x.displayName ? x.displayName : x.user.username}\`]`
}).slice(0, 10).join("\n") + (offlinemembers.size > 10 ? `\n...ve ${offlinemembers.size - 10} üye daha` : `\n\n`) : `Çevrim-dışı üye bulunamadı.\n\n`}
─────────────────────
**Üyeler (\`Aktif - Seste Olmayan\`) (\`${sesteolmayanaktif.size} üye\`)**
─────────────────────
${sesteolmayanaktif.size > 0 ? sesteolmayanaktif.map(x => {
    return `${x} [\`${x.displayName ? x.displayName : x.user.username}\`] (\`${x.id}\`)`
}).slice(0, 10).join("\n") + (sesteolmayanaktif.size > 10 ? `\n...ve ${sesteolmayanaktif.size - 10} üye daha` : `\n\n`) : `Seste olmayan aktif bir üye bulunamadı.\n\n`}
─────────────────────
**Üyeler (\`Seste Olanlar (Aktif)\`) (\`${sestemembers.size} üye\`)**
─────────────────────
${sestemembers.size > 0 ? sestemembers.map(x => {
    return `${x} [\`${x.displayName ? x.displayName : x.user.username}\`] (${x.voice.channel.name})`
}).slice(0, 10).join("\n") + (sestemembers.size > 10 ? `\n...ve ${sestemembers.size - 10} üye daha` : `\n\n`) : `Seste olan aktif bir üye bulunamadı.\n\n`}
─────────────────────
**Üyeler (\`Çevrim-Dışı/Bilinmeyen - Seste Olanlar\`) (\`${offlineamaseste.size} üye\`)**
─────────────────────
${offlineamaseste.size > 0 ? offlineamaseste.map(x => {
    return `${x} [\`${x.displayName ? x.displayName : x.user.username}\`] (${x.voice.channel.name})`
}).slice(0, 10).join("\n") + (offlineamaseste.size > 10 ? `\n...ve ${offlineamaseste.size - 10} üye daha` : `\n\n`) : `Çevrim-dışı ama seste bulunan üye bulunamadı.\n\n`}
─────────────────────`

        // Orijinal kodda, metin 2048 karakteri aştığında mesajı bölüp gönderiyordu.
        load.edit({content: text}).catch(err => {
            // Hata yakalandığında (yani 2000 karakter sınırını aştığında)
            load.edit({content: `Belirtilen **${role.name}** rolünde 2000 karakteri aşan listeleme bulunduğundan aşağıya yeni mesaj şeklinde listeleyecektir. **(Metin içeriği 2000 karakter ile sınırlıdır)**`}).catch(e => {});
            
            // Discord.js v14'te splitMessage kullanılır.
            const arr = splitMessage(text, { maxLength: 1950, char: "\n" });

            arr.forEach(element => {
                message.channel.send({content: `${element}`}).catch(e => {});
            });
        })
    }
};