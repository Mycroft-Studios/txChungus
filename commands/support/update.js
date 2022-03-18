//Requires
const modulename = 'latest';
const { MessageEmbed } = require("discord.js");
const { emojify, pickRandom } = require("../../src/utils");
const { dir, log, logOk, logWarn, logError } = require("../../src/console")(modulename);

//Consts
const waitGifs = [
    'https://tenor.com/view/shaquille-o-neal-excited-shaking-cant-wait-gif-13783587',
    'https://tenor.com/view/soon-okay-real-soon-very-quickly-in-a-second-just-a-moment-gif-15029375',
    'https://tenor.com/view/daddys-home2-daddys-home2gifs-jon-lithgow-reunion-waiting-gif-9683398',
    'https://tenor.com/view/cat-driving-serious-cat-driving-hold-on-gif-16076083',
    'https://tenor.com/view/judge-judy-double-time-faster-hurry-gif-7566976',
    'https://tenor.com/view/mr-bean-checking-time-waiting-gif-11570520',
    'https://tenor.com/view/off-work-almost-sleepy-gif-13396687',
]


module.exports = {
    description: 'Send instructions for the latest FXserver + txAdmin.',
    aliases: ['u'],
    async execute(message, args, config) {
        //If mention
        let mentionString = '';
        if (message.mentions.users.size) {
            mentionString = message.mentions.users.map(x => `<@${x.id}>`).join(' ');
        }

        //If in the wrong channel
        const blacklistedChannels = [
            '600111300915494922', //sugestions and bugs channel
        ]
        if(blacklistedChannels.includes(message.channel.id)){
            await message.channel.send(`<@${message.author.id}> Did you even bother looking in which channel you are?`);
            await message.delete();
            return;
        }

        //Preparing the message
        if (GlobalData.txVersions.available) { 
            const isOutdatedMessage = !GlobalData.txVersions.isRecommended
                ? '**<a:alert:897525925950914600> The "latest recommended" is outdated, use the links below!**'
                : '';
            const updateMessage = new MessageEmbed({
                color: 0x69E0B9,
                title: `How to get txAdmin ${GlobalData.txVersions.latest}:`,
                description: `:point_right: You just need to update to artifact ${emojify(GlobalData.txVersions.fxsVersion)}
:point_right: You can just drag and drop to replace the files.
${isOutdatedMessage}
[<:windows:791692679419265044> Download Windows Artifact](${GlobalData.txVersions.fxsArtifacts.windows}).
[<:linux:780972840454979604> Download Linux Artifact](${GlobalData.txVersions.fxsArtifacts.linux}).
<:zap:823668080994811906> For ZAP Game Servers, make sure you select the "latest" version and then restart txAdmin.`,
                image: !GlobalData.txVersions.isRecommended && {
                    url: 'https://i.imgur.com/OMcCVIW.png'
                }
            });
            return message.channel.send({
                content: (mentionString) ? mentionString : undefined, 
                embeds: [updateMessage]
            });

        } else {
            const gifLink = pickRandom(waitGifs);
            const updateMessage = `${mentionString} The ${GlobalData.txVersions.latest} will be available today, stay tuned!\n${gifLink}`;
            return message.channel.send(updateMessage);
        }
    },
};
