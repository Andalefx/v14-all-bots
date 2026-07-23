const { ozi } = require('./Voices.Global.Client');
const { ActivityType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const allah = require('./src/config.json');
const cron = require('node-cron');
const children = require("child_process");
const Database = require("./WelcomeMode"); 
require("./src/handlers/mongoHandler");

// Kanal kontrolü için güvenli döngü yapısı
for (let index = 0; index < allah.Welcome.Tokens.length; index++) {
    let token = allah.Welcome.Tokens[index];
    // Kanallar dizisinde eleman yoksa veya indeks dışındaysa ilk kanalı baz alıyoruz
    let channel = allah.Welcome.Channels.length <= index ? allah.Welcome.Channels[0] : allah.Welcome.Channels[index];
    
    if (channel) {
        let client = new ozi();

        client.login(token).catch(err => {
            console.error(`${index + 1}. Satırdaki Token Arızalı!`);
        });

        // ==========================================
        //             READY EVENTİ (TEK)
        // ==========================================
        client.on('ready', async () => {
            console.log(`[BOT AKTİF] ${client.user.tag}`);
            
            // Bot Durumunu Başlatma
            let activities = allah.BotDurum || ["Welcome Bot"], i = 0;
            client.user.setActivity({ name: `${activities[0]}`, type: ActivityType.Listening });
            client.user.setStatus("idle");

            setInterval(() => {
                client.user.setActivity({ name: `${activities[i++ % activities.length]}`, type: ActivityType.Listening });
            }, 30000); // 10 saniye çok hızlıdır, Discord API limiti yememek için 30 saniyeye çekildi.

            // Güvenli Ses Kanalı Bağlantısı (Sonsuz setInterval yığılması engellendi)
            const connectToChannel = async () => {
                let guild = client.guilds.cache.get(allah.GuildID);
                if (!guild) return console.log(`[${client.user.username}] Sunucu bulunamadı!`);
                let Channel = guild.channels.cache.get(channel);
                if (!Channel) return console.log(`[${client.user.username}] Kanal bulunamadı!`);

                try {
                    client.voiceConnection = joinVoiceChannel({
                        channelId: Channel.id,
                        guildId: Channel.guild.id,
                        adapterCreator: Channel.guild.voiceAdapterCreator,
                        group: client.user.id
                    });

                    // Yetkili/Ses kontrolü yapıp ses oynatıcısını tetikleme
                    if (!Channel.hasStaff()) {
                        client.staffJoined = false;
                        await client._start(channel);
                    } else {
                        client.staffJoined = true;
                        client.playing = false;
                        await client._start(channel);
                    }
                } catch (error) {
                    console.error("Ses kanalına bağlanırken hata oluştu:", error);
                }
            };

            // İlk açılışta bağlan
            await connectToChannel();

            // Her 15 saniyede bir bağlantı kopmuşsa veya düşmüşse tekrar bağla (Yığılma önlendi)
            setInterval(async () => {
                const connection = getVoiceConnection(allah.GuildID, client.user.id);
                if (!connection) {
                    await connectToChannel();
                }
            }, 15000);

            // ==========================================
            //       CRON JOB - CUMA GÜNÜ KONTROLÜ
            // ==========================================
            // Her dakika çalışıp PM2'yi çökertmemesi için: Her gün gece 00:01'de sadece 1 kez kontrol eder.
            cron.schedule('1 0 * * *', async () => {
                let xd = "./src/sesler/cuma.mp3";
                let xd2 = "./src/sesler/hosgeldin.mp3";
                const data = await Database.findOne({ guildID: allah.GuildID });
                const day = new Date().getDay(); // 5 = Cuma

                if (day === 5) {
                    if (data && data.SesMod === xd) return;
                    await Database.findOneAndUpdate({ guildID: allah.GuildID }, { SesMod: xd }, { upsert: true });
                    console.log(`Bugün Cuma: Ses Modu Cuma olarak ayarlandı. Bot yeniden başlatılıyor...`);
                    setTimeout(() => children.exec(`pm2 restart ${allah.GuildName}_Welcomes`), 2000);
                } else {
                    if (data && data.SesMod === xd2) return;
                    await Database.findOneAndUpdate({ guildID: allah.GuildID }, { SesMod: xd2 }, { upsert: true });
                    console.log(`Cuma Bitti: Ses Modu Hoş geldin olarak ayarlandı. Bot yeniden başlatılıyor...`);
                    setTimeout(() => children.exec(`pm2 restart ${allah.GuildName}_Welcomes`), 2000);
                }
            });
        });

        // ==========================================
        //         VOICE STATE UPDATE EVENTİ (TEK)
        // ==========================================
        client.on('voiceStateUpdate', async (oldState, newState) => {
            // 1. Durum: Bot kanaldan düşerse/atılırsa geri sokma mantığı
            if (oldState.member.id === client.user.id && oldState.channelId && !newState.channelId) {
                let guild = client.guilds.cache.get(allah.GuildID);
                if (!guild) return;
                let Channel = guild.channels.cache.get(channel);
                if (!Channel) return;

                client.voiceConnection = joinVoiceChannel({
                    channelId: Channel.id,
                    guildId: Channel.guild.id,
                    adapterCreator: Channel.guild.voiceAdapterCreator,
                    group: client.user.id
                });
                return;
            }

            // 2. Durum: Kanala bir yetkili girdiğinde müziği susturma
            if (
                newState.channelId && (oldState.channelId !== newState.channelId) &&
                newState.member.isStaff() &&
                newState.channelId === channel &&
                !newState.channel.hasStaff(newState.member)
            ) {
                client.staffJoined = true;
                if (client.player) client.player.stop();
                return;
            }

            // 3. Durum: Kanaldan son yetkili çıktığında müziği geri başlatma
            if (
                oldState.channelId && (oldState.channelId !== newState.channelId) &&
                newState.member.isStaff() &&
                oldState.channelId === channel &&
                !oldState.channel.hasStaff()
            ) {
                client.staffJoined = false;
                await client._start(channel);
                return;
            }
        });
    }
}