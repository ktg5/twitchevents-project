const TwitchEvents = require(`../../modules/twitchevents`);
const { AdsManager } = require('../modules/adsmanager');


module.exports = {
    data: {
        name: "ad",
        reward: "TE :: Streamer watch ad!",
        type: TwitchEvents.Types.REDEEM
    },


    async enable(client) {
        new AdsManager();
    }
}
