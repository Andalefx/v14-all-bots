const { 
    Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits 
} = require("discord.js");
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "cezaişlemleri",
    Komut: ["ceza-işlemleri","cezakontrol"],
    Kullanim: "cezaişlemleri <@andale/ID>", // Kullanim güncellendi
    Aciklama: "Belirlenen veya komutu kullanan kişi belirlediği yetkili sayısını ve en son belirlediği yetkili sayısını gösterir.",
    Kategori: "kurucu",
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
        if(!roller.kurucuRolleri.some(oku => message.member.roles.cache.has(oku)) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply(cevaplar.noyt).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        let uye = message.mentions.users.first() || message.guild.members.cache.get(args[0]) || message.member;
        
        if(!uye) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        
        uye = message.guild.members.cache.get(uye.id) // Ensure we have the GuildMember object
        
        let atılanCezalar = await Punitives.find({Staff: uye.id});
        
        if(!atılanCezalar || atılanCezalar.length === 0) return message.reply({content: `${cevaplar.prefix} ${uye} isimli üyenin daha önce yaptırım uyguladığı ceza-i işlem bulunamadı.`});
        
        // Ceza listesini en yeniden en eskiye sırala (Tek seferlik optimizasyon)
        let cezalar = atılanCezalar.sort((a, b) => b.Date - a.Date); 
        
        // V14 ButtonBuilder ve ActionRowBuilder kullanımı
        let Row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId("last25")
            .setLabel("Son 25 Yaptırımları")
            .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
            .setCustomId("bans")
            .setLabel("📛 Yasaklamalar")
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId("jails")
            .setLabel("🚫 Cezalandırmalar")
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId("mutes")
            .setLabel("🔇 Susturmalar")
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId("warns")
            .setLabel("🔔 Uyarılar")
            .setStyle(ButtonStyle.Primary),
        )

        // V14 EmbedBuilder kullanımı (genEmbed'in içini varsayarak)
        await message.channel.send({embeds: [new genEmbed().setDescription(`:x: Aşağı da **${uye.user.tag}** (${uye}) isimli üyesi(yetkilisi) tarafından yaptırım uygulanan cezalar listelenmektedir, düğmelerden tarafınca yaptırım uygulanan ceza türünü seçerek listeleyebilirsiniz.`)], components: [Row]}).then(async (msg) => {
            const filter = i => i.user.id == message.member.id;
            const collector = msg.createMessageComponentCollector({ filter, errors: ["time"], time: 60000 });
            
            collector.on("collect", async (i) => {
                let description = "";
                let title = "";
                let filteredCezalar = [];

                if(i.customId == "last25") {
                    title = `:tada: Aşağı da **${uye.user.tag}** (${uye}) üyesinin son 25 yaptırım uygulanan cezaları listelenmekte.`;
                    // Sıralı olduğu için sadece ilk 25'i alıyoruz.
                    filteredCezalar = cezalar.slice(0, 25).filter(x => x.No != "-99999");
                    description = filteredCezalar.map((value, index) => 
                        `\` #${value.No} (${value.Type}) \` ${message.guild.members.cache.get(value.Member) || `<@${value.Member}>`} üyesine \`${tarihsel(value.Date)}\` tarihinde ceza-i işlem uygulandı.`).join("\n") || "Bulunamadı.";
                } else if(i.customId == "bans") {
                    title = `:tada: Aşağı da **${uye.user.tag}** (${uye}) üyesinin son yasakladığı 15 üye listelenmektedir.`;
                    // Filtrele, sonra ilk 15'i al.
                    filteredCezalar = cezalar.filter(x => x.Type == "Yasaklama" || x.Type == "Kalkmaz Yasaklama" || x.Type == "Underworld" ).slice(0, 15);
                    description = filteredCezalar.map((value, index) => 
                        `\` #${value.No} \` ${message.guild.members.cache.get(value.Member) || `<@${value.Member}>`} üyesine **${value.Reason}** sebebiyle \`${tarihsel(value.Date)}\` tarihinde yasakladı.`).join("\n") || "Daha önce yaptırım uygulanan yasaklama bulunamadı.";
                } else if(i.customId == "jails") {
                    title = `:tada: Aşağı da **${uye.user.tag}** (${uye}) üyesinin son cezalandırdığı 15 üye listelenmektedir.`;
                    // Filtrele (tip ve cache'te olup olmadığı), sonra ilk 15'i al.
                    filteredCezalar = cezalar.filter(x => x.Type == "Cezalandırılma" && message.guild.members.cache.has(x.Member)).slice(0, 15);
                    description = filteredCezalar.map((value, index) => 
                        `\` #${value.No} \` ${message.guild.members.cache.get(value.Member)} üyesine **${value.Reason}** sebebiyle \`${tarihsel(value.Date)}\` tarihinde cezalandırıldı.`).join("\n") || "Daha önce yaptırım uygulanan cezalandırma bulunamadı.";
                } else if(i.customId == "mutes") {
                    title = `:tada: Aşağı da **${uye.user.tag}** (${uye}) üyesinin son susturduğu 15 üye listelenmektedir.`;
                    // Filtrele (tip ve cache'te olup olmadığı), sonra ilk 15'i al.
                    filteredCezalar = cezalar.filter(x => (x.Type == "Ses Susturulma" || x.Type == "Metin Susturulma") && message.guild.members.cache.has(x.Member)).slice(0, 15);
                    description = filteredCezalar.map((value, index) => 
                        `\` #${value.No} \` ${message.guild.members.cache.get(value.Member)} üyesine **${value.Reason}** sebebiyle \`${tarihsel(value.Date)}\` tarihinde ${value.Type == "Ses Susturulma" ? "ses kanallarında susturuldu" : "metin kanallarında susturuldu" }.`).join("\n") || "Daha önce yaptırım uygulanan susturulma bulunamadı.";
                } else if(i.customId == "warns") {
                    title = `:tada: Aşağı da **${uye.user.tag}** (${uye}) üyesinin son uyardığı 15 üye listelenmektedir.`;
                    // Filtrele (tip ve cache'te olup olmadığı), sonra ilk 15'i al.
                    filteredCezalar = cezalar.filter(x => x.Type == "Uyarılma" && message.guild.members.cache.has(x.Member)).slice(0, 15);
                    description = filteredCezalar.map((value, index) => 
                        `\` #${value.No} \` ${message.guild.members.cache.get(value.Member)} üyesine **${value.Reason}** sebebiyle \`${tarihsel(value.Date)}\` tarihinde uyarıldı.`).join("\n") || "Daha önce yaptırım uygulanan uyarma bulunamadı.";
                }

                await msg.edit({
                    embeds: [new genEmbed().setColor("White").setDescription(`${title}\n\n${description}`)]
                }).catch(err => {});
                
                await i.deferUpdate().catch(err => {});
            })
            
            collector.on('end', i => {
                 // Süre bitince mesajın butonlarını kaldır.
                 if(msg) msg.edit({ components: [] }).catch(err => {})
            })
        }).catch(err => {})
    }
};