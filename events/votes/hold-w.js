const TwitchEvents = require(`../../modules/twitchevents`);


function pressedFunc(d) {
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
}

function releaseFunc(d) {
    // console.log('r: ', d);
    if (d.synthetic) return;
    if (d[0] == 'W') TwitchEvents.inputs.holdKey(TwitchEvents.inputs.Keys.W);
}


module.exports = {
    data: {
        name: "hold-w",
        desc: "Holding only W's",
        type: TwitchEvents.Types.VOTE
    },


    async enable(event) {
        TwitchEvents.inputs.holdKey(TwitchEvents.inputs.Keys.W);
        TwitchEvents.inputs.on('keyPressed', pressedFunc);
        TwitchEvents.inputs.on('keyReleased', releaseFunc);
    },


    async disable(event) {
        TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.W);
        TwitchEvents.inputs.off('keyPressed', pressedFunc);
        TwitchEvents.inputs.off('keyReleased', releaseFunc);
    }
}
