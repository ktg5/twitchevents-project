const TwitchEvents = require(`../../modules/twitchevents`);


const phrases = [
    "i'm going to put oil on your mom",
    "twitchevents",
    "burger",
    "hi silly streamer"
];


module.exports = {
    data: {
        name: "guess",
        desc: "Guess the phrase → freak computer out",
        type: TwitchEvents.Types.VOTE
    },

    func: {},


    async enable(client) {
        
    },

    async disable(client) {
        
    }
}
