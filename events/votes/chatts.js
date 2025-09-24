const TwitchEvents = require(`../../modules/twitchevents`);


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
        this.func.msgToInput = (channel, tags, message) => { new TwitchEvents.Tts().say(`${tags['username']} said: ${message.toString()}`) };


        client.irc.on('message', this.func.msgToInput);
    },

    async disable(client) {
        client.irc.off('message', this.func.msgToInput);
    }
}
