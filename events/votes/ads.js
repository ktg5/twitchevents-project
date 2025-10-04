const TwitchEvents = require(`../../modules/twitchevents`);
const { AdsManager } = require('../modules/adsmanager');


const timeBeforeNew = 30; // seconds
var adsInit;
module.exports = {
    data: {
        name: "ads",
        desc: "Streamer has to watch ads",
        type: TwitchEvents.Types.VOTE
    },

    func: {},


    async enable(client) {
        new AdsManager();
        adsInit = setInterval(() => {
            new AdsManager();
        }, timeBeforeNew * 1000);
    },

    async disable(client) {
        clearInterval(adsInit);
    }
}
