const { Collection, AuditLogEvent } = require('discord.js');
const alwaysJoined = new Collection();
const Users = require('../../../../Global/Databases/Client.Users');
const Jails = require('../../../../Global/Databases/Punitives.Jails');
const VMutes = require('../../../../Global/Databases/Punitives.Vmutes');
const Mutes = require('../../../../Global/Databases/Punitives.Mutes');
const Forcebans = require('../../../../Global/Databases/Punitives.Forcebans');
const Punitives = require('../../../../Global/Databases/Global.Punitives');
const Settings = require('../../../../Global/Databases/Global.Guild.Settings');
const Welcome = require('../../../../Global/Databases/Guild.Welcome.Settings');
const {VK, DC, STREAM} = require('../../../../Global/Databases/Punitives.Activitys');
const { genEmbed } = require('../../../../Global/İnit/Embed');
const getInvite = new Collection(); // client.invites yerine kendi Collection'ımız

// client.on("ready", ...) gibi global event kayıtları bu dosyanın dışında yapılmalıdır.
// Ancak bu dosya bir event handler olduğundan, aşağıdaki gibi V14 yapısına uygun modül export'ları ile ele alıyoruz.

/**
 * Bu event, bot Discord'a başarıyla bağlandığında (hazır olduğunda) tetiklenir.
 * Bu yapı, event handler'ları dışarıda kaydetmek için idealdir.
 */
client.on("ready", async () => {
    // Giriş-Çıkış Temizleme Interval'i
    setInterval(() => {
        if(alwaysJoined.size > 0) {
            console.log(`[Giriş-Çıkış Temizleme] ${alwaysJoined.size} veri temizlendi.`);
            alwaysJoined.clear();
        }
    }, 1000 * 60 * 60 * 1); // 1 Saat

    // Ready'de Davet Önbelleğini Yükleme
    const guild = client.guilds.cache.get(sistem.SERVER.ID);
    if (!guild) return console.error(`[READY] Sunucu ID'si ${sistem.SERVER.ID} bulunamadı!`);

    try {
        const guildInvites = await guild.invites.fetch();
        const cacheInvites = new Collection();
        guildInvites.forEach((inv) => {
            cacheInvites.set(inv.code, { code: inv.code, uses: inv.uses, inviter: inv.inviter });
        });
        getInvite.set(guild.id, cacheInvites);
        console.log(`[READY] Davet önbelleği başarıyla yüklendi. (${cacheInvites.size} adet davet kodu)`);
    } catch (error) {
        console.error(`[READY] Davet önbelleği yüklenirken hata oluştu: ${error.message}`);
    }
});

// Davet Oluşturuldu Event'i (V14 uyumlu)
client.on('inviteCreate', async invite => {
    try {
        const guildInvites = await invite.guild.invites.fetch();
        const cacheInvites = new Collection();
        guildInvites.forEach((inv) => {
            cacheInvites.set(inv.code, { code: inv.code, uses: inv.uses, inviter: inv.inviter });
        });
        getInvite.set(invite.guild.id, cacheInvites);
    } catch (error) {
        console.error(`Davet önbelleği güncellenirken hata oluştu (inviteCreate): ${error.message}`);
    }
});

// Davet Silindi Event'i (V14 uyumlu)
client.on('inviteDelete', async invite => {
    // 5 saniye bekleme 500ms'e düşürüldü ve await yapısına dönüştürüldü.
    await new Promise(resolve => setTimeout(resolve, 500)); 
    try {
        const guildInvites = await invite.guild.invites.fetch();
        const cacheInvites = new Collection();
        guildInvites.forEach((inv) => {
            cacheInvites.set(inv.code, { code: inv.code, uses: inv.uses, inviter: inv.inviter });
        });
        getInvite.set(invite.guild.id, cacheInvites);
    } catch (error) {
        console.error(`Davet önbelleği güncellenirken hata oluştu (inviteDelete): ${error.message}`);
    }
});

