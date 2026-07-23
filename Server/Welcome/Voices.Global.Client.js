const { Client, VoiceChannel, GuildMember, PermissionFlagsBits, GatewayIntentBits, Partials } = require('discord.js');
const { createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus, joinVoiceChannel } = require('@discordjs/voice');
const play = require('play-dl');
const allah = require('./src/config.json');
const { Model } = require('mongoose');

class ozi extends Client {
    constructor() {
        // V14'te options doğrudan super içine bu şekilde dağıtılmalıdır.
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildIntegrations
            ],
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.User
            ]
        });

        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play,
            },
        });
        
        this.stream = null;
        this.message = null;
        this.channelId = null;
        this.playing = false;
        this.voiceConnection = null;
        this.staffJoined = false;
    
        // Event dinleyicileri
        this.on("guildUnavailable", async (guild) => { })
            .on("disconnect", () => {})
            .on("reconnecting", () => {})
            .on("error", (e) => console.error("Bot Hatası: ", e))
            .on("warn", (info) => console.warn("Bot Uyarısı: ", info));

        // Process Hata Yönetimleri
        process.on("unhandledRejection", (err) => { console.error("Yalın Hata: ", err) });
        process.on("warning", (warn) => { console.warn("Sistem Uyarısı: ", warn) });
        process.on("beforeExit", () => { console.log('Sistem kapatılıyor...'); });
        process.on("uncaughtException", err => {
            const hata = err.stack ? err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./") : err;
            console.error("Beklenmedik Hata: ", hata);
        });

        // V14 için EN ÖNEMLİ DÜZELTME: Player eventlerini constructor içinde bir kez tanımlıyoruz.
        // _start fonksiyonu içinde her seferinde .on() eklemek bellek sızıntısı (memory leak) yapar.
        this.player.on(AudioPlayerStatus.Idle, async () => {
            if (this.staffJoined) return;    
            const Database = require("./WelcomeMode"); 
            const data = await Database.findOne({ guildID: allah.GuildID });
            let Mode = data && data.SesMod ? data.SesMod : "./src/sesler/hosgeldin.mp3";
            
            this.stream = createAudioResource(Mode);              
            this.player.play(this.stream);
        });

        this.player.on(AudioPlayerStatus.Playing, () => { this.playing = true; });
        this.player.on(AudioPlayerStatus.Paused, () => { this.playing = false; });
        this.player.on('error', error => { console.error('Audio Player Hatası:', error.message); });
    }

    async _start(channelId) {
        const Database = require("./WelcomeMode"); 

        let guild = this.guilds.cache.get(allah.GuildID);
        if(!guild) return;
        let channel = guild.channels.cache.get(channelId);
        if(!channel) return;

        const data = await Database.findOne({ guildID: allah.GuildID });
        let Mode = data && data.SesMod ? data.SesMod : "./src/sesler/hosgeldin.mp3";
    
        this.channelId = channelId;
        
        // Eğer ses bağlantısı yoksa veya koptuysa joinVoiceChannel ile bağlanmayı deneyin.
        if (!this.voiceConnection) {
            this.voiceConnection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfHide: true
            });
        }

        let connection = this.voiceConnection; 
        if(!connection) return;

        this.stream = createAudioResource(Mode); 
        
        if(this.staffJoined) return;
        
        this.player.play(this.stream);
        connection.subscribe(this.player);
    }
}

module.exports = { ozi };

// PROTOTYPE DÜZELTMELERİ (Cache kontrolleri güvenli hale getirildi)
VoiceChannel.prototype.hasStaff = function(checkMember = false) {
    const role = this.guild.roles.cache.get('1090742572495941672');
    if(!role) return false;
    return this.members.some(m => (checkMember !== false ? m.user.id !== checkMember.id : true) && !m.user.bot && m.roles.highest.position >= role.position);
}

VoiceChannel.prototype.getStaffs = function(checkMember = false) {
    const role = this.guild.roles.cache.get('1090742572495941672');
    if(!role) return 0;
    return this.members.filter(m => (checkMember !== false ? m.user.id !== checkMember.id : true) && !m.user.bot && m.roles.highest.position >= role.position).size;
}

GuildMember.prototype.isStaff = function() {
    if (this.user.bot) return false;
    
    // config'den gelen teyitçi rolünün varlığı kontrol ediliyor
    const teyitciRolID = allah.teyitciRolleri && allah.teyitciRolleri[0] ? allah.teyitciRolleri[0] : null;
    const teyitciRol = teyitciRolID ? this.guild.roles.cache.get(teyitciRolID) : null;
    
    return (
        this.permissions.has(PermissionFlagsBits.Administrator) ||
        (teyitciRol && this.roles.highest.position >= teyitciRol.position)
    );
}