//Requires
const fs = require('fs-extra');
const fsp = require('fs/promises');
const path = require("path");
const { Client, Intents, Collection, MessageEmbed} = require("discord.js");
const Cron = require("./cron.js");
const chokidar = require('chokidar');

const { dir, log, logOk, logWarn, logError } = require('./console')();
const commandsFolderPath = 'commands';
const eventsFolderPath = 'events';

//NOTE: this shouldn't be a thing, but it is. Deal with it (:
global.GlobalData = {
    profile: null,
    commands: new Collection(),
    cmdStats: {},
    tempRoles: null,
    malwareStrings: null,
    txVersions: null,
    fxserverVersions: {}
}
//NOTE: this REALLY shouldn't be a thing, but i really don't cate
global.GlobalActions = {
    tempRoleAdd: null,
    tempRoleRemove: null,
}

/**
 * txChungus bot class
 */
module.exports = class txChungus {
    constructor(config, profile) {
        this.config = config;
        GlobalData.profile = profile;
        this.client = null;
        this.guild = null;
        this.announceChannel = null;
        this.helloChannel = null;
        this.statsFile = `./data/stats_${GlobalData.profile}.json`;
        this.tempRolesFile = `./data/tempRoles_${GlobalData.profile}.json`;
        this.malwareStringsFile = `./data/malwareStrings_${GlobalData.profile}.txt`; //this is also in !blacklist, its 4am and idc
        this.txVersionsFile = `./data/txAdminVersions.json`;
        this.recentInfectedWarnings = []; //id of the users that were spreading malware, cleared every 5 mins

        log('Starting...');
        this.setupData();
        this.setupCommands();
        this.setupWatchers();
        this.startBot();
        this.cron = new Cron(this);
    }


    //================================================================
    async loadTxVersionsFile () {
        try {
            const file = await fs.readFile(this.txVersionsFile, 'utf8');
            const parsed = JSON.parse(file);
            if(typeof parsed.latest !== 'string') throw new Error(`invalid file contents`);
            // latest, available, fxsVersion, fxsArtifacts, history
            GlobalData.txVersions = parsed;
            log(`Reloaded txAdmin versions. Latest is ${parsed.latest}`);
        } catch (error) {
            logError('Failed to load txAdminVersions file!');
            dir(error);
            return false;
        }
    }


    //================================================================
    async setupData (malwareStringsOnly=false) {
        if(!this.loadTxVersionsFile()) process.exit(1);

        try {
            //FIXME: create a separate load func just like tx versions
            //Malware Strings
            const malwareStringsRaw = await fs.readFile(this.malwareStringsFile, 'utf8')
                .catch(() => { 
                    fs.writeFile(this.malwareStringsFile, ``); 
                    return [];
                });
            if (!malwareStringsRaw.length) {
                GlobalData.malwareStrings = [];
                logOk(`Malware Strings reset.`);
            } else {
                const malwareStrings = malwareStringsRaw
                    .split('\n')
                    .map(x => x.toLowerCase().trim())
                    .filter(x => x.length);
                GlobalData.malwareStrings = Array.from(new Set(malwareStrings)).sort();
                logOk(`${GlobalData.malwareStrings.length} Malware Strings loaded.`);
            }
            if(malwareStringsOnly) return;

            

            //Statistics
            const statsJson = await fs.readFile(this.statsFile, 'utf8')
                .catch(() => { 
                    fs.writeFile(this.statsFile, `[]`); 
                    return [];
                });
            if (!statsJson.length) {
                GlobalData.cmdStats = {};
                logOk(`Usage reset`);
            } else {
                GlobalData.cmdStats = JSON.parse(statsJson);
                logOk(`Loaded usage stats`);
            }

            //Temporary Roles
            const tempRolesJson = await fs.readFile(this.tempRolesFile, 'utf8')
                .catch(() => { 
                    fs.writeFile(this.tempRolesFile, `[]`); 
                    return [];
                });
            if (!tempRolesJson.length) {
                GlobalData.tempRoles = [];
                logOk(`Temporary roles reset.`);
            } else {
                GlobalData.tempRoles = JSON.parse(tempRolesJson);
                logOk(`${GlobalData.tempRoles.length} Temporary roles loaded.`);
            }
        } catch (error) {
            logError(`Failed to load data with error: ${error.message}`);
            if(!malwareStringsOnly) process.exit(1);
        }
    }


    //================================================================
    async setupCommands () {
        //File commands
        const folders = await fsp.readdir(commandsFolderPath);
        for (let folderIndex = 0; folderIndex < folders.length; folderIndex++) {
            const folderName = folders[folderIndex];
            const folderPath = path.join(commandsFolderPath, folderName);
            const folderStat = await fsp.lstat(folderPath);
            if(!folderStat.isDirectory()) continue;

            const cmdFiles = await fsp.readdir(folderPath);
            for (let fileIndex = 0; fileIndex < cmdFiles.length; fileIndex++) {
                const fileName = cmdFiles[fileIndex];
                await this.setCommand(fileName, folderName);
                logOk(`Registered command: ${fileName}`);
            }
        }

        //Why is this crap here???
        GlobalActions.tempRoleAdd = async (role, id, expire, reason = null) => {
            if(GlobalData.tempRoles === null) return;
            if(!Object.keys(this.config.tempRoles).includes(role)) throw new Error(`role not found`);

            let member;
            try {
                member = await this.guild.members.fetch(id);
                if(member){
                    await member.roles.add(this.config.tempRoles[role]);
                }
            } catch (error) {
                if(error.code === 10007){ //"Unknown Member"
                    // logWarn(`Member ${id} already left the guild.`);
                }else{
                    throw error;
                }
            }
            
            //This will overwrite the previous temp role for this user/role pair
            GlobalData.tempRoles = GlobalData.tempRoles.filter(t => !(t.id === id && t.role === role));
            GlobalData.tempRoles.push({role, id, expire, reason});
            fs.writeFile(this.tempRolesFile, JSON.stringify(GlobalData.tempRoles, null, 2));
            return member;
        }
        GlobalActions.tempRoleRemove = async (role, id) => {
            if(GlobalData.tempRoles === null) return;
            if(!Object.keys(this.config.tempRoles).includes(role)) throw new Error(`role not found`);

            let member;
            try {
                member = await this.guild.members.fetch(id);
                if(member){
                    await member.roles.remove(this.config.tempRoles[role]);
                }
            } catch (error) {
                if(error.code === 10007){ //"Unknown Member"
                    // logWarn(`Member ${id} already left the guild.`);
                }else{
                    throw error;
                }
            }

            GlobalData.tempRoles = GlobalData.tempRoles.filter(t => !(t.id === id && t.role === role));
            fs.writeFile(this.tempRolesFile, JSON.stringify(GlobalData.tempRoles, null, 2));
            return member;
        }
    }

    //================================================================
    async setCommand (file, category) {
        const filePath = path.resolve(commandsFolderPath, category, file);
        const fileInfo = path.parse(file);

        if (fileInfo.ext == '.js') {
            const command = require(filePath);
            command.category = category;
            delete require.cache[require.resolve(filePath)];
            GlobalData.commands.set(fileInfo.name, command);

        } else if (fileInfo.ext == '.txt') {
            const rawFile = fs.readFileSync(filePath, 'utf8');

            const messageLines = [];
            const aliases = [];
            const files = [];
            rawFile.split('\n').forEach(line => {
                if(line.startsWith('#alias')){
                    const alias = line.substring('#alias '.length).trim();
                    return aliases.push(alias);
                }else if(line.startsWith('#file')){
                    const file = line.substring('#file '.length).trim();
                    return files.push(file);
                }else{
                    messageLines.push(line)
                }
            });
            
            const command = {
                category,
                static: true,
                description: `Static reply for ${this.config.prefix}${fileInfo.name}`,
                aliases: aliases || [],
                async execute (message, args, config) {
                    const mentionString = message.mentions.users.map(x => `<@${x.id}>`).join(' ');
                    const msgWithMention = (mentionString)? [mentionString, ...messageLines] : messageLines;
                    return message.channel.send({
                        content: msgWithMention.join('\n'),
                        files
                    });
                },
            };
            GlobalData.commands.set(fileInfo.name, command);

        } else {
            return logError(`Unknown format: ${file}`);
        }
    }

    //================================================================

    /* Watch commands folder & banned strings file */
    //FIXME: https://www.npmjs.com/package/debounce
    async setupWatchers () {
        const cmdWatcher = chokidar.watch(commandsFolderPath, { persistent: true })
        cmdWatcher.on('change', file => {
            const parsedPath = path.parse(file);
            const cmdName = parsedPath.base;
            const cmdCategory = parsedPath.dir.replace(commandsFolderPath + path.sep, '');
            this.setCommand(cmdName, cmdCategory);
            logOk(`Refreshed command: ${cmdName}`);
        });

        const malwareStringsWatcher = chokidar.watch(this.malwareStringsFile, { persistent: true })
        malwareStringsWatcher.on('change', file => {
            this.setupData(true);
            logOk(`File ${file} has changed, refreshing blacklist!`);
        });

        const txVersionsWatcher = chokidar.watch(this.txVersionsFile, { persistent: true })
        txVersionsWatcher.on('change', file => {
            this.loadTxVersionsFile();
            logOk(`File ${file} has changed, refreshing versions!`);
        });
    }


    //================================================================
    async startBot () {
        //Setup client
        this.client = new Client({
            autoReconnect: true,
            allowedMentions: { parse: ['users'], repliedUser: true },
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_BANS,
                // Intents.FLAGS.GUILD_INVITES,
                Intents.FLAGS.GUILD_VOICE_STATES,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
            ],
            partials: ['CHANNEL']
        });

        //Setup event listeners
        this.client.on('ready', async () => {
            logOk(`Started and logged in as '${this.client.user.tag}'`);
            this.client.user.setActivity('you guys', { type: 'WATCHING' });
            this.guild = await this.client.guilds.resolve(this.config.guild);
            if (!this.guild) {
                logError(`Guild not found: ${this.config.guild}`);
            }
            this.helloChannel = await this.client.channels.resolve(this.config.channels.hello.channel);
            if (!this.helloChannel) {
                logError(`Self Help channel not found: ${this.config.channels.hello.channel}`);
            }
            this.announceChannel = await this.client.channels.resolve(this.config.channels.general);
            if (!this.announceChannel) {
                logError(`Announcements channel not found: ${this.config.channels.general}`);
            }
            const outMsg = new MessageEmbed({
                color: 0x4287F5,
                description: `Hello, apparently I was dead for a sec, but now it's all fine... right?!`,
            });
            this.sendAnnouncement({embeds: [outMsg]});
            this.setupEvents();
        });

        this.client.on('error', (error) => {
            logError(error.message);
        });
        this.client.on('resume', (error) => {
            logOk('Connection with Discord API server resumed');
        });


        //Start bot
        try {
            await this.client.login(this.config.token);
        } catch (error) {
            logError(error.message);
            process.exit();
        }
    }

    //================================================================

    async setupEvents () {
        const eventFiles = fs.readdirSync(eventsFolderPath);

        eventFiles.forEach(file => {
            const filePath = path.resolve(eventsFolderPath, file);
            const fileInfo = path.parse(file);

            if (fileInfo.ext == '.js') {
                const event = require(filePath);
                // If someone is scrubbing their head because of the this mess in .bind take a look here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Parameters
                // The first argument in .bind represents the this from the callback function this.client.on returns and the other parameters are just additional params that don't have the same this scope as the first parameters
                this.client.on(fileInfo.name, event.execute.bind(this))
            } else {
                return logError(`Unknown format: ${file}`);
            }

            logOk(`Registered event: ${file}`);
        });
    }


    //================================================================
    async sendAnnouncement (message) {
        if (
            !this.config.channels.general ||
            !this.client ||
            this.client.ws.status ||
            !this.announceChannel
        ) {
            logWarn(`returning false, not ready yet`, 'sendAnnouncement');
            return false;
        }

        try {
            this.announceChannel.send(message);
        } catch (error) {
            logError(`Error sending Discord announcement: ${error.message}`);
        }
    }//Final sendAnnouncement()


    //================================================================
    async addUsageStats (cmd) {
        GlobalData.cmdStats[cmd] = (typeof GlobalData.cmdStats[cmd] == 'undefined') ? 1 : GlobalData.cmdStats[cmd] + 1;
        try {
            const sortedStats = Object.fromEntries(
                Object.entries(GlobalData.cmdStats).sort((a,b) => b[1] - a[1])    
            )
            const rawJson = JSON.stringify(sortedStats, null, 2);
            await fs.writeFile(`./data/stats_${GlobalData.profile}.json`, rawJson, 'utf8');
        } catch (error) {
            logError(`Failed to save stats file with error: ${error.message}`);
        }
    }//Final addUsageStats()

} //Fim txChungus()
