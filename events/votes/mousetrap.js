const TwitchEvents = require(`../../modules/twitchevents`);


const percent = 10;
const audioClip1 = new TwitchEvents.Player('system', `${__dirname}../../../assets/sfx/mousetrap-1.wav`);
const audioClip2 = new TwitchEvents.Player('system', `${__dirname}../../../assets/sfx/mousetrap-2.wav`);
module.exports = {
    data: {
        name: "mousetrap",
        desc: "Mousetraps everywhere...",
        type: TwitchEvents.Types.VOTE
    },


    func: {
        mouseTrapFunc(d) {
            if (
                d[0] !== "W"
                && d[0] !== "A"
                && d[0] !== "S"
                && d[0] !== "D"
            ) return;
            
            // Get percentage to then go off of
            const random = Math.random() * 100;
            if (random < percent) {
                // TOM HITS THE GOD DAMN MOUSETRAP OH SHIT
                // Release all movement keys
                TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.W);
                TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.A);
                TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.S);
                TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.D);
                // Play mousetrap sound
                audioClip1.play();

                // SCREAM!!!!!!!
                setTimeout(() => {
                    TwitchEvents.inputs.holdMouse(0);
                    const spinMouse = setInterval(() => { TwitchEvents.inputs.moveMouse( new TwitchEvents.Point(-50, -50) ); }, 1);
                    setTimeout(() => {
                        TwitchEvents.inputs.releaseMouse(0);
                        clearInterval(spinMouse);
                    }, 2000);

                    audioClip2.play();
                }, 500);
            }
        }
    },


    async enable(client) {
        TwitchEvents.inputs.on('keyPressed', this.func.mouseTrapFunc);
    },

    async disable(client) {
        TwitchEvents.inputs.off('keyPressed', this.func.mouseTrapFunc);
    }
}
