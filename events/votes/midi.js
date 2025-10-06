const TwitchEvents = require(`../../modules/twitchevents`);
const fs = require('fs');


const sfxFolder = `${__dirname}../../../assets/sfx/midi`;
const minSpeedPitch = 0.75;
const maxSpeedPitch = 3;
const dontEffectList = [ 'scream.mp3' ];
var selectedAudio;
module.exports = {
    data: {
        name: "midi",
        desc: "MIDI Keyboard",
        type: TwitchEvents.Types.VOTE
    },

    func: {
        // Watch for keybaord inputs & mouse inputs
        onInput(d) {
            // Play sound at random speed & pitch (both follow eachother)
            var speedPitch = Math.random() * 3;
            if (speedPitch < minSpeedPitch) speedPitch = minSpeedPitch;
            if (speedPitch > maxSpeedPitch) speedPitch = maxSpeedPitch;

            // Check to see if current audio is in the dontEffectList
            var dontEffect = false;
            dontEffectList.forEach((sfx) => { if (sfx === selectedAudio) dontEffect = true; });
            new TwitchEvents.Player('ff', `${sfxFolder}/${selectedAudio}`, dontEffect ? undefined : { speed: speedPitch, pitch: speedPitch });
        }
    },


    async enable(client) {
        const sfxs = fs.readdirSync(sfxFolder);
        // Select random sfx to use as midi
        selectedAudio = sfxs[Math.round(Math.random() * sfxs.length - 1)];
        if (selectedAudio === undefined) selectedAudio = sfxs[0];
        console.log('selectedAudio: ', selectedAudio);
        // Enable actual function
        TwitchEvents.inputs.on('keyPressed', this.func.onInput);
        TwitchEvents.inputs.on('mousePressed', this.func.onInput);
    },

    async disable(client) {
        selectedAudio = undefined;
        TwitchEvents.inputs.off('keyPressed', this.func.onInput);
        TwitchEvents.inputs.off('mousePressed', this.func.onInput);
    }
}
