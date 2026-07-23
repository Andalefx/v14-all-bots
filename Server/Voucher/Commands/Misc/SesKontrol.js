
const { red, green } = require("../../../../Global/Settings/Emoji.json");
const voice = require("../../../../Global/Databases/voiceInfo");
const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const moment = require("moment");
require("moment-duration-format");

module.exports = {
    Isim: "seskontrol",
    Komut: ["sesk", "n"],
    Kullanim: "seskontrol @acar/ID",
    Aciklama: "Belirlenen üyenin seste aktif veya haporleri ve kulaklığının açık veya kapalı olduğunu gösterir.",
    Kategori: "yönetim",
    Extend: true,
  /**
   * @param {Client} client 
   */
  onLoad: function (client) {
    client.on("voiceStateUpdate", async (oldState, newState) => {
      if ((oldState.member && oldState.member.user.bot) || (newState.member && newState.member.user.bot)) return;
      if (!oldState.channelId && newState.channelId) await joinedAt.findOneAndUpdate({ _id: newState.id }, { $set: { date: Date.now() } }, { upsert: true });
      let joinedAtData = await joinedAt.findOne({ _id: oldState.id });
      if (!joinedAtData) await joinedAt.findOneAndUpdate({ _id: oldState.id }, { $set: { date: Date.now() } }, { upsert: true });
      joinedAtData = await joinedAt.findOne({ _id: oldState.id });
      if (oldState.channelId && !newState.channelId) {
        await joinedAt.deleteOne({ _id: oldState.id });
      } else if (oldState.channelId && newState.channelId) {
        await joinedAt.findOneAndUpdate({ _id: oldState.id }, { $set: { date: Date.now() } }, { upsert: true });
      }
    })
  },
  /**
   * @param {Client} client 
   * @param {Message} message 
   * @param {Array<String>} args 
   * @param {Guild} guild
   */
  onRequest: async (client, message, args) => {
   
    const channel = message.guild.channels.cache.get(args[0]);
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.member;
    if (channel) {
      const data = await voice.find({}).sort({ date: -1 });
      const embed = new EmbedBuilder()
      message.reply({embeds: [embed.setDescription(`
\`${channel.name}\` adlı kanaldaki üyelerin ses bilgileri:

${channel.members.map((x) => `${x.toString()}: \`${data.find((u) => u.userID === x.user.id) ? moment.duration(Date.now() - data.find((u) => u.userID === x.user.id).date).format("H [saat], m [dakika], s [saniyedir]") : "Bulunamadı!"} seste.\``).join("\n")}
      `)]});
    } else {
      if (!member.voice.channel) return message.channel.send({ content:`${red} ${member.toString()} üyesi herhangi bir ses kanalında bulunmuyor!`});

      const data = await voice.findOne({ userID: member.user.id });
      message.react(green)
      let voiceChannel = member.voice.channel
      let mic = member.voice.selfMute ? `Kapalı!` : `Açık!`
    let kulak = member.voice.selfDeaf ? `Kapalı!` : `Açık!`
    let ekran =  member.voice.streaming ? `Açık!` : `Kapalı!`
    let kamera = member.voice.selfVideo ? `Açık!` : `Kapalı!`
    let limit = member.voice.channel.userLimit || "~";
const embedd = new EmbedBuilder()
      voiceChannel.createInvite().then(invite =>

message.reply({ embeds: [embedd.setDescription(`
${member}, isimli üye şuan da ${member.voice.channel} kanalında bulunuyor.
**Ses durumu**:
Mikrofon: \`${mic}\`
Kulaklık: \`${kulak}\`
Ekran: \`${ekran}\`
Kamera: \`${kamera}\`
Doluluk: \` ${member.voice.channel.members.size}/${limit} \`
Kanala gitmek için [tıklaman](https://discord.gg/${invite.code}) yeterli


**Ses kanalında bulunan üyeler**:
\`\`\`
${member.voice.channel.members.size <= 8 ? member.voice.channel.members.map(x => x.user.tag).join("\n") : `${member.voice.channel.members.array().slice(0, 8).map(x => x.user.tag).join("\n")} ve ${member.voice.channel.members.size - 8} kişi daha.`}
\`\`\`
`).setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) }).setFooter({ text: `${moment(Date.now()).format("LLL")}`})]}));

    }
  },
};