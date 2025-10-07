const TwitchEvents = require(`../../modules/twitchevents`);


/**
 * @type {TwitchEvents.Tts[]}
 */
const ttsProcesses = [];
const delayMSPerTTS = 1500;
var lastRanTTS = new Date();
module.exports = {
    data: {
        name: "chatts",
        desc: "Chat-to-Speech",
        type: TwitchEvents.Types.VOTE
    },

    func: {},


    async enable(client) {
        /**
         * @param {import("tmi.js").ChatUserstate} tags
         */
        this.func.msgToInput = async (channel, tags, message) => {
            message = message.toString();
            // If the last ran tts message was less than delayMSPerTTS, don't run
            if ((new Date() - lastRanTTS) < delayMSPerTTS) return;

            // Check if messages is a nono
            if (
                message.startsWith('!') // Chat commands for bots
                || message.includes('://') // Links
            ) return;

            // Say tts message & add process
            var ttsSpeed = Math.round(Math.random() * 10);
            if (ttsSpeed < 1) ttsSpeed = 1;
            console.log('ttsSpeed', ttsSpeed);
            const ttsProc = new TwitchEvents.Tts(ttsSpeed);
            ttsProc.say(`${tags['username']} said: ${message}`);
            ttsProcesses.push(ttsProc);
            lastRanTTS = new Date();
        };

        // Listener
        client.irc.on('message', this.func.msgToInput);
    },

    async disable(client) {
        client.irc.off('message', this.func.msgToInput);
        // Kill all tts process
        ttsProcesses.forEach((proc) => proc.kill());
    }
}
