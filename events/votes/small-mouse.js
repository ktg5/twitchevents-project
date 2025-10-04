const TwitchEvents = require(`../../modules/twitchevents`);


module.exports = {
    data: {
        name: "small-mouse",
        desc: "Small mouse",
        type: TwitchEvents.Types.VOTE
    },

    func: {},


    async enable(client) {
        new TwitchEvents.Tts().say('streamer enable the small mouse');
    },

    async disable(client) {
        new TwitchEvents.Tts().say('streamer enable the fuck you mouse');
    }
}
