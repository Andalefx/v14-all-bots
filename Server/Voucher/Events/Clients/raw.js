const { Colors, userMention } = require ("discord.js")
const { genEmbed } = require("../../../../Global/İnit/Embed") // genEmbed fonksiyonunuzun yolu

// Config dosyası okumak yerine ID'leri buraya doğrudan yazıyoruz
const GUILD_ID = "1515377632177557524";
const CHANNEL_ID = "1516407443134091394";
const ROLE_ID = "1517903112361345266";

// Bellekte (RAM) geçici işlem takibi için Map
const userStore = new Map();


    module.exports = async (pkg) => {
   
        // Sadece GUILD_MEMBER_UPDATE paketlerini dinle
        if (pkg.t !== "GUILD_MEMBER_UPDATE") return;
        
        // Kullanıcı klan/sunucu rozetini pasif hale getirdiyse
        if (pkg.d.user?.primary_guild?.badge?.identity_enabled === false) {
            userStore.clear();
            return;
        }

        // Doğrudan client önbelleğinden sunucuyu çekme
        const guild = client.guilds.cache.get(GUILD_ID);
        if (!guild) return;

        // Sunucu içerisinden kanal, rol ve üyeyi önbellekten çekme
        const channel = guild.channels.cache.get(CHANNEL_ID);
        const role = guild.roles.cache.get(ROLE_ID);
        const member = guild.members.cache.get(pkg.d.user?.id);

        // Eğer bunlardan biri önbellekte yoksa işlemi sessizce sonlandır
        if (!channel || !role || !member) return;

        const guildId = pkg.d.user?.primary_guild?.identity_guild_id;
        const userId = member.id;

        // Rozet görselini oluşturma
        const badgeImage = `https://cdn.discordapp.com/clan-badges/${guild.id}/${pkg.d.user?.primary_guild?.badge}.png?size=4096`;

        // Rozet/Etiket aktifse (Rol verme kısmı)
        if (guildId === GUILD_ID) {
            if (userStore.has(userId)) return;
            userStore.set(userId, Date.now());

            await member.roles.add(role.id).catch(() => {});
            
            const welcomeEmbed = new genEmbed()
                .setAuthor({
                    name: `Hoşgeldin ${member.user.displayName}!`,
                    iconURL: member.displayAvatarURL(),
                })
                .setTitle("Bizi Desteklediğin İçin Teşekkürler!")
                .setThumbnail(badgeImage)
                .setDescription(
                    "> Sunucumuzun etiketini (tag'ini) aldığın için teşekkürler! Artık topluluğumuzu temsil ediyorsun. Bu etiketi taşıdığın sürece bu özel role sahip olacaksın."
                );

            channel.send({
                content: userMention(member.id),
                embeds: [welcomeEmbed],
            }).catch(() => {});
        } 
        // Rozet/Etiket kaldırılmışsa (Rolü geri alma kısmı)
        else {
            if (!userStore.has(userId)) return;
            userStore.delete(userId);

            await member.roles.remove(role.id).catch(() => {});
            
            const byeEmbed = new genEmbed()
                .setColor(Colors.Red)
                .setAuthor({
                    name: `Görüşürüz ${member.user.displayName}!`,
                    iconURL: member.displayAvatarURL(),
                })
                .setTitle("Seni Özleyeceğiz.")
                .setDescription(
                    "> Sunucu etiketini ismindeki kaldırdığın için temsilci rolün de kaldırıldı. Yeniden topluluğu temsil etmek istersen, etiketi ismine eklemen yeterli!"
                )
                .setThumbnail(badgeImage);

            channel.send({
                embeds: [byeEmbed],
            }).catch(() => {});
        }
    }

module.exports.config = {
    Event: "raw"
};