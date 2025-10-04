const TwitchEvents = require(`../../modules/twitchevents`);


module.exports = {
    data: {
        name: "invert-mouse",
        desc: "Invert mouse",
        type: TwitchEvents.Types.VOTE
    },

    func: {},


    async enable(client) {
        new TwitchEvents.Tts().say('streamer invert your stupid mouse');
    },

    async disable(client) {
        new TwitchEvents.Tts().say('streamer you may return to normal mouse usage');
    }
}
