const { GuildMember, Collection, EmbedBuilder, AuditLogEvent } = require('discord.js');
const GUILD_INVITE = require('../../../../Global/Databases/Global.Guild.Invites');
const GUILD_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');
let Upstaff;
let _statSystem; // Global değişken kontrolü için tanımlandı

/**
 * * @param {GuildMember} member 
 */

module.exports = async (member) => {
    // ⚠️ Kontrol: sistem ve client objelerinin globalde tanımlı olduğu varsayılmıştır.
    if (!global.client || !global.sistem) return;
   const emojiler = global.emojiler || require("../../../../Global/Settings/Emoji.json")
    // Botun sadece belirlenen sunucuda çalışmasını sağla
    if (member.guild.id !== sistem.SERVER.ID) return;

    // Gerekli global modülleri çağır
    Upstaff = require('../../../../Global/Plugins/Staff');
    _statSystem = global._statSystem;

    // Ayarları veritabanından çek ve global_set'i ayarla
    const _findServer = await GUILD_SETTINGS.findOne({ guildID: sistem.SERVER.ID });
    if (!_findServer) return;

    const _set = global._set = _findServer.Ayarlar;
    
    // Davet kanalını güvenilir şekilde al
    const channel = member.guild.channels.cache.get(_set.davetKanalı);
    if (!channel) return;

    // --- BOT KONTROLÜ (BOT_ADD Event'i v14'e uygun hale getirildi) ---
    if (member.user.bot) {
        // AuditLogEvent.BotAdd (v14) kullanıldı
        let entry = await member.guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 1 }).then(audit => audit.entries.first());
        if (entry && entry.createdTimestamp > (Date.now() - 5000)) { // 5 saniye içinde bot eklendiyse
            return channel.send({ content: `${member.guild.emojiGöster(emojiler.Onay)} ${member} isimli bot, **${entry.executor.tag}** tarafından \`${member.guild.name}\` sunucusuna davet edildi.` });
        }
        return; // Bot ekleme logu bulunamazsa normal akışı kes
    }
    
    // --- DAVET TAKİP İŞLEMLERİ ---
    // client.invites'in globalde tutulduğu varsayılmıştır.
    const guildInvites = client.invites.get(member.guild.id) || new Collection();
    
    // v14'te davetleri fetch etmek await gerektirir
    const invites = await member.guild.invites.fetch(); 
    
    // Daveti bulan mantık
    const invite = invites.find(
        (inv) => guildInvites.has(inv.code) && inv.uses > guildInvites.get(inv.code).uses
    ) || guildInvites.find( // Kullanılan davet silindiyse veya geçerliliğini yitirdiyse
        (x) => !invites.has(x.code)
    ) || member.guild.vanityURLCode; // Özel URL

    // Davet önbelleğini güncelle
    const cacheInvites = new Collection();
    invites.forEach((inv) => { 
        cacheInvites.set(inv.code, { code: inv.code, uses: inv.uses, inviter: inv.inviter }); 
    });
    client.invites.set(member.guild.id, cacheInvites);
    
    // ⚠️ Davet Bulunamama Durumlarını Birleştirme ve Sadeleştirme
    if (!invite || invite === null || invite === undefined || (typeof invite === 'string' && invite !== member.guild.vanityURLCode)) {
      // Bulunamayan, süresi biten veya API'nin yakalayamadığı davetler (Unknown)
      return channel.send({ content: `<:andale_join:1516878976881000538> ${member} üyesi sunucumuza <t:${Number(String(Date.now()).substring(0, 10))}:R> katıldı! **[Davet Verisi Bulunamadı]**` });
    } else if (invite === member.guild.vanityURLCode) {
      // --- ÖZEL URL (VANITY) ---
      const inviterId = member.guild.id; // Özel URL için davet eden ID'si sunucu ID'si olarak kabul ediliyor
      await GUILD_INVITE.findOneAndUpdate({ userID: member.user.id }, { $set: { Inviter: inviterId } }, { upsert: true });
      await GUILD_INVITE.findOneAndUpdate({ guildID: member.guild.id, userID: inviterId }, { $inc: { total: 1 } }, { upsert: true });
      const inviterData = await GUILD_INVITE.findOne({ guildID: member.guild.id, userID: inviterId });
      const total = inviterData ? inviterData.total : 0;
      return channel.send({ content: `<:andale_join:1516878976881000538> ${member} üyesi sunucumuza **Özel URL** kullanarak <t:${Number(String(Date.now()).substring(0, 10))}:R> katıldı!${total > 0 ? ` **(**Toplam Davet: \`${total}\`**)**` : "" }` });

    } else {
      // --- STANDART DAVET (NORMAL) ---
      const inviterId = invite.inviter.id;
      let inviteOwn = member.guild.members.cache.get(inviterId);
      
      // Davet eden üye önbellekte yoksa fetch et
      if (!inviteOwn) {
          inviteOwn = await member.guild.members.fetch(inviterId).catch(() => null);
      }

      await GUILD_INVITE.findOneAndUpdate({ userID: member.user.id }, { $set: { Inviter: inviterId } }, { upsert: true });

      // Hesap Yaşı Kontrolü (7 Günden Yeniyse = Fake/Şüpheli)
      if (Date.now() - member.user.createdTimestamp <= 1000 * 60 * 60 * 24 * 7) {
        // Fake Davet
        await GUILD_INVITE.findOneAndUpdate({ guildID: member.guild.id, userID: inviterId }, { $inc: { fake: 1, total: 1 } }, { upsert: true }); // total de artırıldı
        const inviterData = await GUILD_INVITE.findOne({ guildID: member.guild.id, userID: inviterId });
        const total = inviterData ? inviterData.total : 0;
        channel.send({ content: `<:andale_join:1430191151201124432> ${member} üyesi **${invite.inviter.tag}** tarafından (Hesabı Yeni) <t:${Number(String(Date.now()).substring(0, 10))}:R> sunucumuza davet edildi. ${total > 0 ? `**(**Toplam Davet: \`${total}\`**)**` : "" }` });
        
      } else {
        // Gerçek Davet (Regular)
        await GUILD_INVITE.findOneAndUpdate({ guildID: member.guild.id, userID: inviterId }, { $inc: { total: 1, regular: 1 } }, { upsert: true });
        const inviterData = await GUILD_INVITE.findOne({ guildID: member.guild.id, userID: inviterId });
        const total = inviterData ? inviterData.total : 0;
        
        // Upstaff ve Leaderboard işlemleri (inviteOwn varlığı kontrol edilerek)
        if(inviteOwn && _statSystem) { // _statSystem'in varlığı kontrol edildi
            await Upstaff.addPoint(inviteOwn.id, _statSystem.points.invite, "Invite");
            inviteOwn.Leaders("davet", _statSystem.points.invite, {type: "INVITE", user: member.id});
            inviteOwn.Leaders("invite", _statSystem.points.invite, {type: "INVITE", user: member.id});
        }
        
        channel.send({ content: `<:andale_join:1516878976881000538> ${member} üyesi **${invite.inviter.tag}** tarafından <t:${Number(String(Date.now()).substring(0, 10))}:R> sunucumuza davet edildi. ${total > 0 ? `**(**Toplam Davet: \`${total}\`**)**` : "" }` });
      }
    }
}

module.exports.config = {
    Event: "guildMemberAdd"
}