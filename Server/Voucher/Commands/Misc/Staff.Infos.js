const { 
    Client, 
    Message, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionsBitField,
    codeBlock, 
    // splitMessage, // İstenildiği gibi kaldırıldı
} = require("discord.js");
const { genEmbed } = require("../../../../Global/İnit/Embed");

const roller = require("../../../../Global/Settings/Roles.json")
const cevaplar = require("../../../../Global/Settings/Reply")
const emojiler = require("../../../../Global/Settings/Emoji.json")
const ayarlar = require("../../../../Global/Settings/System.json")
const kanallar = require("../../../../Global/Settings/Channels.json")

const MAX_MESSAGE_LENGTH = 1900; // 2000 karakter sınırının biraz altı, kod bloğu için pay bırakıldı

module.exports = {
    Isim: "yetkilidurum",
    Komut: ["yetkili-ses","ses-yetkili","yetkili-durum","yetkilisay","yetkili-say","ysay"],
    Kullanim: "yetkilisay",
    Aciklama: "",
    Kategori: "kurucu",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
  onLoad: function (client) {

  },

   /**
   * @param {Client} client 
   * @param {Message} msg 
   * @param {Array<String>} args 
   */

  onRequest: async function (client, message, args) {
        // Yetki Kontrolü (V14: PermissionsBitField.Flags.Administrator)
        const requiredRoles = [
            ...(roller.üstYönetimRolleri || []),
            ...(roller.yönetimRolleri || []),
            ...(roller.kurucuRolleri || [])
        ];
        
        const hasPermission = message.member.permissions.has(PermissionsBitField.Flags.Administrator) || requiredRoles.some(oku => message.member.roles.cache.has(oku));
        
        if (!hasPermission) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        // V14: ActionRowBuilder ve ButtonBuilder kullanımı
        let Row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Aktif Seste Olmayanlar")
                .setStyle(ButtonStyle.Primary)
                .setCustomId("aktifseste"),
            new ButtonBuilder()
                .setLabel("Toplam Seste Olmayanlar")
                .setStyle(ButtonStyle.Primary)
                .setCustomId("toplam"),
            new ButtonBuilder()
                .setLabel(`Toplam Yetkili Bilgisi`)
                .setStyle(ButtonStyle.Success)
                .setCustomId("testt")
        );
        
        message.channel.send({
            embeds: [new genEmbed().setDescription(`Aşağıda bulunan düğmelerden yetkili aktifliğinin filtresini seçiniz.`)], 
            components: [Row]
        }).then(async (msg) => {
            var filter = (i) => i.user.id == message.member.id;
            
            let collector = msg.createMessageComponentCollector({ filter: filter, max: 1, time: 60000 });
            
            // Yetkili filtreleme temel fonksiyonu
            const baseStaffFilter = (member) => {
                return !member.user.bot && 
                       !member.permissions.has(PermissionsBitField.Flags.Administrator) && 
                       !member.roles.cache.some(r => roller.kurucuRolleri.includes(r.id));
            };

            // Tüm yetkili rollerini döngüye alıp tek bir listeye toplama fonksiyonu
            const fetchStaffList = (filterFunction) => {
                let staffList = [];
                const allStaffRoles = [
                    roller.altilkyetki,
                    ...(roller.altYönetimRolleri || []), 
                    ...(roller.yönetimRolleri || []), 
                    ...(roller.üstYönetimRolleri || []),
                    ...(roller.kurucuRolleri || []), 
                ].filter(id => id);
                
                // Rol bazlı döngü
                for (const roleId of allStaffRoles) {
                    const rol = message.guild.roles.cache.get(roleId);
                    if (rol) {
                        rol.members.filter(filterFunction).forEach(uye => {
                            if (!staffList.includes(uye.id)) {
                                staffList.push(uye.id);
                            }
                        });
                    }
                }
                return staffList;
            };

            // Uzun listeleri parçalara ayırma fonksiyonu (splitMessage yerine basit bir yöntem)
            const sendLongMessage = async (content, channel) => {
                if (content.length <= MAX_MESSAGE_LENGTH) {
                    await channel.send(codeBlock("js", content));
                    return;
                }

                let parts = [];
                let currentPart = "";
                const mentions = content.split(", ");
                
                for (const mention of mentions) {
                    if ((currentPart + mention + ", ").length > MAX_MESSAGE_LENGTH) {
                        parts.push(currentPart.trim().replace(/,$/, ''));
                        currentPart = mention + ", ";
                    } else {
                        currentPart += mention + ", ";
                    }
                }
                if (currentPart.length > 0) {
                    parts.push(currentPart.trim().replace(/,$/, ''));
                }

                for (const part of parts) {
                    if (part.length > 0) {
                        await channel.send(codeBlock("js", part));
                    }
                }
            };

            collector.on("collect", async (i) => {
                await i.deferUpdate(); 
                
                let Genel = [];
                
                if(i.customId == "testt") { // TOPLAM YETKİLİ BİLGİSİ
                    Genel = fetchStaffList(baseStaffFilter);
                    
                    let content = `${message.guild.emojiGöster(emojiler.Tag)} Aşağı da **${message.guild.name}** sunucusunun bulunan tüm yetkilileri listelenmektedir. (Yetkili sayısı: **${Genel ? Genel.length : 0}**)`
                    await message.channel.send({ content: content });

                    const memberListContent = Genel.length >= 1 ? Genel.map(x => `<@${x}>`).join(", ") : "Tebrikler! Tüm yetkilileriniz seste.";

                    await sendLongMessage(memberListContent, message.channel);
                }

                else if(i.customId == "aktifseste") { // AKTİF SESTE OLMAYANLAR
                    const activeNotVoiceFilter = (member) => {
                        return baseStaffFilter(member) && 
                               member.presence && 
                               member.presence?.status !== "offline" && 
                               !member.voice.channel;
                    };

                    Genel = fetchStaffList(activeNotVoiceFilter);

                    let content = `${message.guild.emojiGöster(emojiler.Tag)} Aşağı da aktif fakat seste olmayan **${message.guild.name}** sunucusunun tüm yetkilileri listelenmektedir. (Seste olmayan yetkili sayısı: **${Genel ? Genel.length : 0}**)`
                    await message.channel.send({ content: content });

                    const memberListContent = Genel.length >= 1 ? Genel.map(x => `<@${x}>`).join(", ") : "Tebrikler! Tüm yetkilileriniz seste.";
                    
                    await sendLongMessage(memberListContent, message.channel);
                }

                else if(i.customId == "toplam") { // TOPLAM SESTE OLMAYANLAR (Offline'lar dahil)
                    const totalNotVoiceFilter = (member) => {
                        return baseStaffFilter(member) && !member.voice.channel;
                    };

                    Genel = fetchStaffList(totalNotVoiceFilter);

                    let content = `${message.guild.emojiGöster(emojiler.Tag)} Aşağı da seste olmayan **${message.guild.name}** sunucusunun tüm yetkilileri listelenmektedir. (Seste olmayan yetkili sayısı: **${Genel ? Genel.length : 0}**)`
                    await message.channel.send({ content: content });
                    
                    const memberListContent = Genel.length >= 1 ? Genel.map(x => `<@${x}>`).join(", ") : "Tebrikler! Tüm yetkilileriniz seste.";

                    await sendLongMessage(memberListContent, message.channel);
                }
            });
            
            collector.on("end", () => {
                msg.delete().catch(err => {});
            });
        });
    }
};