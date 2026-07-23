const { Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const moment = require("moment");
require("moment-duration-format");
moment.locale("tr");

const voice = require("../../../../Global/Databases/voiceInfo"); 
const green = "✅"; 

// --- SAYFA VERİLERİNİ TUTAN OBJE ---
const createPage = async (pageIndex, member, message) => {
    const user = member.user;
    const defaultColor = member.displayHexColor === '#000000' ? '#5865F2' : member.displayHexColor;
    const embed = new EmbedBuilder()
        .setColor(defaultColor)
        .setAuthor({ name: `${member.displayName} Profili`, iconURL: user.displayAvatarURL({ forceStatic: false }) })
        .setThumbnail(user.displayAvatarURL({ forceStatic: false, size: 256 }));

    let content = "";
    
    // --- HATA ÇÖZÜMÜ KISMI ---
    // user ve member objeleri üzerinden güvenli zaman damgası alımı
    const userCreatedTimestamp = user.createdAt ? `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>` : "Bilinmiyor"; 
    const memberJoinedTimestamp = member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "Bilinmiyor"; 
    
    const getDevice = () => {
        const clientStatus = member.presence?.clientStatus;
        if (!clientStatus) return "Bilinmiyor";
        if (clientStatus.desktop) return "💻 Masaüstü";
        if (clientStatus.mobile) return "📱 Mobil";
        if (clientStatus.web) return "🌐 Web";
        return "Bilinmiyor";
    };
    
    embed.setThumbnail(user.displayAvatarURL({ forceStatic: false, size: 256 }));
    embed.setImage(null);

    switch (pageIndex) {
        case 0: // Sayfa 1: Ana Bilgiler
            embed.setTitle("Kullanıcı Bilgisi");

            const allMembers = await message.guild.members.fetch({ force: true });
            const joinPosRaw = allMembers.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
                                         .map(m => m.id).indexOf(member.id) + 1;
            
            const joinPosFormatted = `${joinPosRaw.toLocaleString()}/${message.guild.memberCount.toLocaleString()}`;

            const filteredRoles = member.roles.cache.filter(r => r.name !== '@everyone');
            const roleCount = filteredRoles.size;
            const limitedRoles = filteredRoles.map(r => r).slice(0, 5).join(', ');
            
            const rolesLine = roleCount > 0 
                ? `(\`${roleCount}\`): ${limitedRoles}${roleCount > 5 ? `, ve ${roleCount - 5} rol daha...` : ''}`
                : `(\`0\`): Yok!`

            content = [
                `\`ID:\` ${user.id}`,
                `\`Kullanıcı:\`  ${user}`,
                `\`Kullanıcı Adı:\` ${user.username}`,
                `\`Görünen Ad:\` ${member.displayName}`,
                `\`Durum:\` ${member.presence?.status === 'dnd' ? '🔴 Rahatsız Etmeyin' : member.presence?.status === 'idle' ? '🌙 Boşta' : member.presence?.status === 'online' ? '🟢 Çevrimiçi' : '⚫ Çevrimdışı'}`,
                `\`Hesap Açılışı:\` ${userCreatedTimestamp}`,
                `\`Sunucu Katılım:\` ${memberJoinedTimestamp}`,
                `\`Katılım Sırası:\` ${joinPosFormatted}`,
                `\`Cihaz:\` ${getDevice()}`,
                `\`Ceza Puanı:\` \`0\``,
                `\`Son Görülme:\` Kayıt Yok`,
                `\`Roller:\` ${rolesLine}`,
            ].join('\n');
            embed.setDescription(content);
            break;

        case 1: // Sayfa 2: Ses Kanalı Bilgisi
            embed.setTitle("Ses Kanalı Bilgisi");
            const voiceState = message.guild.voiceStates.cache.get(member.id);
            
            if (!voiceState || !voiceState.channel) {
                content = `${member.toString()} şu anda hiçbir ses kanalında değil.`;
            } else {
                let data;
                try { data = await voice.findOne({ userID: user.id }); } catch(e) {}
                const sure = data ? moment.duration(Date.now() - data.date).format("H [saat], m [dakika], s [saniye]") : "Süre bulunamadı";

                content = `${member.toString()}, ${voiceState.channel} kanalında bulunuyor.\n\n` +
                          `**Ses durumu**:\n` +
                          `Mikrofon: \`${voiceState.selfMute ? 'Kapalı!' : 'Açık!'}\`\n` +
                          `Kulaklık: \`${voiceState.selfDeaf ? 'Kapalı!' : 'Açık!'}\`\n` +
                          `Ekran: \`${voiceState.streaming ? 'Açık!' : 'Kapalı!'}\`\n` +
                          `Kamera: \`${voiceState.selfVideo ? 'Açık!' : 'Kapalı!'}\`\n` +
                          `Doluluk: \`${voiceState.channel.members.size}/${voiceState.channel.userLimit || 'Sınırsız'}\`\n` +
                          `Süre: \`${sure}\`\n\n` +
                          `**Ses kanalında bulunan üyeler**:\n` +
                          `\`\`\`\n${voiceState.channel.members.map(x => x.displayName).slice(0, 10).join('\n')}\n\`\`\``;
            }
            embed.setDescription(content);
            break;

        case 2: // Sayfa 3: Profil Fotoğrafı (Avatar)
            const avatarURL = user.displayAvatarURL({ forceStatic: false, size: 2048 });
            embed.setAuthor({ name: `${member.displayName} | Profil Fotoğrafı`, iconURL: user.displayAvatarURL({ forceStatic: false }) });
            embed.setThumbnail(null);
            embed.setDescription("Tam boy görüntü veya indirme bağlantısı aşağıdadır.");
            embed.setImage(avatarURL); 
            break;

        case 3: // Sayfa 4: Banner/Arkaplan Görseli
            embed.setAuthor({ name: `${member.displayName} | Arkaplan Görseli`, iconURL: user.displayAvatarURL({ forceStatic: false }) });
            embed.setThumbnail(null); 
            
            try { await user.fetch(); } catch(e) {}
            const bannerURL = user.bannerURL({ forceStatic: false, size: 2048 });

            if (bannerURL) {
                embed.setDescription("Tam boy görüntü veya indirme bağlantısı aşağıdadır.");
                embed.setImage(bannerURL); 
            } else {
                embed.setDescription("Bu kullanıcının özel bir arka plan/banner görseli bulunmamaktadır.");
                embed.setImage(null);
            }
            break;
    }

    return embed;
};

// --- KOMUTUN ANA KISMI ---
module.exports = {
    Isim: "profil",
    Komut: ["me", "info"],
    Kullanim: "profil <@andale/ID>",
    Aciklama: "Belirlenen kişinin veya kullanan kişinin detaylarını aktarır.",
    Kategori: "diğer",
    Extend: true,

    onLoad: function (client) {},

    onRequest: async function (client, message, args) {
        const targetMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

        let member;
        try {
            member = await message.guild.members.fetch(targetMember.id);
        } catch (e) {
            return message.reply(`❌ Belirtilen kullanıcı sunucuda bulunmuyor veya verisi çekilemedi.`);
        }

        let currentPage = 0;
        const totalPages = 4;
        const user = member.user;

        const createPaginationRow = (page) => {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('Önceki')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0), 
                new ButtonBuilder()
                    .setCustomId('page_indicator')
                    .setLabel(`${page + 1}/${totalPages}`)
                    .setStyle(ButtonStyle.Secondary) 
                    .setDisabled(true), 
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Sonraki')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === totalPages - 1),
            );
            
            let extraButton = null;

            if (page === 2) {
                 const avatarURL = user.displayAvatarURL({ forceStatic: false, size: 2048 });
                 extraButton = new ActionRowBuilder().addComponents(
                     new ButtonBuilder()
                        .setLabel('Profil Fotoğrafı İndir')
                        .setStyle(ButtonStyle.Link)
                        .setURL(avatarURL) 
                 );
            }
            else if (page === 3) {
                 const bannerURL = user.bannerURL({ forceStatic: false, size: 2048 });
                 extraButton = new ActionRowBuilder().addComponents(
                     new ButtonBuilder()
                        .setLabel(bannerURL ? 'Arkaplan Görseli İndir' : 'Arkaplan Yok')
                        .setStyle(ButtonStyle.Link)
                        .setURL(bannerURL || 'https://discord.com')
                        .setDisabled(!bannerURL)
                 );
            }

            return extraButton ? [row, extraButton] : [row];
        };
        
        const initialEmbed = await createPage(currentPage, member, message);
        const initialRows = createPaginationRow(currentPage);

        const sentMessage = await message.reply({ 
            embeds: [initialEmbed], 
            components: initialRows 
        });

        const filter = (i) => i.user.id === message.author.id;
        const collector = sentMessage.createMessageComponentCollector({ 
            filter, 
            time: 90000,
            componentType: ComponentType.Button 
        });

        collector.on('collect', async (i) => {
            await i.deferUpdate().catch(() => {});

            if (i.customId === 'prev_page' && currentPage > 0) {
                currentPage--;
            } else if (i.customId === 'next_page' && currentPage < totalPages - 1) {
                currentPage++;
            } else {
                return;
            }

            const newEmbed = await createPage(currentPage, member, message);
            const newRows = createPaginationRow(currentPage);

            await sentMessage.edit({
                embeds: [newEmbed],
                components: newRows
            }).catch(err => {});
        });

        collector.on('end', async () => {
            const disabledRows = createPaginationRow(currentPage).map(row => 
                 new ActionRowBuilder().addComponents(
                     row.components.map(button => ButtonBuilder.from(button).setDisabled(true))
                 )
            );
            await sentMessage.edit({ components: disabledRows }).catch(err => {});
        });
    }
};