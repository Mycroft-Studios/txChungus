//Requires
const modulename = 'test';
const fs = require('fs/promises');
const { MessageEmbed } = require("discord.js");
const humanizeDuration = require('humanize-duration');
const { dir, log, logOk, logWarn, logError } = require('../lib/console')(modulename);
const { doesMessageContains } = require("../lib/utils");



module.exports = {
    rateLimit: false,
    description: 'Prints an awesome tx rainbow',
    aliases: ["tx"],
    async execute (message, args, config) {
        message.channel.send(`<:tx1:885933871047258203> <:tx2:885933870887886889> <:tx3:885933871118569524> <:tx4:885933871168880670> <:tx5:885933871097597972> <:tx6:885933871059845230> <:tx7:885933871101788170>
<:tx2:885933870887886889> <:tx3:885933871118569524> <:tx4:885933871168880670> <:tx5:885933871097597972> <:tx6:885933871059845230> <:tx7:885933871101788170> <:tx1:885933871047258203>
<:tx3:885933871118569524> <:tx4:885933871168880670> <:tx5:885933871097597972> <:tx6:885933871059845230> <:tx7:885933871101788170> <:tx1:885933871047258203> <:tx2:885933870887886889>
<:tx4:885933871168880670> <:tx5:885933871097597972> <:tx6:885933871059845230> <:tx7:885933871101788170> <:tx1:885933871047258203> <:tx2:885933870887886889> <:tx3:885933871118569524>
<:tx5:885933871097597972> <:tx6:885933871059845230> <:tx7:885933871101788170> <:tx1:885933871047258203> <:tx2:885933870887886889> <:tx3:885933871118569524> <:tx4:885933871168880670>
<:tx6:885933871059845230> <:tx7:885933871101788170> <:tx1:885933871047258203> <:tx2:885933870887886889> <:tx3:885933871118569524> <:tx4:885933871168880670> <:tx5:885933871097597972>
<:tx7:885933871101788170> <:tx1:885933871047258203> <:tx2:885933870887886889> <:tx3:885933871118569524> <:tx4:885933871168880670> <:tx5:885933871097597972> <:tx6:885933871059845230>`)
    },
};

/*

const thingy = ['tx1', 'tx2', 'tx3', 'tx4', 'tx5', 'tx6', 'tx7'];
for (let i = 0; i < thingy.length; i++) {
    console.log(thingy.map((x) => `:${x}:`).join(' '));
    thingy.push(thingy.shift());
}

:tx1: :tx2: :tx3: :tx4: :tx5: :tx6: :tx7:
:tx2: :tx3: :tx4: :tx5: :tx6: :tx7: :tx1:
:tx3: :tx4: :tx5: :tx6: :tx7: :tx1: :tx2:
:tx4: :tx5: :tx6: :tx7: :tx1: :tx2: :tx3:
:tx5: :tx6: :tx7: :tx1: :tx2: :tx3: :tx4:
:tx6: :tx7: :tx1: :tx2: :tx3: :tx4: :tx5:
:tx7: :tx1: :tx2: :tx3: :tx4: :tx5: :tx6:


\:tx1: \:tx2: \:tx3: \:tx4: \:tx5: \:tx6: \:tx7:
\:tx2: \:tx3: \:tx4: \:tx5: \:tx6: \:tx7: \:tx1:
\:tx3: \:tx4: \:tx5: \:tx6: \:tx7: \:tx1: \:tx2:
\:tx4: \:tx5: \:tx6: \:tx7: \:tx1: \:tx2: \:tx3:
\:tx5: \:tx6: \:tx7: \:tx1: \:tx2: \:tx3: \:tx4:
\:tx6: \:tx7: \:tx1: \:tx2: \:tx3: \:tx4: \:tx5:
\:tx7: \:tx1: \:tx2: \:tx3: \:tx4: \:tx5: \:tx6:



<:tx1:885933871047258203> <:tx2:885933870887886889> <:tx3:885933871118569524> <:tx4:885933871168880670> <:tx5:885933871097597972> <:tx6:885933871059845230> <:tx7:885933871101788170>
<:tx2:885933870887886889> <:tx3:885933871118569524> <:tx4:885933871168880670> <:tx5:885933871097597972> <:tx6:885933871059845230> <:tx7:885933871101788170> <:tx1:885933871047258203>
<:tx3:885933871118569524> <:tx4:885933871168880670> <:tx5:885933871097597972> <:tx6:885933871059845230> <:tx7:885933871101788170> <:tx1:885933871047258203> <:tx2:885933870887886889>
<:tx4:885933871168880670> <:tx5:885933871097597972> <:tx6:885933871059845230> <:tx7:885933871101788170> <:tx1:885933871047258203> <:tx2:885933870887886889> <:tx3:885933871118569524>
<:tx5:885933871097597972> <:tx6:885933871059845230> <:tx7:885933871101788170> <:tx1:885933871047258203> <:tx2:885933870887886889> <:tx3:885933871118569524> <:tx4:885933871168880670>
<:tx6:885933871059845230> <:tx7:885933871101788170> <:tx1:885933871047258203> <:tx2:885933870887886889> <:tx3:885933871118569524> <:tx4:885933871168880670> <:tx5:885933871097597972>
<:tx7:885933871101788170> <:tx1:885933871047258203> <:tx2:885933870887886889> <:tx3:885933871118569524> <:tx4:885933871168880670> <:tx5:885933871097597972> <:tx6:885933871059845230>
*/
