const { Client, Message, Collection, PermissionFlagsBits } = require("discord.js"); // Daha temiz v14 import yapısı
const Roles = require('../../../../Global/Databases/Guild.Protection.Roles.Backup');
const util = require("util")
const { genEmbed } = require('../../../../Global/İnit/Embed')
let kapatılanPermler = new Collection()

module.exports = {
    Isim: "debug",
    Komut: ["proc","yt"],
    Kullanim: "",
    Aciklama: "",
    Kategori: "-",
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
    let type = args[0]
    if(!type) return message.react(message.guild.emojiGöster(emojiler.Iptal) ? message.guild.emojiGöster(emojiler.Iptal).id : undefined)
    
    switch (type) {
        case "kapat": {
            // V14'te PermissionFlagsBits kullanımı daha sağlamdır. Orijinaldeki izinler.
            const perms = [
                PermissionFlagsBits.Administrator, // ADMINISTRATOR
                PermissionFlagsBits.ManageRoles, // MANAGE_ROLES
                PermissionFlagsBits.ManageChannels, // MANAGE_CHANNELS
                PermissionFlagsBits.ManageGuild, // MANAGE_GUILD
                PermissionFlagsBits.BanMembers, // BAN_MEMBERS
                PermissionFlagsBits.KickMembers, // KICK_MEMBERS
                PermissionFlagsBits.ManageNicknames, // MANAGE_NICKNAMES
                PermissionFlagsBits.ManageEmojisAndStickers, // MANAGE_EMOJIS_AND_STICKERS
                PermissionFlagsBits.ManageWebhooks // MANAGE_WEBHOOKS
            ];
            
            // Rol filtreleme (editable rol olup yetki bulunduranları bulma)
            let roller = message.guild.roles.cache.filter(rol => rol.editable).filter(rol => perms.some(yetki => rol.permissions.has(yetki)))
            
            message.channel.send({embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay)} ${roller.map(x => x).join(", ")} rolün(lerin), koruması başarıyla <t:${String(Date.now()).slice(0, 10)}:R> açıldı ve izinleri **kapatıldı**.`)]}).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined)
                setTimeout(() => {
                    x.delete()
                }, 8500);
            })
            
            roller.forEach(async (rol) => {
                // Mevcut izinleri BigInt olarak kaydediyoruz.
                await Roles.updateOne({Role: rol.id}, {$set: {"guildID": message.guild.id, Reason: "Koruma Komutu Çalıştırıldı!", "Permissions": rol.permissions.bitfield }}, {upsert: true})
                
                await kapatılanPermler.set(rol.id, rol.permissions.bitfield)
                // İzinleri sıfırlama (0n BigInt'tir ve v14'te de geçerlidir)
                await rol.setPermissions(0n).catch(err => {}) 
            })
            return;
        }
            
        case "aç": {
            let Roller = await Roles.find({})
            Roller.filter(x => message.guild.roles.cache.get(x.Role)).forEach(async (data) => {
                let rolgetir = message.guild.roles.cache.get(data.Role)
                // Kayıtlı izinleri tekrar atama (Permissions değeri zaten BigInt olarak saklanıyor)
                if(rolgetir) rolgetir.setPermissions(data.Permissions).catch(err => {}); 
            })
            await Roles.deleteMany({guildID: message.guild.id})
            return message.channel.send({embeds: [new genEmbed().setDescription(`${message.guild.emojiGöster(emojiler.Onay)} ${Roller.map((x, key) => message.guild.roles.cache.get(x.Role)).join(", ")} rolün(lerin), koruması başarıyla <t:${String(Date.now()).slice(0, 10)}:R> **kapatıldı** ve izinleri tekrardan açıldı.`)]}).then(x => {
                message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined)
                setTimeout(() => {
                    x.delete()
                }, 8500);
            })
        }
    }
  
  }
};