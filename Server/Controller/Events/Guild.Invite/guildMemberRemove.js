const { GuildMember, Collection } = require('discord.js');
const GUILD_INVITE = require('../../../../Global/Databases/Global.Guild.Invites');
const GUILD_SETTINGS = require('../../../../Global/Databases/Global.Guild.Settings');
let Upstaff;
let _statSystem; // Global değişkenin varlığı kontrol için tanımlandı

/**
 * * @param {GuildMember} member 
 */

module.exports = async (member) => {
    // ⚠️ Kontrol: sistem ve client objelerinin globalde tanımlı olduğu varsayılmıştır.
    if (!global.client || !global.sistem) return;
    
    // Botun sadece belirlenen sunucuda çalışmasını sağla
    if (member.guild.id !== sistem.SERVER.ID) return;

    // Gerekli global modülleri çağır
    Upstaff = require('../../../../Global/Plugins/Staff');
    _statSystem = global._statSystem; // _statSystem'i globalden al

    // Ayarları veritabanından çek ve global_set'i ayarla
    const _findServer = await GUILD_SETTINGS.findOne({ guildID: sistem.SERVER.ID });
    if (!_findServer) return;
    
    const _set = global._set = _findServer.Ayarlar;
    
    // Davet kanalını güvenilir şekilde al
    const channel = client.channels.cache.get(_set.davetKanalı);
    if (!channel) return;

    // Bot ayrılıyorsa (Normalde bu olayın guildMemberRemove yerine Bot'un kendisini kaldırırken çalışması beklenir, 
    // ancak üye ayrılma logu olarak yazılmıştır.)
    if (member.user.bot) {
        return channel.send({ content: `<:andale_leave:1516879048830095551> **${member.user.tag}** isimli bot sunucumuzdan <t:${Number(String(Date.now()).substring(0, 10))}:R> ayrıldı!` });
    }

    // --- DAVET VERİSİNİ ÇEKME ---
    // Ayrılan üyenin davet verisini al
    const inviteMemberData = await GUILD_INVITE.findOne({ userID: member.user.id });
    
    // Eğer veri yoksa veya Inviter ID'si kaydedilmemişse (Davetçi bilinmiyorsa)
    if (!inviteMemberData || !inviteMemberData.Inviter) {
      return channel.send({ content: `<:andale_leave:1516879048830095551> **${member.user.tag}** üyesi sunucumuzdan <t:${Number(String(Date.now()).substring(0, 10))}:R> ayrıldı! **[Davet Eden Bilinmiyor]**` });
      
    } else if (inviteMemberData.Inviter === member.guild.id) {
      // --- ÖZEL URL (VANITY) İLE KATILAN ÜYE AYRILIRSA ---
      const inviterId = member.guild.id; 
      await GUILD_INVITE.findOneAndUpdate({ guildID: member.guild.id, userID: inviterId }, { $inc: { total: -1 } }, { upsert: true });
      const inviterData = await GUILD_INVITE.findOne({ guildID: member.guild.id, userID: inviterId });
      const total = inviterData ? inviterData.total : 0;
      return channel.send({ content: `<:andale_leave:1516879048830095551> **${member.user.tag}** üyesi sunucumuzdan <t:${Number(String(Date.now()).substring(0, 10))}:R> ayrıldı! **[Özel URL]** ile katılmıştı. (Toplam Davet: \`${total}\`)` });
      
    } else {
      // --- STANDART DAVET İLE KATILAN ÜYE AYRILIRSA ---
      
      const inviterID = inviteMemberData.Inviter;
      
      // ⚠️ Düzeltme: Inviter bilgisi fetch edilirken hata oluşursa kontrol edildi.
      const inviter = await client.users.fetch(inviterID).catch(() => null); 
      if (!inviter) return channel.send({ content: `<:andale_leave:1516879048830095551> **${member.user.tag}** üyesi sunucumuzdan <t:${Number(String(Date.now()).substring(0, 10))}:R> ayrıldı! (Davetçi Bulunamadı)` });

      const inviterData = await GUILD_INVITE.findOne({ guildID: member.guild.id, userID: inviterID });

      // Hesap Yaşı Kontrolü (7 Günden Yeniyse = Fake/Şüpheli)
      if (Date.now() - member.user.createdTimestamp <= 1000 * 60 * 60 * 24 * 7) {
        // --- FAKE HESAP AYRILMASI ---
        // Fake davet sayısı artırılmaz (çünkü zaten katılırken artırıldı), sadece toplam davet düşülür.
        if (inviterData && inviterData.total - 1 >= 0) {
            await GUILD_INVITE.findOneAndUpdate({ guildID: member.guild.id, userID: inviterID }, { $inc: { total: -1 } }, { upsert: true }); 
        }

        const total = inviterData ? inviterData.total - 1 : 0;
        return channel.send({ content: `<:andale_leave:1516879048830095551> **${member.user.tag}** (Yeni Hesap) üyesi sunucumuzdan <t:${Number(String(Date.now()).substring(0, 10))}:R> ayrıldı! Davetçi: **${inviter.tag}**. ${total >= 0 ? `(Toplam Davet: \`${total}\`)` : "" }` });
        
      } else {
        // --- NORMAL HESAP AYRILMASI (LEAVE) ---
        
        let inviteOwn = member.guild.members.cache.get(inviterID);
        
        // Davet verisinde total'den 1 düş ve leave sayısını 1 artır.
        if (inviterData && inviterData.total - 1 >= 0) {
          await GUILD_INVITE.findOneAndUpdate({ guildID: member.guild.id, userID: inviterID }, { $inc: { leave: 1, total: -1, regular: -1 } }, { upsert: true }); // regular da düşüldü
        }
        
        const updatedInviterData = await GUILD_INVITE.findOne({ guildID: member.guild.id, userID: inviterID });
        const total = updatedInviterData ? updatedInviterData.total : 0;
        
        // Upstaff puanı düşürme (sistem ve üye varlığı kontrol edildi)
        if(inviteOwn && _statSystem && _statSystem.system) {
            // Davetçi puanı düşülür. Upstaff.removePoint'in negatif puanı doğru işlediği varsayılır.
            Upstaff.removePoint(inviteOwn.id, _statSystem.points.invite, "Invite") 
        }

        return channel.send({ content: `<:andale_leave:1516879048830095551> **${member.user.tag}** üyesi sunucumuzdan <t:${Number(String(Date.now()).substring(0, 10))}:R> ayrıldı! Davetçi: **${inviter.tag}**. ${total >= 0 ? `(Toplam Davet: \`${total}\`)` : "" }` });
      }
    }
}

module.exports.config = {
    Event: "guildMemberRemove"
}