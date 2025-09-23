const TwitchEvents = require(`../../modules/twitchevents`);


module.exports = {
    data: {
        name: "hold-w",
        desc: "Holding only W's",
        type: TwitchEvents.Types.VOTE
    },


    func: {
        pressedFunc(d) {
            // console.log('p: ', d);
            if (d.synthetic) return;
            if (
                d[0] == 'A'
                || d[0] == 'D'
                || d[0] == 'S'
            ) {
                TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.A);
                TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.D);
                TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.S);
            }
        },
        releaseFunc(d) {
            // console.log('r: ', d);
            if (d.synthetic) return;
            if (d[0] == 'W') TwitchEvents.inputs.holdKey(TwitchEvents.inputs.Keys.W);
        }
    },


    async enable(client) {
        TwitchEvents.inputs.holdKey(TwitchEvents.inputs.Keys.W);
        TwitchEvents.inputs.on('keyPressed', this.func.pressedFunc);
        TwitchEvents.inputs.on('keyReleased', this.func.releaseFunc);
    },

    async disable(client) {
        TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.W);
        TwitchEvents.inputs.off('keyPressed', this.func.pressedFunc);
        TwitchEvents.inputs.off('keyReleased', this.func.releaseFunc);
    }
}
