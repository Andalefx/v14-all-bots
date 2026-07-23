const { Client, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonStyle, PermissionsBitField, ComponentType } = require("discord.js");
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");
// Varsayım: 
const ayarlar = require("../../../../Global/Settings/System.json")
const roller = require("../../../../Global/Settings/Roles.json")
const cevaplar = require("../../../../Global/Settings/Reply")
const emojiler = require("../../../../Global/Settings/Emoji.json")
// 'ayarlar', 'roller', 'cevaplar', 'emojiler' ve 'message.guild.kanalBul', 'message.guild.emojiGöster' değişkenlerinin erişilebilir olduğu varsayılmıştır.

module.exports = {
    Isim: "rol",
    Komut: ["rol"], 
    Kullanim: "rol <@andale/ID>",
    Aciklama: "",
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
        // Yetki Kontrolü
        const requiredRoles = [
            ...(ayarlar.staff || []),
            ...(roller.üstYönetimRolleri || []),
            ...(roller.yönetimRolleri || []),
            ...(roller.kurucuRolleri || [])
        ];
        
        const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || requiredRoles.some(oku => message.member.roles.cache.has(oku));
        
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // Rol Paneli Rolleri Kontrolü
        if(!roller.rolPanelRolleri || roller.rolPanelRolleri.length === 0) return message.reply(cevaplar.notSetup).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let uye = message.mentions.members.first() || message.guild.members.cache.get(args[0])
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        if(uye.id == message.author.id) return message.reply(cevaplar.kendi).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let rolOptions = [];
        
        // Rol Listesi Oluşturma ve Yetki Kontrolü
        const filterRoles = message.guild.roles.cache.sort((a, b) => b.position - a.position).filter(rol => 
            roller.rolPanelRolleri.some(x => rol.id === x) && 
            message.member.roles.highest.comparePositionTo(rol) > 0 // Kendi rolünden yüksek veya eşit olmamalı.
        );
        
        filterRoles.forEach(x => {
            rolOptions.push({ 
                label: x.name, 
                description: "ID: "+ x.id, 
                value: x.id
            });
        });

        if (rolOptions.length === 0) {
            return message.reply({ content: `Seçilebilir roller listesinde, sizin yetkinizin altında olan herhangi bir rol bulunamadı.`, ephemeral: true }).then(s => setTimeout(() => s.delete().catch(e => {}), 7500));
        }

        // V14 StringSelectMenuBuilder
        let rolcükler = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`rolveral`)
                .setPlaceholder('Rol vermek/almak için rol seçiniz!')
                .addOptions(rolOptions.slice(0, 25)) // Max 25 seçenek
        );
        
        // V14 ButtonBuilder
        const isYetkiVerDisabled = !(roller.kurucuRolleri?.some(oku => message.member.roles.cache.has(oku)) || message.member.permissions.has(PermissionsBitField.Flags.Administrator) || roller.yükselticiRoller?.some(x => message.member.roles.cache.has(x)) || roller.limitliYükselticiRolleri?.some(x => message.member.roles.cache.has(x)));

        let Info = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("rollog")
                .setLabel("Rol Geçmişi Görüntüle")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("YetkiVer")
                .setLabel("Yetki Güncelleme")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(isYetkiVerDisabled)
        );
        
        // V14 EmbedBuilder
        let msg = await message.reply({
            embeds: [new genEmbed()
                .setColor("White")
                .setDescription(`${uye} isimli üyeye verilmesini istediğiniz rolü aşağıda ki menüden seçiniz.`)
                .setFooter({text: "Bu komut yetki vermek/almak için değildir. Sadece yetki rolleri dışında rol vermek/almak için kullanılır."})
            ], 
            components: [rolcükler, Info]
        });

        const filter = i => i.user.id == message.member.id;
        const collector = msg.createMessageComponentCollector({ 
            filter, 
            componentType: ComponentType.Any, // Hem SelectMenu hem de Buton için
            time: 30000 
        });
    
        collector.on('collect', async i => { 
            if(i.customId === "rollog") {
                // Rollog komutunu bul ve çalıştır (Komut dosyanızda 'onRequest' veya 'execute' olmalı)
                let kom = client.commands.find(x => x.Isim === "rollog");
                if (kom) kom.onRequest ? kom.onRequest(client, message, args) : kom.execute(message, args, client);

                msg.delete().catch(err => {});
                return i.reply({content: `Başarıyla "Rol Geçmişi" komutu işlendi. ${message.guild.emojiGöster(emojiler.Onay) || '✅'}`, ephemeral: true });
            }

            if(i.customId === "YetkiVer") {
                // Yetki komutunu bul ve çalıştır
                let kom = client.commands.find(x => x.Isim === "yetki");
                if (kom) kom.onRequest ? kom.onRequest(client, message, args) : kom.execute(message, args, client);
                
                msg.delete().catch(err => {});
                return i.reply({content: `Başarıyla "Yetki Güncelleme" komutu işlendi. ${message.guild.emojiGöster(emojiler.Onay) || '✅'}`, ephemeral: true });
            }

            if(i.customId === "rolveral") {
                await i.deferUpdate(); // İşlemi yapmadan önce bekleme durumuna geç.

                const selectedRoleId = i.values[0];
                const selectedRole = message.guild.roles.cache.get(selectedRoleId);

                // Yetki seviyesi tekrar kontrolü (Select menü ile oynamaya karşı)
                if (message.member.roles.highest.comparePositionTo(selectedRole) <= 0) {
                    message.react(message.guild.emojiGöster(emojiler.Iptal) || '❌').catch(err => {});
                    msg.delete().catch(err => {});
                    return i.followUp({content: `${message.guild.emojiGöster(emojiler.Iptal) || '❌'} ${selectedRole} rolü yetkinin üstünde olduğu için işlem yapılamadı.`, ephemeral: true });
                }

                if(uye.roles.cache.has(selectedRoleId)) {
                    // Rol Kaldırma
                    await Users.updateOne({ _id: uye.id }, { $push: { "Roles": { rol: selectedRoleId, mod: message.author.id, tarih: Date.now(), state: "Kaldırma" } } }, { upsert: true });
                    
                    const logEmbed = new genEmbed().setDescription(`${uye} isimli üyeden <t:${String(Date.now()).slice(0, 10)}:R> ${message.author} tarafından ${selectedRole} adlı rol geri alındı.`);
                    message.guild.kanalBul("rol-al-log")?.send({embeds: [logEmbed]}).catch(e => {});

                    await uye.roles.remove(selectedRoleId).catch(e => {});
                    i.followUp({content: `${message.guild.emojiGöster(emojiler.Onay) || '✅'} ${uye}, isimli üyenin ${selectedRole} rolü üzerinden kaldırıldı!`, ephemeral: true });
                
                } else {
                    // Rol Ekleme
                    await Users.updateOne({ _id: uye.id }, { $push: { "Roles": { rol: selectedRoleId, mod: message.author.id, tarih: Date.now(), state: "Ekleme" } } }, { upsert: true });
                    
                    const logEmbed = new genEmbed().setDescription(`${uye} isimli üyeye <t:${String(Date.now()).slice(0, 10)}:R> ${message.author} tarafından ${selectedRole} adlı rol verildi.`);
                    message.guild.kanalBul("rol-ver-log")?.send({embeds: [logEmbed]}).catch(e => {});
                    
                    await uye.roles.add(selectedRoleId).catch(e => {});
                    i.followUp({content: `${message.guild.emojiGöster(emojiler.Onay) || '✅'} ${uye}, isimli üyeye ${selectedRole} rolü üzerine verildi!`, ephemeral: true });
                }
                
                message.react(message.guild.emojiGöster(emojiler.Onay) || '✅').catch(err => {});
                msg.delete().catch(err => {});
            }
        });

        collector.on("end", () => {
            msg.delete().catch(err => {})
        });
    }
};