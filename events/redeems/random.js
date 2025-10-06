const TwitchEvents = require(`../../modules/twitchevents`);


const percent = 5;
const audioClip1 = new TwitchEvents.Player('system', `${__dirname}../../../assets/sfx/mousetrap-1.wav`);
const audioClip2 = new TwitchEvents.Player('system', `${__dirname}../../../assets/sfx/mousetrap-2.wav`);
module.exports = {
    data: {
        name: "random",
        reward: "TE :: random chance",
        type: TwitchEvents.Types.REDEEM
    },


    async enable(client) {
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
                const spamMouse = setInterval(() => TwitchEvents.inputs.clickMouse(), 100);
                const spinMouse = setInterval(() => TwitchEvents.inputs.moveMouse( new TwitchEvents.Point(-50, -50) ), 1);
                setTimeout(() => {
                    clearInterval(spamMouse);
                    clearInterval(spinMouse);
                }, 2000);

                audioClip2.play();
            }, 500);
        }
    },
}
