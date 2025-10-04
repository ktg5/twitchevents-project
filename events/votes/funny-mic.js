const TwitchEvents = require(`../../modules/twitchevents`);


module.exports = {
    data: {
        name: "funny-mic",
        desc: "Funny mic",
        type: TwitchEvents.Types.VOTE
    },

    func: {},


    async enable(client) {
        new TwitchEvents.Tts().say('streamer turn on your funny mic');
    },

    async disable(client) {
        new TwitchEvents.Tts().say('streamer say fuck you to funny mic');
    }
}
