const TwitchEvents = require(`../../modules/twitchevents`);


module.exports = {
    data: {
        name: "180",
        type: TwitchEvents.Types.REDEEM,
        reward: "Turn some!"
    },


    async enable(client) {
        // Set new muose position
        await TwitchEvents.inputs.moveMouse( new TwitchEvents.Point( 3500, 0 ), true );
    },
}
