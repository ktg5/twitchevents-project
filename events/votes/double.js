const TwitchEvents = require(`../../modules/twitchevents`);


const inputsToDup = [
    'w',
    'a',
    's',
    'd',
    'space',
    '0',
    '1'
];
const delayAtEndInput = 250;
var dupKeyList = {};
var dupMouseList = {};
const inputIntCount = 10; // Keep this value as is probably lol
module.exports = {
    data: {
        name: "double",
        desc: "Double inputs",
        type: TwitchEvents.Types.VOTE
    },

    func: {
        onKeyPress(d) {
            if (d.synthetic) return;
            // Check if input is in inputsToDup list
            var isDupable = false;
            inputsToDup.forEach((input) => { if (d[0] === input.toUpperCase()) isDupable = true; });
            if (isDupable !== true) return;


            // Set in dupKeyList
            if (
                dupKeyList[d[0]]
                && dupKeyList[d[0]].timeout
            ) clearTimeout(dupKeyList[d[0]].timeout);
            dupKeyList[d[0]] = {
                keyCode: TwitchEvents.inputs.getKeyCodeByString(d[0]),
                heldFor: 0,
                int: setInterval(() => {
                    if (!item) return;

                    const item = dupKeyList[d[0]];
                    if (item) item.heldFor++;
                }, inputIntCount)
            }
        },

        onKeyRelease(d) {
            // Check if the input is in the list
            if (
                !dupKeyList[d[0]]
                || d.synthetic
            ) return;
            // Check if input is in inputsToDup list
            var isDupable = false;
            inputsToDup.forEach((input) => { if (d[0] === input.toUpperCase()) isDupable = true; });
            if (isDupable !== true) return;

            // Clear interval
            clearInterval(dupKeyList[d[0]].int);


            setTimeout(() => {
                // Check again if the input is in the list
                if (!dupKeyList[d[0]]) return;

                // Hold input
                TwitchEvents.inputs.holdKey(dupKeyList[d[0]].keyCode);

                // Then release the input for the time heldfor * inputIntCount
                dupKeyList[d[0]].timeout = setTimeout(() => {
                    TwitchEvents.inputs.releaseKey(dupKeyList[d[0]].keyCode);
                    delete dupKeyList[d[0]];
                }, dupKeyList[d[0]].heldFor * inputIntCount);
            }, delayAtEndInput);
        },


        onMousePress(d) {

        }
    },


    async enable(client) {
        TwitchEvents.inputs.on('keyPressed', this.func.onKeyPress);
        TwitchEvents.inputs.on('keyReleased', this.func.onKeyRelease);
        TwitchEvents.inputs.on('mousePressed', this.func.onKeyPress);
        TwitchEvents.inputs.on('mouseReleased', this.func.onKeyRelease);
    },

    async disable(client) {
        TwitchEvents.inputs.off('keyPressed', this.func.onKeyPress);
        TwitchEvents.inputs.off('keyReleased', this.func.onKeyRelease);
        TwitchEvents.inputs.off('mousePressed', this.func.onKeyPress);
        TwitchEvents.inputs.off('mouseReleased', this.func.onKeyRelease);
    }
}
