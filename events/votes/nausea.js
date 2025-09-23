const TwitchEvents = require(`../../modules/twitchevents`);


var effectInterval;
module.exports = {
    data: {
        name: "nausea",
        desc: "Nausea, kinda",
        type: TwitchEvents.Types.VOTE
    },


    async enable(event) {
        const radius = 5
        let t = 0;
        effectInterval = setInterval(async () => {
            // Effect speed
            t += 0.01;

            // Position
            const x = radius * Math.sin(t);
            const y = radius * Math.sin(t) * Math.cos(t);

            // Set
            await TwitchEvents.inputs.moveMouse( new TwitchEvents.Point( x, y ), true );
        }, 10);
    },

    async disable(event) {
        clearInterval(effectInterval);
    }
}
