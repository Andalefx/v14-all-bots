const { Client, Message, EmbedBuilder, ButtonBuilder, ActionRowBuilder, AttachmentBuilder, ButtonStyle, ComponentType } = require("discord.js");
const Canvas = require('canvas')
Canvas.registerFont(`../../Assets/theboldfont.ttf`, { family: "Bold" });
Canvas.registerFont(`../../Assets/SketchMatch.ttf`, { family: "SketchMatch" });
Canvas.registerFont(`../../Assets/LuckiestGuy-Regular.ttf`, { family: "luckiest guy" });
Canvas.registerFont(`../../Assets/KeepCalm-Medium.ttf`, { family: "KeepCalm" });
const Users = require('../../../../Global/Databases/Client.Users');
const { genEmbed } = require("../../../../Global/İnit/Embed");

module.exports = {
    Isim: "coin",
    Komut: ["coinim","c"],
    Kullanim: "coin @andale/ID",
    Aciklama: "Bir üyenin coin bilgisini görüntüler.",
    Kategori: "eco",
    Extend: true,
    
   /**
   * @param {Client} client 
   */
    onLoad: function (client) {
        client.on("ready", async () => {
            setInterval(async () => {
                ilkYazan(client, 2500)
                setTimeout(() => {
                    matematikOyunu(client, 5000)
                    setTimeout(() => {
                        doğruKasaBul(client, 5000)
                        setTimeout(() => {
                            tahminEt(client, 5000)
                        }, 1000*60*3)
                    }, 1000*60*5)
                }, 1000*60*2)
            }, 1000*60*18)
            matematikOyunu(client, 5000)
        } )
    },

   /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   */
    onRequest: async function (client, message, args) {
        if(ayarlar.staff.includes(message.member.id) && args[0] == "forcedelete") {
            let uye = args[1]
            if(!uye) return;
            await Users.deleteOne({_id: uye})
            return message.react(message.guild.emojiGöster(emojiler.Onay) ? message.guild.emojiGöster(emojiler.Onay).id : undefined)
        }
        let embed = new genEmbed()
        let kullanici = message.mentions.users.first() || client.guilds.cache.get(sistem.SERVER.ID).members.cache.get(args[0]) || message.member;
        if(!kullanici) return message.reply(cevaplar.üye).then(s => setTimeout(() => s.delete().catch(err => {}), 5000));
        let uye = client.guilds.cache.get(sistem.SERVER.ID).members.cache.get(kullanici.id)
        let para = await client.Economy.viewBalance(uye.id, 1)
        let altın = await client.Economy.viewBalance(uye.id, 0)
        
        // Canvas
        let canvas = Canvas.createCanvas(1080, 400),
        ctx = canvas.getContext("2d");
        
        ctx.beginPath();
        ctx.moveTo(0 + Number(30), 0);
        ctx.lineTo(0 + 1080 - Number(30), 0);
        ctx.quadraticCurveTo(0 + 1080, 0, 0 + 1080, 0 + Number(30));
        ctx.lineTo(0 + 1080, 0 + 400 - Number(30));
        ctx.quadraticCurveTo(
        0 + 1080,
        0 + 400,
        0 + 1080 - Number(30),
        0 + 400
        );
        ctx.lineTo(0 + Number(30), 0 + 400);
        ctx.quadraticCurveTo(0, 0 + 400, 0, 0 + 400 - Number(30));
        ctx.lineTo(0, 0 + Number(30));
        ctx.quadraticCurveTo(0, 0, 0 + Number(30), 0);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 1080, 400);
        let background = await Canvas.loadImage("../../Assets/banner.png");
        ctx.drawImage(background, 0, 0, 1080, 400);
        ctx.restore();
        ctx.beginPath();
        ctx.globalAlpha = 0.5
        ctx.fillStyle = "#000000";
        
        ctx.moveTo(50,  22);
        ctx.lineTo(canvas.width - 50,  22);
        ctx.quadraticCurveTo(canvas.width - 50,  22, canvas.width -  22, 50);
        ctx.lineTo(canvas.width -  22, canvas.height - 50);
        ctx.quadraticCurveTo(canvas.width - 25, canvas.height -  22, canvas.width - 50, canvas.height -  22);
        ctx.lineTo(50, canvas.height - 22);
        ctx.quadraticCurveTo(25, canvas.height -  22,  22, canvas.height - 50);
        ctx.lineTo( 22, 50);
        ctx.quadraticCurveTo( 22,  22, 50,  22);
        ctx.fill();
        ctx.globalAlpha = 1
        ctx.closePath();
        ctx.stroke();
        let gold = await Canvas.loadImage("https://cdn.discordapp.com/emojis/998212095306903653.png?size=96&quality=lossless")
        let coin = await Canvas.loadImage("https://cdn.discordapp.com/emojis/998211961462464532.png?size=96&quality=lossless")
        ctx.drawImage(gold, canvas.width - 750, 260, 85, 75);
        ctx.drawImage(coin, canvas.width - 740, 200, 75, 65);
        
        // Draw title
        ctx.font = "30px Bold";
        ctx.strokeStyle = "#e7d02e";
        ctx.lineWidth = 3;
        ctx.strokeText(`${altın} ALTIN`, canvas.width - 650, 315);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${altın} ALTIN`, canvas.width - 650, 315);
            
        ctx.fillStyle = "#000000"; 
        ctx.lineWidth = 3;
        ctx.fillStyle = "#e7d02e";
        ctx.font = applyText(canvas, uye.user.tag + " UYESININ HESABI", 40, 600, "Bold");
        ctx.fillText(uye.user.tag + " UYESININ HESABI", canvas.width - 740, canvas.height - 230);

        // Draw title
        ctx.font = "30px Bold";
        ctx.strokeStyle = "#e7d02e";
        ctx.lineWidth = 3;
        ctx.strokeText(para.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") + " "+ ayarlar.serverName + " PARASI", canvas.width - 650, 240);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(para.toFixed(0).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") + " "+ ayarlar.serverName + " PARASI", canvas.width - 650, 240);

        // Draw title
        ctx.font = "70px Bold";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.strokeText(ayarlar.serverName, canvas.width - 650, canvas.height - 300);
        ctx.fillStyle = "#e7d02e";
        ctx.fillText(ayarlar.serverName, canvas.width - 650, canvas.height - 300);

        ctx.beginPath();
        ctx.lineWidth = 10;
        ctx.strokeStyle = "#e7d02e";
        ctx.arc(193, 200, 130, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.closePath();
        ctx.clip();
        const avatar = await Canvas.loadImage(uye.user.displayAvatarURL({ extension: "png", forceStatic: true, size: 4096 }));
        ctx.drawImage(avatar, 58, 70, 270, 270);
            
        let ekonomiPanel = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setLabel("Mağaza")
            .setCustomId("magaza")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("1517138464066506994"),
            new ButtonBuilder()
            .setLabel("Satın Aldıklarım")
            .setCustomId("harcamalar")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("1517138341739499680"),
            new ButtonBuilder()
            .setLabel("Doviz İşlemleri")
            .setCustomId("dovizislem")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("1517138311582322759"),
            new ButtonBuilder()
            .setLabel("Transferlerim")
            .setCustomId("işlemler")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("1517138431245942864"),
            new ButtonBuilder()
            .setLabel("Günlük Al")
            .setCustomId("günlük")
            .setStyle(ButtonStyle.Success)
            .setEmoji("1517138387830702173"),
        )
        let Hesap = await Users.findById({_id: uye.id}) 
        if(Hesap && Hesap.Daily) {
            let yeniGün = Hesap.Daily + (1*24*60*60*1000);
            if (Date.now() < yeniGün) {
                ekonomiPanel.components[4].setLabel(`${kalanzaman(yeniGün)}`)
                ekonomiPanel.components[4].setStyle(ButtonStyle.Secondary)
                ekonomiPanel.components[4].setDisabled(true)
            }
        }
        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'acar_economy.png' });

        message.reply({
            content: `💳 | ${uye.id == message.member.id ? `${kullanici}` : `${kullanici} üyesinin`} **${ayarlar.serverName} Parası** ve **Altın** ${uye.id == message.member.id ? "hesabın" : "hesabı"} aşağıda görüntülenmektedir.`, 
            files: [attachment], 
            components: message.member.id == uye.id ? [ekonomiPanel] : []
        }).then(async (x) => {
            var filter = (i) => i.user.id == message.member.id
            let collector = await x.createMessageComponentCollector({filter: filter, max: 1, time: 60000})
            collector.on('collect', async (i) => {
                collector.stop()
                if(i.customId == "magaza") {
                    let kom = client.commands.find(x => x.Isim == "mağaza")
                    if(kom) kom.onRequest(client, message, args)
                    x.delete().catch(err => {})
                    i.deferUpdate().catch(err => {})
                }
                if(i.customId == "harcamalar") {
                    let kom = client.commands.find(x => x.Isim == "envanter")
                    if(kom) kom.onRequest(client, message, args)
                    x.delete().catch(err => {})
                    i.deferUpdate().catch(err => {})
                }
                if(i.customId == "işlemler") {
                    let kom = client.commands.find(x => x.Isim == "transferler")
                    if(kom) kom.onRequest(client, message, args)
                    x.delete().catch(err => {})
                    i.deferUpdate().catch(err => {})
                }
                if(i.customId == "dovizislem") {
                    let kom = client.commands.find(x => x.Isim == "bozdur")
                    if(kom) kom.onRequest(client, message, args)
                    x.delete().catch(err => {})
                    i.deferUpdate().catch(err => {})
                }
                if(i.customId == "günlük") {
                    let kom = client.commands.find(x => x.Isim == "günlük")
                    if(kom) kom.onRequest(client, message, args)
                    x.delete().catch(err => {})
                    i.deferUpdate().catch(err => {})
                }
            })
            collector.on('end', async (i) => x.delete().catch(err => {}))
        })
    }
};

async function ilkYazan(client, odül = Number(Math.floor(Math.random() * 10000) + 200)) {
    let kanal = client.channels.cache.get(global.kanallar.chatKanalı)
    if(!kanal) return;
    let kod = kodOluştur(10)
    let canvas = Canvas.createCanvas(1080, 400),
    ctx = canvas.getContext("2d");

    // Canvas
    ctx.beginPath();
    ctx.moveTo(0 + Number(30), 0);
    ctx.lineTo(0 + 1080 - Number(30), 0);
    ctx.quadraticCurveTo(0 + 1080, 0, 0 + 1080, 0 + Number(30));
    ctx.lineTo(0 + 1080, 0 + 400 - Number(30));
    ctx.quadraticCurveTo(
    0 + 1080,
    0 + 400,
    0 + 1080 - Number(30),
    0 + 400
    );
    ctx.lineTo(0 + Number(30), 0 + 400);
    ctx.quadraticCurveTo(0, 0 + 400, 0, 0 + 400 - Number(30));
    ctx.lineTo(0, 0 + Number(30));
    ctx.quadraticCurveTo(0, 0, 0 + Number(30), 0);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1080, 400);
    let background = await Canvas.loadImage("../../Assets/banner.png");
    ctx.drawImage(background, 0, 0, 1080, 400);
    ctx.restore();
    ctx.closePath();

    ctx.beginPath();
    ctx.globalAlpha = 0.5
    ctx.fillStyle = "#000000";

    ctx.moveTo(50,  22);
    ctx.lineTo(canvas.width - 50,  22);
    ctx.quadraticCurveTo(canvas.width - 50,  22, canvas.width -  22, 50);
    ctx.lineTo(canvas.width -  22, canvas.height - 50);
    ctx.quadraticCurveTo(canvas.width - 25, canvas.height -  22, canvas.width - 50, canvas.height -  22);
    ctx.lineTo(50, canvas.height - 22);
    ctx.quadraticCurveTo(25, canvas.height -  22,  22, canvas.height - 50);
    ctx.lineTo( 22, 50);
    ctx.quadraticCurveTo( 22,  22, 50,  22);
    ctx.fill();
    ctx.closePath();

    ctx.globalAlpha = 1
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = applyText(canvas, "TAHMİN ET!", 75, 500, "Bold");
    // border text
    ctx.strokeStyle = "#ffffff";
    ctx.fillText("ILK YAZAN SEN OL!", 210, 125);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = applyText(canvas, `${odül} ${global.ayarlar.serverName.toUpperCase()} PARASI KAZANACAKSIN!`, 45, 690, "Bold");
    ctx.fillText(`SEN YAZARSAN ${odül} ${global.ayarlar.serverName.toUpperCase()} PARASI KAZANACAKSIN!`,70, 130 + 85 );

    ctx.textAlign = "center";
    let renk = ["#2cc09a","#fff3f3","#868dfe","#b10053","#c7c7ea"]
    ctx.fillStyle = renk[Math.floor(Math.random()*renk.length)]
    ctx.strokeRect(0, 0, canvas.width, canvas.height)
    ctx.font = applyText(canvas, kod, 100, 400, "luckiest guy");
    ctx.fillText(kod, 525, 350 );

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'acar_economy.png' });
    let msg = await kanal.send({content: "**Hızlı Ol ve Kazan**\nAşağıda rastgele verilmiş bir kodu doğru yaz ve kazan! Bunun için 20 Saniyeniz var!", files: [attachment], components: []})

    const filter = m => m.content.includes(kod);
    const collector = kanal.createMessageCollector({ filter, max: 1, time: 20000 });
    
    collector.on('collect',async (m) => {
        m.react(m.guild.emojiGöster(emojiler.Onay))
        let uye = m.guild.members.cache.get(m.member.id)
        kanal.send({content: `**Tebrikler!** Hızlı Ol Ve Kazan etkinliğini ${uye} kazandı! ${m.guild.emojiGöster("a_rich")}`}).then(x => setTimeout(() => {
            x.delete()
        }, 10000))
        msg.delete().catch(err =>{})
        if(uye) return await client.Economy.updateBalance(uye.id, Number(odül), "add", 1)
    });
    
    collector.on('end', collected => {
       msg.delete().catch(err => {})
    });

    function applyText(canvas, text, defaultFontSize, width, font){
        const ctx = canvas.getContext("2d");
        do {
            ctx.font = `${(defaultFontSize -= 1)}px ${font}`;
        } while (ctx.measureText(text).width > width);
        return ctx.font;
    }
    function kodOluştur(length) {
        var randomChars = '123456789';
        var result = '';
        for ( var i = 0; i < length; i++ ) {
            result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
        }
        return result;
    }
}

async function tahminEt(client, odül = Number(Math.floor(Math.random() * 4000) + 1000)) {
    let kanal = client.channels.cache.get(global.kanallar.chatKanalı)
    if(!kanal) return;
    let cevap = Math.floor(Math.random() * 5) + 1
    let basanlar = []
    let canvas = Canvas.createCanvas(1080, 400),
    ctx = canvas.getContext("2d");

    // Canvas
    ctx.beginPath();
    ctx.moveTo(0 + Number(30), 0);
    ctx.lineTo(0 + 1080 - Number(30), 0);
    ctx.quadraticCurveTo(0 + 1080, 0, 0 + 1080, 0 + Number(30));
    ctx.lineTo(0 + 1080, 0 + 400 - Number(30));
    ctx.quadraticCurveTo(
    0 + 1080,
    0 + 400,
    0 + 1080 - Number(30),
    0 + 400
    );
    ctx.lineTo(0 + Number(30), 0 + 400);
    ctx.quadraticCurveTo(0, 0 + 400, 0, 0 + 400 - Number(30));
    ctx.lineTo(0, 0 + Number(30));
    ctx.quadraticCurveTo(0, 0, 0 + Number(30), 0);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1080, 400);
    let background = await Canvas.loadImage("../../Assets/banner.png");
    ctx.drawImage(background, 0, 0, 1080, 400);
    ctx.restore();

    ctx.beginPath();
    ctx.globalAlpha = 0.5
    ctx.fillStyle = "#000000";

    ctx.moveTo(50,  22);
    ctx.lineTo(canvas.width - 50,  22);
    ctx.quadraticCurveTo(canvas.width - 50,  22, canvas.width -  22, 50);
    ctx.lineTo(canvas.width -  22, canvas.height - 50);
    ctx.quadraticCurveTo(canvas.width - 25, canvas.height -  22, canvas.width - 50, canvas.height -  22);
    ctx.lineTo(50, canvas.height - 22);
    ctx.quadraticCurveTo(25, canvas.height -  22,  22, canvas.height - 50);
    ctx.lineTo( 22, 50);
    ctx.quadraticCurveTo( 22,  22, 50,  22);
    ctx.fill();
    ctx.closePath();
    
    ctx.globalAlpha = 1
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = applyText(canvas, "TAHMİN ET!", 75, 500, "Bold");
    ctx.fillText("TAHMIN ET VE KAZAN!", 85 + 100, 125);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = applyText(canvas, `${odül} ${global.ayarlar.serverName.toUpperCase()} PARASI KAZANACAKSIN!`, 45, 690, "Bold");
    ctx.fillText(`DOGRU CEVAPLARSAN`,350, 130 + 85 );

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = applyText(canvas, `${odül} ${global.ayarlar.serverName.toUpperCase()} PARASI KAZANACAKSIN!`, 45, 690, "Bold");
    ctx.fillText(`${odül} ${global.ayarlar.serverName.toUpperCase()} PARASI KAZANACAKSIN!`,210, 180 + 85 );

    ctx.font = applyText(canvas, "SADECE BIR KEZ HAKKIN VAR!", 200, 710, "Bold");
    ctx.fillText("SADECE BIR KEZ HAKKIN VAR!", 190, 310 + 40 );

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'acar_economy.png' });

    let rakamSatirBir = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('1').setLabel('1').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('2').setLabel('2').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('3').setLabel('3').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('4').setLabel('4').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('5').setLabel('5').setStyle(ButtonStyle.Secondary)
    )
    let msg = await kanal.send({content: "**Hızlı Ol ve Kazan**\nAşağıda 1 ile 5 arası verilen rakamlardan doğru rakamı tahmin edin. Bunun için 30 Saniyeniz var!", files: [attachment] ,components: [rakamSatirBir]})

    const filter = i => i

    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    collector.on('collect', async i => {
        if (i.customId === String(cevap)) {
            if(basanlar.includes(i.user.id)) return await i.reply({content: `${i.guild.emojiGöster(emojiler.Iptal)} Cevap hakkınızı doldurmuşsunuz. Üzgünüm!`, ephemeral: true});
            await i.reply({ content: `> **Tebrikler!** Etkinliği kazandığınız için hesabınıza +**${odül}** ${global.ayarlar.serverName} Parası aktarıldı.`, ephemeral: true})
            let uye = i.guild.members.cache.get(i.user.id)
            kanal.send({content: `**Tebrikler!** Hızlı Ol Ve Kazan etkinliğini ${uye} kazandı! ${i.guild.emojiGöster("a_rich")}`}).then(x => setTimeout(() => {
                x.delete()
            }, 10000))
            msg.delete().catch(err =>{})
            basanlar = []
            if(uye) return await client.Economy.updateBalance(uye.id, Number(odül), "add", 1)
        }
        if(i.customId != String(cevap)) {
            if(basanlar.includes(i.user.id)) return await i.reply({content: `${i.guild.emojiGöster(emojiler.Iptal)} Cevap hakkınızı doldurmuşsunuz. Üzgünüm!`, ephemeral: true});
            basanlar.push(i.user.id)
            await i.reply({ content: `${i.guild.emojiGöster(emojiler.Iptal)} **Hay Aksi!** Yanlış, artık birdahaki sorulara. Cevap hakkınız doldu!`, ephemeral: true})
        }
    });

    collector.on('end', collected => msg.delete().catch(err => {}));

    function applyText(canvas, text, defaultFontSize, width, font){
        const ctx = canvas.getContext("2d");
        do {
            ctx.font = `${(defaultFontSize -= 1)}px ${font}`;
        } while (ctx.measureText(text).width > width);
        return ctx.font;
    }
}

async function matematikOyunu(client, odül = Number(Math.floor(Math.random() * 2000) + 500)) {
    let kanal = client.channels.cache.get(global.kanallar.chatKanalı)
    if(!kanal) return;
    var a = Math.floor(Math.random() * 400) + 200
    var b = Math.floor(Math.random() * 250)
    let cevap = '';
    let soru = '';
    let randd = ["toplama", "çıkartma", "çarpma", "bölme"]
    let sonuclandır = randd[Math.floor(Math.random() * 3)]
    if(sonuclandır == "toplama") cevap = a + b, soru = `${a} + ${b}`
    if(sonuclandır == "çıkartma") cevap = a - b, soru = `${a} - ${b}`
    if(sonuclandır == "çarpma") cevap = a * b, soru = `${a} * ${b}`
    if(sonuclandır == "bölme") cevap = a / b, soru = `${a} / ${b}`

    let basanlar = []
    let canvas = Canvas.createCanvas(1080, 400),
    ctx = canvas.getContext("2d");

    // Canvas
    ctx.beginPath();
    ctx.moveTo(0 + Number(30), 0);
    ctx.lineTo(0 + 1080 - Number(30), 0);
    ctx.quadraticCurveTo(0 + 1080, 0, 0 + 1080, 0 + Number(30));
    ctx.lineTo(0 + 1080, 0 + 400 - Number(30));
    ctx.quadraticCurveTo(
    0 + 1080,
    0 + 400,
    0 + 1080 - Number(30),
    0 + 400
    );
    ctx.lineTo(0 + Number(30), 0 + 400);
    ctx.quadraticCurveTo(0, 0 + 400, 0, 0 + 400 - Number(30));
    ctx.lineTo(0, 0 + Number(30));
    ctx.quadraticCurveTo(0, 0, 0 + Number(30), 0);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1080, 400);
    let background = await Canvas.loadImage("../../Assets/banner.png");
    ctx.drawImage(background, 0, 0, 1080, 400);
    ctx.restore();
    ctx.beginPath();
    ctx.globalAlpha = 0.5
    ctx.fillStyle = "#000000";
    ctx.moveTo(50,  22);
    ctx.lineTo(canvas.width - 50,  22);
    ctx.quadraticCurveTo(canvas.width - 50,  22, canvas.width -  22, 50);
    ctx.lineTo(canvas.width -  22, canvas.height - 50);
    ctx.quadraticCurveTo(canvas.width - 25, canvas.height -  22, canvas.width - 50, canvas.height -  22);
    ctx.lineTo(50, canvas.height - 22);
    ctx.quadraticCurveTo(25, canvas.height -  22,  22, canvas.height - 50);
    ctx.lineTo( 22, 50);
    ctx.quadraticCurveTo( 22,  22, 50,  22);
    ctx.fill();
    ctx.closePath();

    ctx.globalAlpha = 1
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = applyText(canvas, "TAHMİN ET!", 75, 500, "Bold");
    ctx.fillText("BOTMATIK!", 375, 125);

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff3f3";
    ctx.font = applyText(canvas, `${odül} ${global.ayarlar.serverName.toUpperCase()} PARASI KAZANACAKSIN!`, 100, 890, "luckiest guy");
    ctx.fillText(`${soru}`,550, 120 + 85);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = applyText(canvas, `${odül} ${global.ayarlar.serverName.toUpperCase()} PARASI KAZANACAKSIN!`, 45, 690, "Bold");
    ctx.fillText(`DOGRU CEVAPLARSAN`,360, 180 + 85 );

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = applyText(canvas, `${odül} ${global.ayarlar.serverName.toUpperCase()} PARASI KAZANACAKSIN!`, 45, 690, "Bold");
    ctx.fillText(`${odül} ${global.ayarlar.serverName.toUpperCase()} PARASI KAZANACAKSIN!`,210, 260 + 40 );

    ctx.font = applyText(canvas, "SADECE BIR KEZ HAKKIN VAR!", 45, 690, "Bold");
    ctx.fillText("SADECE BIR KEZ HAKKIN VAR!", 260, 310 + 40 );

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'acar_economy.png' });
    let buttons = [
        new ButtonBuilder().setCustomId('qwe').setLabel(`${Math.floor(Math.random() * 550)}`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('qwe1').setLabel(`${Math.floor(Math.random() * 942) + 1}`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('qwe2').setLabel(`${Math.floor(Math.random() * 250)}`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`${cevap}`).setLabel(`${cevap}`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('qwe6').setLabel(`${Math.floor(Math.random() * 2000)}`).setStyle(ButtonStyle.Success)
    ]
    let buttonları = buttons.shuffle()
    let rakamSatirBir = new ActionRowBuilder().addComponents(buttonları)
    let msg = await kanal.send({content: "**Cevabı Bul!**\nAşağıda sorunun cevabını doğru cevaplayın. Bunun için 30 Saniyeniz var!", files: [attachment] ,components: [rakamSatirBir]})

    const filter = i => i

    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    collector.on('collect', async i => {
        if (i.customId === String(cevap)) {
            if(basanlar.includes(i.user.id)) return  await i.reply({content: `${i.guild.emojiGöster(emojiler.Iptal)} Cevap hakkınızı doldurmuşsunuz. Üzgünüm!`, ephemeral: true});
            await i.reply({ content: `> **Tebrikler!** Etkinliği kazandığınız için hesabınıza +**${odül}** ${global.ayarlar.serverName} Parası aktarıldı.`, ephemeral: true})
            let uye = i.guild.members.cache.get(i.user.id)
            basanlar = []
            kanal.send({content: `**Tebrikler!** Cevabı bul etkinliğini ${uye} kazandı! ${i.guild.emojiGöster("a_rich")}`}).then(x => setTimeout(() => {
                x.delete()
            }, 10000))
            msg.delete().catch(err =>{})
            if(uye) return await client.Economy.updateBalance(uye.id, Number(odül), "add", 1)
        }
        if(i.customId != String(cevap)) {
            if(basanlar.includes(i.user.id)) return  await i.reply({content: `${i.guild.emojiGöster(emojiler.Iptal)} Cevap hakkınızı doldurmuşsunuz. Üzgünüm!`, ephemeral: true});
            basanlar.push(i.user.id)
            await i.reply({ content: `${i.guild.emojiGöster(emojiler.Iptal)} **Hay Aksi!** Yanlış, artık birdahaki sorulara. Cevap hakkınız doldu!`, ephemeral: true})
        }
    });

    collector.on('end', collected => msg.delete().catch(err => {}));

    function applyText(canvas, text, defaultFontSize, width, font){
        const ctx = canvas.getContext("2d");
        do {
            ctx.font = `${(defaultFontSize -= 1)}px ${font}`;
        } while (ctx.measureText(text).width > width);
        return ctx.font;
    }
}

async function doğruKasaBul(client, odül = Number(Math.floor(Math.random() * 100000) + 3000)) {
    let kanal = client.channels.cache.get(global.kanallar.chatKanalı)
    if(!kanal) return;
    let cevap = Math.floor(Math.random() * 5) + 1
    let basanlar = []
    let canvas = Canvas.createCanvas(1080, 400),
    ctx = canvas.getContext("2d");

    // Canvas
    ctx.beginPath();
    ctx.moveTo(0 + Number(30), 0);
    ctx.lineTo(0 + 1080 - Number(30), 0);
    ctx.quadraticCurveTo(0 + 1080, 0, 0 + 1080, 0 + Number(30));
    ctx.lineTo(0 + 1080, 0 + 400 - Number(30));
    ctx.quadraticCurveTo(
    0 + 1080,
    0 + 400,
    0 + 1080 - Number(30),
    0 + 400
    );
    ctx.lineTo(0 + Number(30), 0 + 400);
    ctx.quadraticCurveTo(0, 0 + 400, 0, 0 + 400 - Number(30));
    ctx.lineTo(0, 0 + Number(30));
    ctx.quadraticCurveTo(0, 0, 0 + Number(30), 0);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1080, 400);
    let background =  await Canvas.loadImage("../../Assets/banner.png");
    ctx.drawImage(background, 0, 0, 1080, 400);
    ctx.restore();
    ctx.beginPath();
    ctx.globalAlpha = 0.5
    ctx.fillStyle = "#000000";
    ctx.moveTo(50,  22);
    ctx.lineTo(canvas.width - 50,  22);
    ctx.quadraticCurveTo(canvas.width - 50,  22, canvas.width -  22, 50);
    ctx.lineTo(canvas.width -  22, canvas.height - 50);
    ctx.quadraticCurveTo(canvas.width - 25, canvas.height -  22, canvas.width - 50, canvas.height -  22);
    ctx.lineTo(50, canvas.height - 22);
    ctx.quadraticCurveTo(25, canvas.height -  22,  22, canvas.height - 50);
    ctx.lineTo( 22, 50);
    ctx.quadraticCurveTo( 22,  22, 50,  22);
    ctx.fill();
    ctx.closePath();
    ctx.globalAlpha = 1
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = applyText(canvas, "TAHMİN ET!", 75, 500, "Bold");
    ctx.fillText("DOGRU KASAYI BULUN!", 160, 125);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = applyText(canvas, `${odül} ${global.ayarlar.serverName.toUpperCase()} PARASI KAZANACAKSIN!`, 45, 690, "Bold");
    ctx.fillText(`${global.ayarlar.serverName.toUpperCase()} KASALARININ SANA SUPRIZI VAR!`,180, 180 + 85 );

    ctx.font = applyText(canvas, "SADECE BIR KEZ HAKKIN VAR!", 45, 690, "Bold");
    ctx.fillText("SADECE BIR KEZ HAKKIN VAR!", 260, 310 + 40 );

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'acar_economy.png' });

    let rakamSatirBir = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('1').setEmoji("1522605650914443314").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('2').setEmoji("1522605650914443314").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('3').setEmoji("1522605650914443314").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('4').setEmoji("1522605650914443314").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('5').setEmoji("1522605650914443314").setStyle(ButtonStyle.Secondary)
    )
    let msg = await kanal.send({content: "**Doğru Kasayı Bul!**\nAşağıda düğmelerde verilen kasalardan doğru kasayı bulunuz. Bunun için 30 Saniyeniz var!", files: [attachment] ,components: [rakamSatirBir]})

    const filter = i => i

    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    collector.on('collect', async i => {
        if (i.customId === String(cevap)) {
            if(basanlar.includes(i.user.id)) return  await i.reply({content: `${i.guild.emojiGöster(emojiler.Iptal)} Cevap hakkınızı doldurmuşsunuz. Üzgünüm!`, ephemeral: true});
            await i.reply({ content: `> **Tebrikler!** Etkinliği kazandığınız için hesabınıza +**${odül}** ${global.ayarlar.serverName} Parası aktarıldı. ${i.guild.emojiGöster("a_rich")}`, ephemeral: true})
            let uye = i.guild.members.cache.get(i.user.id)
            kanal.send({content: `**Tebrikler!** Doğru kasayı bul etkinliğini ${uye} kazandı! ${i.guild.emojiGöster("a_rich")}`}).then(x => setTimeout(() => {
                x.delete()
            }, 10000))
            msg.delete().catch(err =>{})
            basanlar = []
            if(uye) return await client.Economy.updateBalance(uye.id, Number(odül), "add", 1)
        }
        if(i.customId != String(cevap)) {
            if(basanlar.includes(i.user.id)) return  await i.reply({content: `${i.guild.emojiGöster(emojiler.Iptal)} Cevap hakkınızı doldurmuşsunuz. Üzgünüm!`, ephemeral: true});
            basanlar.push(i.user.id)
            await i.reply({ content: `${i.guild.emojiGöster(emojiler.Iptal)} **Hay Aksi!** Yanlış, artık birdahaki sorulara. Cevap hakkınız doldu!`, ephemeral: true})
        }
    });

collector.on('end', collected => msg.delete().catch(err => {}));
}

// Global olarak erişilebilir applyText fonksiyonu (Tüm hataları çözen kısım)
function applyText(canvas, text, defaultFontSize, width, font){
    const ctx = canvas.getContext("2d");
    do {
        ctx.font = `${(defaultFontSize -= 1)}px ${font}`;
    } while (ctx.measureText(text).width > width);
    return ctx.font;
}