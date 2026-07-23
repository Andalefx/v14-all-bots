const { AttachmentBuilder, ActivityType, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

// Yardımcı fonksiyonlar (Değişmedi)
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

module.exports = {
    Isim: "spotify",
    Komut: ["spo", "spotify"],
    Kullanim: "spotify <@andale/ID>",
    Aciklama: "Belirtilen üyenin profil resmini büyültür.",
    Kategori: "diğer",
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
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;

        if (!member.presence) {
            return message.reply({ content: `**${member.user.tag}** şu anda herhangi bir aktivite bilgisi (presence) paylaşmıyor.` });
        }

        const spotifyActivity = member.presence.activities.find(
            activity => activity.name === 'Spotify' && activity.type === ActivityType.Listening
        );

        if (!spotifyActivity) {
            return message.reply({ content: `**${member.user.tag}** şu anda Spotify dinlemiyor.` });
        }
        
        // --- Spotify Verilerini Çekme ve URL'yi Tanımlama ---
        const trackName = spotifyActivity.details || 'Bilinmiyor'; 
        const artist = spotifyActivity.state || 'Bilinmiyor';
        const imageId = spotifyActivity.assets?.largeImage;
        const albumArtURL = imageId ? `https://i.scdn.co/image/${imageId.slice(8)}` : null; 
        
        // setURL hatasını önlemek için yedek URL tanımlanır.
        const trackURL = spotifyActivity.url || 'https://open.spotify.com/'; 
        
        // Süre hesaplamaları
        let currentTimeFormatted = '0:00'; 
        let totalTimeFormatted = '0:00';   
        let progressPercentage = 0;

        const startTime = spotifyActivity.timestamps?.start;
        const endTime = spotifyActivity.timestamps?.end;
        if (startTime && endTime) {
            const currentMs = Date.now() - startTime.getTime();
            const totalMs = endTime.getTime() - startTime.getTime();
            
            currentTimeFormatted = formatTime(Math.floor(currentMs / 1000));
            totalTimeFormatted = formatTime(Math.floor(totalMs / 1000));
            progressPercentage = Math.min(100, (currentMs / totalMs) * 100);
        }

        // --- CANVAS ÇİZİM AYARLARI VE BAŞLATMA ---
        const W = 600;      
        const H = 200;      
        const P = 15;       
        const TEXT_P_TOP = 12;
        const ART_SIZE = 120; 
        const BAR_H = 6;
        const SPACING = 10; 

        // --- RENKLER (SABİT ARKA PLAN, RANDOM VURGU) ---
        // BG_COLOR kaldırıldı (ÇİZİM ŞEFFAF)
        const DARKER_BG_COLOR = '#24222a'; // İç blokların arka planı
        const TEXT_COLOR_LIGHT = '#b9bbbe'; 
        const SP_BAR_HANDLE = '#f2f2f2'; 
        
        // Şarkı adı ve İlerleme Çubuğu için RASTGELE VURGU RENGİ
        const ACCENT_COLOR_RANDOM = getRandomColor(); 

        // --- KONUM HESAPLAMALARI ---
        
        // 1. Bilgi Bloğu
        const INFO_BLOCK_H = 75;
        const INFO_BLOCK_W = W - (P * 3) - ART_SIZE;
        const INFO_BLOCK_X = P;
        const INFO_BLOCK_Y = P;

        // 2. İlerleme Çubuğu Bloğu
        const BAR_BLOCK_H = 40;
        const BAR_BLOCK_W = INFO_BLOCK_W;
        const BAR_BLOCK_X = P;
        const BAR_BLOCK_Y = INFO_BLOCK_Y + INFO_BLOCK_H + SPACING;

        // 3. Albüm Kapağı Bloğu 
        const ART_BLOCK_X = W - P - ART_SIZE;
        const ART_BLOCK_Y = P; 
        const ART_BLOCK_H = INFO_BLOCK_H + SPACING + BAR_BLOCK_H; 
        
        // İç Eleman Konumları
        const barY = BAR_BLOCK_Y + 15; 
        const barWidth = BAR_BLOCK_W - P;
        const filledWidth = (barWidth * progressPercentage) / 100;
        
        // Kanvası Başlat
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        
        // *** DÜZELTME: En arkadaki ana arkaplan çizimi kaldırıldı ***
        // ctx.fillStyle = BG_COLOR;
        // roundRect(ctx, 0, 0, W, H, 8); 

        // 2. İç Blokların Çizimi (DARKER_BG_COLOR)
        ctx.fillStyle = DARKER_BG_COLOR;
        const BLOCK_RADIUS = 8;

        // A. Bilgi Bloğu (Sol Üst)
        roundRect(ctx, INFO_BLOCK_X, INFO_BLOCK_Y, INFO_BLOCK_W, INFO_BLOCK_H, BLOCK_RADIUS);

        // B. İlerleme Çubuğu Bloğu (Sol Alt)
        roundRect(ctx, BAR_BLOCK_X, BAR_BLOCK_Y, BAR_BLOCK_W, BAR_BLOCK_H, BLOCK_RADIUS);

        // C. Albüm Kapağı Bloğu (Sağ)
        roundRect(ctx, ART_BLOCK_X, ART_BLOCK_Y, ART_SIZE, ART_BLOCK_H, BLOCK_RADIUS);


        // --- YAZILAR VE ÇUBUKLAR ---

        // Üst Bilgi Kısmı (Kartın en üstüne eklendi)
    

        // Şarkı ve Sanatçı Bilgileri (Bilgi Bloğu İçinde)
        const textStartX = INFO_BLOCK_X + P / 2;
        const textStartY = INFO_BLOCK_Y + P;

        ctx.font = 'bold 30px Arial'; 
        ctx.fillStyle = ACCENT_COLOR_RANDOM; 
        ctx.fillText(trackName.toUpperCase(), textStartX, textStartY + 25); 

        ctx.font = '16px Arial';
        ctx.fillStyle = TEXT_COLOR_LIGHT;
        ctx.fillText(artist, textStartX, textStartY + 45); 

        // İlerleme Çubuğu (Çubuk Bloğu İçinde)
        const barStartX = BAR_BLOCK_X + P / 2; 

        // Çubuk Arkaplanı
        const barRadius = 3;
        ctx.fillStyle = '#1e1e1e'; 
        roundRect(ctx, barStartX, barY, barWidth, BAR_H, barRadius); 

        // Çubuk Dolu Kısım
        ctx.fillStyle = ACCENT_COLOR_RANDOM; 
        roundRect(ctx, barStartX, barY, filledWidth, BAR_H, barRadius);
        
        // Çubuk Kolu (Handle)
        const handleX = barStartX + filledWidth;
        const handleRadius = 6;
        ctx.fillStyle = SP_BAR_HANDLE; 
        ctx.beginPath();
        ctx.arc(handleX, barY + BAR_H / 2, handleRadius, 0, Math.PI * 2, true);
        ctx.fill();

        // Süre Metinleri (Çubuk Bloğu İçinde)
        ctx.font = '12px Arial';
        ctx.fillStyle = TEXT_COLOR_LIGHT;
        ctx.textAlign = 'left';
        ctx.fillText(currentTimeFormatted, barStartX, barY + BAR_H + 15);

        ctx.textAlign = 'right';
        ctx.fillText(totalTimeFormatted, barStartX + barWidth, barY + BAR_H + 15);
        ctx.textAlign = 'left'; 

        // --- ALBÜM KAPAĞINI YÜKLEME VE ÇİZME (Albüm Bloğu İçinde) ---

        const artDrawX = ART_BLOCK_X + (ART_SIZE - ART_SIZE) / 2; 
        const artDrawY = ART_BLOCK_Y + (ART_BLOCK_H - ART_SIZE) / 2; 

        if (albumArtURL) {
            try {
                const albumImage = await loadImage(albumArtURL);

                ctx.save(); 
                ctx.beginPath();
                roundRect(ctx, artDrawX, artDrawY, ART_SIZE, ART_SIZE, BLOCK_RADIUS);
                ctx.clip(); 

                ctx.drawImage(albumImage, artDrawX, artDrawY, ART_SIZE, ART_SIZE);

                ctx.restore(); 

            } catch (error) {
                console.error('Albüm kapağı yüklenirken hata oluştu:', error);
                
                // Hata durumunda sadece siyah kare çizilir
                ctx.fillStyle = '#000000'; 
                roundRect(ctx, artDrawX, artDrawY, ART_SIZE, ART_SIZE, BLOCK_RADIUS);
            }
        } else {
            // URL yoksa varsayılan siyah kare çizilir
            ctx.fillStyle = '#000000';
            roundRect(ctx, artDrawX, artDrawY, ART_SIZE, ART_SIZE, BLOCK_RADIUS);
        }
        
        // --- GÖRSELİ DİSCORD'A GÖNDERME (SADECE GERÇEK BUTON İLE) ---
        
        // Kanvasın şeffaf arkaplanı ayarlamak için toBuffer'dan önce kullanılır
        const buffer = canvas.toBuffer('image/png'); 
        const attachment = new AttachmentBuilder(buffer, { name: 'spotify-card.png' });
        
        // Discord Link Butonu Oluşturma
        const spotifyButton = new ButtonBuilder()
            .setLabel("Spotify'da Dinle")
            .setStyle(ButtonStyle.Link)
            .setURL(trackURL); 

        const row = new ActionRowBuilder().addComponents(spotifyButton);

        await message.channel.send({ 
            files: [attachment],
            components: [row] 
        });
    },
};