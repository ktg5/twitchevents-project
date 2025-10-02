const TwitchEvents = require(`../../modules/twitchevents`);
const { AdsManager } = require('../../adsmanager');


module.exports = {
    data: {
        name: "ad",
        reward: "Streamer watch ad!",
        type: TwitchEvents.Types.REDEEM
    },


    async enable(client) {
        new AdsManager();
    }
}