// Davet mesajı taslağını belirleyen ve mesajı atan ana fonksiyon
async function hoşgeldinMesajı(member) {
    const ayarlar = global._set; // Globalden çekildi
    
    // Davet Bilgilerini Çekme (V14 uyumlu, await ile fetch kullanıldı)
    const guildInvites = getInvite.get(member.guild.id) || new Collection();
    const invites = await member.guild.invites.fetch().catch(() => new Collection());
    
    const invite = invites.find(
        (inv) => guildInvites.has(inv.code) && inv.uses > guildInvites.get(inv.code).uses
    ) || guildInvites.find(
        (x) => !invites.has(x.code)
    ) || member.guild.vanityURLCode;

    // Davet önbelleğini güncelle
    const cacheInvites = new Collection();
    invites.forEach((inv) => { cacheInvites.set(inv.code, { code: inv.code, uses: inv.uses, inviter: inv.inviter }); });
    getInvite.set(member.guild.id, cacheInvites);
    
    let davettaslak;
    if (!invite || typeof invite === 'string' && invite === member.guild.vanityURLCode) {
        davettaslak = `Özel URL`;
    } else {
        const inviterMember = await member.guild.members.fetch(invite.inviter.id).catch(() => null);
        davettaslak = inviterMember ? `${inviterMember}` : `Özel URL`;
    }

    // Kanalı Bulma
    let hoşgeldinKanal = member.guild.channels.cache.get(ayarlar.hoşgeldinKanalı) || member.guild.kanalBul(ayarlar.hoşgeldinKanalı);
    
    let Data = await Welcome.findOne({guildId: member.guild.id});
const emojiler = global.emojiler
    if(hoşgeldinKanal) {
        if(Data) {
            // ... (Mesaj içeriği ve değişken değişimleri aynı bırakıldı)
            let hoşgeldinTextiAmınakodum = Data.Text
                .replace("-tag-", `${ayarlar.tag ? ayarlar.tag : "Tag Bulunamadı!"}`)
                .replace("-sunucu-", `${ayarlar.serverName ? ayarlar.serverName : member.guild.name}`)
                .replace("-üye-", `${member}`)
                .replace("-üyeid-", `${member.id}`)
                .replace("-kişi-", `${global.sayılıEmoji(member.guild.memberCount)}`)
                .replace("-davet-", `${davettaslak}`)
                .replace("-teyitci-", `${ayarlar ? ayarlar.teyitciRolleri ? `${ayarlar.teyitciRolleri.filter(x => member.guild.roles.cache.has(x)).map(x => `<@&${x}>`).join(", ")}` : `@Rol Bulunamadı!` : `@Rol Bulunamadı!`}`)
                .replace("-oluşturma-", `${global.tarihsel(member.user.createdAt)}`)
                .replace("-kaçyıl-", `${global.timeTag(Date.parse(member.user.createdAt))}`)
                .replace("-kurallar-", `${ayarlar.kurallarKanalı ? `<#${ayarlar.kurallarKanalı}>` : member.guild.kanalBul("kurallar")}`)
                .replace("-teyit-", `${member.guild.channels.cache.filter(x => x.parentId == kanallar.registerKategorisi && x.type == "GUILD_VOICE").random()}`)
        
            if(Data.Webhook) {
                // Webhook desteği aynı bırakıldı. (wsend metodunun tanımlı olduğu varsayılır)
                hoşgeldinKanal.wsend({content: `${hoşgeldinTextiAmınakodum}`});
            } else {
                hoşgeldinKanal.send({content: `${hoşgeldinTextiAmınakodum}`});
            }
        } else {

            const randomRegisterVoice = member.guild.channels.cache.filter(x => 
    x.parentId == (typeof kanallar !== 'undefined' ? kanallar.registerKategorisi : "1516033777623629844") && 
    x.type == 2 // 2 = GUILD_VOICE (V14 standartı)
).random();
            // Varsayılan hoşgeldin mesajı
            hoşgeldinKanal.send({content: `${member}, ${ayarlar.serverName ? `${ayarlar.serverName}` : member.guild.name} Sunucumuza Hoş Geldin.
Seninle beraber sunucumuz **${global.sayılıEmoji(member.guild.memberCount)}** üye sayısına ulaştı. <a:yeil_konfeti:1517153096705507359>

Hesabın __${global.tarihsel(member.user.createdAt)}__ tarihinde (${global.timeTag(Date.parse(member.user.createdAt))}) oluşturulmuş!
Kayıt işleminden sonra ${ayarlar.kurallarKanalı ? `<#${ayarlar.kurallarKanalı}>` : member.guild.kanalBul("kurallar")} kanalına göz atmayı unutmayın.

${randomRegisterVoice} Kanalına katılarak "${ayarlar.isimyas ? `İsim | Yaş` : `Nick`}" vererek kayıt olabilirsiniz.
Sunucumuza ${davettaslak == "Özel URL" ? `Özel URL ile katıldı. ` : `${davettaslak} tarafından davet edildi. `}${ayarlar.type ? `${ayarlar.taglıalım ? ` **Şuan için taglı alımdayız**, tagımızı alarak veya takviye yaparak bize destek olabilirsiniz. (\`${ayarlar.tag}\`)` : `Tagımızı alarak veya takviye yaparak bize destek olabilirsiniz. (\`${ayarlar.tag}\`)`}` : ``}
\`\`\`
Kayıt olduktan sonra kuralları okuduğunuzu kabul edeceğiz ve içeride yapılacak cezalandırma işlemlerini bunu göz önünde bulundurarak yapacağız. ${ayarlar.serverName}
\`\`\`
`});
        }
    } else {
        client.logger.log("Lütfen sunucu üzerinden hoşgeldin kanalını belirtin. Bir üye girdi fakat hoşgeldin mesajı atamadım.","error");
    }
}

// Üye rolleri tanımlama fonksiyonu
async function rolTanımlama(üye, rol) {
    let Mute = await Mutes.findOne({ _id: üye.id });
    let Vk = await VK.findOne({_id: üye.id});
    let Dc = await DC.findOne({_id: üye.id});
    let Stream = await STREAM.findOne({_id: üye.id});
    let startRoles = [...rol];
    const _set = global._set; // Globalden çekildi

    if(Mute) startRoles.push(_set.muteRolü);
    if(_set.vkCezalıRolü && Vk) startRoles.push(_set.vkCezalıRolü);
    if(_set.dcCezalıRolü && Dc) startRoles.push(_set.dcCezalıRolü);
    if(_set.streamerCezalıRolü && Stream) startRoles.push(_set.streamerCezalıRolü);
    if(_set.type && üye.user.username.includes(_set.tag)) await startRoles.push(_set.tagRolü);
    
    // v14: roles.set() kullanımı aynı kalmıştır.
    await üye.roles.set(startRoles).catch(err => console.error("Rol atarken hata oluştu:", err)); 
}


// --- ANA EVENT: guildMemberAdd ---
module.exports = async (member) => {
    if(!global.sistem || member.guild.id != global.sistem.SERVER.ID) return;
    
    // Ayarları çek
    const _findServer = await Settings.findOne({ guildID: sistem.SERVER.ID });
    if (!_findServer) return;
    global._set = _findServer.Ayarlar;
    const _set = global._set;

    let User = await Users.findOne({ _id: member.id });
    let Jail = await Jails.findOne({ _id: member.id });
    let Forceban = await Forcebans.findOne({ _id: member.id });
    let Underworld = await Punitives.findOne({Member: member.id, Type: "Underworld", Active: true});
    
    // Hesap oluşturma zamanı kontrolü
    let OneWeak = Date.now()-member.user.createdTimestamp <= 1000*60*60*24*7;
    
    // Üyeyi cache'den değil, gelen member objesinden kullanmak daha güvenli (Zaten günceldir)
    // Eski Kod: member = member.guild.members.cache.get(member.id); // Kaldırıldı
    
    // Ceza Puanı (member'ın cezaPuan() metodunun global olarak tanımlı olduğu varsayılır)
    let cezaPuan = await member.cezaPuan();
    
    // --- Sürekli Giriş/Çıkış Kontrolü (Anti Raid) ---
    let amkSürekliÇıkıyoGiriyo = alwaysJoined.get(member.id) || 0;
    if(amkSürekliÇıkıyoGiriyo >= 3) {
        let hgKanalı = member.guild.channels.cache.get(_set.hoşgeldinKanalı);
        if(hgKanalı) hgKanalı.send({content: `${member} isimli üye birden fazla **Giriş-Çıkış** işlemi yaptığından dolayı sunucudan uzaklaştırıldı. ${member.guild.emojiGöster(emojiler.Iptal)}`}).catch(err => {});
        alwaysJoined.delete(member.id);
        // v14: member.ban() kullanımı aynı kalmıştır.
        return await member.ban({reason: "Sürekli Çıkış/Giriş işlemi uygulamak."}).catch(err => {});
    } else {
        let getir = alwaysJoined.get(member.id) || 0;
        alwaysJoined.set(member.id, getir + 1);
    }
    
    // --- İsim ve Kayıt Kontrolleri ---
    if(_set.otoIsim && User && User.Name && User.Names && User.Gender && User.Gender != "Kayıtsız") {
        await member.setNickname(`${_set.type && member.user.username.includes(_set.tag) ? _set.tag + " " : (_set.tagsiz ? _set.tagsiz + " " : (_set.tag || ""))}${User.Name}`).catch(err => {});
    } else {
        // Kayıtsız nickname ayarlama mantığı iyileştirildi ve birleştirildi.
        let newNickname = "Kayıtsız";
        if(_set.isimyas) {
            newNickname = "İsim | Yaş";
        }
        if(_set.type) {
            const prefix = member.user.username.includes(_set.tag) ? _set.tag : (_set.tagsiz ? _set.tagsiz : (_set.tag || ""));
            newNickname = `${prefix} ${newNickname}`;
        }

        if(member.manageable) await member.setNickname(newNickname).catch(err => {});
    }

    // --- Şüpheli Hesap Kontrolü ---
    if(OneWeak) {
        await member.setRoles(_set.şüpheliRolü).catch(err => {});
        const hgKanal = member.guild.channels.cache.get(_set.hoşgeldinKanalı);
        if(hgKanal) hgKanal.send(`${member} isimli üye sunucuya katıldı fakat hesabı ${global.timeTag(Date.parse(member.user.createdAt))} açıldığı için şüpheli olarak işaretlendi.`).catch(err => {});
        
        const şüpheliLogKanalı = member.guild.kanalBul("şüpheli-log");
        if(şüpheliLogKanalı) şüpheliLogKanalı.send({embeds: [new genEmbed().setDescription(`${member} isimli üye sunucuya katıldı fakat hesabı ${global.timeTag(Date.parse(member.user.createdAt))} açıldığı için şüpheli olarak işaretlendi.`)]}).catch(err => {});
        return;
    }

    // --- Yasaklı Tag Kontrolü ---
    if(_set.yasakTaglar && _set.yasakTaglar.some(tag => member.user.username.includes(tag) || member.user.discriminator == tag)) { // discriminator kontrolü için sadece tag'ı eşitler.
        await member.setRoles(_set.yasaklıTagRolü).catch(err => {});
        member.send(`**Merhaba!**
Üzerinizde bulunan **\` ${_set.yasakTaglar.find(x => member.user.username.includes(x) || member.user.discriminator == x)} \`** bu sembol veya etiket yasaklandığı için sizi yasaklı kategorisine ekledik.
\`\`\`
Üzerinizde bulunan yasaklı tag çıkarıldığında kayıtlı iseniz otomatik kayıt olacaksınız kayıtlı değilseniz kayıtsıza tekrardan düşeceksiniz.
\`\`\``).catch(err => {});
        
        const yasaklıTagLogKanalı = member.guild.kanalBul("yasaklı-tag-log");
        if(yasaklıTagLogKanalı) yasaklıTagLogKanalı.send({embeds: [new genEmbed().setDescription(`${member} isimli üye sunucuya katıldı fakat isminde yasaklı tag/etiket barındırdığından dolayı yasaklı olarak işaretlendi.`)]}).catch(err => {});
        
        const hgKanal = member.guild.channels.cache.get(_set.hoşgeldinKanalı);
        if(hgKanal) hgKanal.send(`${member} isimli üye sunucumuza katıldı fakat ismininde \` Yasaklı Tag \` bulundurduğu için cezalı olarak belirlendi.`).catch(err => {});
        return;
    }

    // --- Ceza Kontrolleri ---
    const hgKanal = member.guild.channels.cache.get(_set.hoşgeldinKanalı);

    if(Jail) {
        await member.setRoles(_set.jailRolü).catch(err => {});
        if(hgKanal) hgKanal.send(`${member} isimli üye sunucumuza katıldı fakat aktif bir cezalandırılması bulunduğu için tekrardan cezalandırıldı.`).catch(err => {});
        return;
    }

    if(Underworld) {
        await member.setRoles(_set.underworldRolü).catch(err => {});
        if(hgKanal) hgKanal.send(`${member} isimli üye sunucumuza katıldı fakat aktif bir Underworld cezası bulunduğu için tekrardan Underworld'e gönderildi.`).catch(err => {});
        return;
    }

    if(Forceban) {
        await member.ban({ reason: 'Forceban tarafından yasaklandı.' }).catch(err => {});
        if(hgKanal) hgKanal.send(`${member} isimli üye sunucumuza katıldı. fakat Kalkmazban sistemi ile yasaklandığından dolayı sunucumuzda tekrar yasaklandı.`).catch(err => {});
        return;
    }

    if(cezaPuan >= 50) {
        await member.setRoles(_set.şüpheliRolü).catch(err => {});
        member.send({embeds: [new genEmbed().setDescription(`${member.guild.emojiGöster(emojiler.Cezalandırıldı)} ${member} Ceza puanın \`${cezaPuan}\` olduğu için otomatik olarak şüpheli hesap olarak belirlendin.`)]}).catch(x => {});
        if(hgKanal) hgKanal.send(`${member} isimli üye sunucumuza katıldı, Ceza puanı \`50\` üzeri olduğu için şüpheli olarak belirlendi.`).catch(err => {});
        return;
    }
    
    // --- Otomatik Kayıt Kontrolü ---
    if(_set.otoKayıt && User && User.Name && User.Names && User.Gender) {
        if(_set.taglıalım && !member.user.username.includes(_set.tag)) {
            // Taglı alım açık ama tagı yoksa kayıtsız rolü verilir.
            await rolTanımlama(member,_set.kayıtsızRolleri);
            return hoşgeldinMesajı(member);
        }
        
        let chatKanal = member.guild.channels.cache.get(_set.chatKanalı);
        let genderRoles = User.Gender == "Erkek" ? _set.erkekRolleri : _set.kadınRolleri;
        let genderName = User.Gender == "Erkek" ? "Erkek" : "Kadın";
        
        if(hgKanal) hgKanal.send({content: `${member.guild.emojiGöster("927298179467198464")} ${member} İsimli Üye Daha Önce **${genderName}** Olarak Kayıt Olduğu İçin Otomatik Olarak Kayıt Edildi.`}).catch(err => {});
        if(chatKanal) chatKanal.send(`:tada: Hoş Geldin ${member} Aramıza Tekrardan Katıldığınız İçin Teşekkür Ederiz.`).then(x => {
            setTimeout(() => {
                x.delete().catch(err => {})
            }, 12500)
        }).catch(err => {});
        
        await Users.updateOne({_id: member.id}, { $push: { "Names": { Name: User.Name, State: `Oto. Bot Kayıt) (${genderRoles.map(x => member.guild.roles.cache.get(x)).join(",")}`, Date: Date.now() }}}, {upsert: true}).catch(err => {});
        return await rolTanımlama(member, genderRoles);
    }
    
    // --- Varsayılan Kayıtsız ---
    await rolTanımlama(member,_set.kayıtsızRolleri);
    hoşgeldinMesajı(member);
};

module.exports.config = {
    Event: "guildMemberAdd"
};