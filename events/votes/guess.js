const TwitchEvents = require(`../../modules/twitchevents`);
const path = require('path');


const phrases = [
    "i'm going to put oil on your mom",
    "twitchevents",
    "hi silly streamer",
    "sixty nine",
    "get that ass banned",
    "please speed i need this",
    "fish mcbites",
    "it don't go down",
    "that's a lot of damage",
    "i like ya cut g",
    "fried bugs",
    "PUSSY ROCKET",
    "i got a boner",
    "goodnight girl, i'll see ya tomorrow",
    "don't stop running little reddit",
    "Sorry I Can Not Folfill This Request",
    "my name is jeff",
    "why are you running?",
    "road work ahead? i sure hope it does",
    "darksydephil",
    "don't stop running little reddit",
    "joe rogan",
    "dude... fuck, yes.",
    "i am fucked up"
];
var lastPhrase = "";

const startSfx = new TwitchEvents.Player('system', path.join(__dirname, '../../', 'assets/sfx/guess/start.wav'));
const wrongSfx = new TwitchEvents.Player('system', path.join(__dirname, '../../', 'assets/sfx/guess/buzzer.wav'));
const solvedSfx = new TwitchEvents.Player('system', path.join(__dirname, '../../', 'assets/sfx/guess/solved.wav'));

var countdownInt;
const secsTilEnd = 39.5;


module.exports = {
    data: {
        name: "guess",
        desc: "Guess the phrase → close the game!",
        type: TwitchEvents.Types.VOTE
    },

    func: {},


    async enable(client) {
        // Get random phrase
        var selectedPhrase = await genPhrase();
        function genPhrase() {
            return new Promise((resolve, reject) => {
                let out = phrases[Math.floor(Math.random() * phrases.length)];
                if (lastPhrase == out) resolve(genPhrase());
                else resolve(out);
            });
        }
        lastPhrase = selectedPhrase;

        countdownInt = setInterval(() => {
            clearInterval(countdownInt);
            console.log('chat failed to guess, disabling...');
            client.web.sendEmit('guess-end');
            this.disable(client);
            setTimeout(() => {
                client.web.sendEmit('guess-hide');
            }, 5000);
        }, secsTilEnd * 1000);

        // Start le guessin'!
        client.web.sendEmit('guess-start', { phrase: selectedPhrase, time: secsTilEnd });
        console.log("selectedPhrase: ", selectedPhrase);
        startSfx.play();


        /**
         * @param {import("tmi.js").ChatUserstate} tags
         */
        this.func.onMsg = (channel, tags, message) => {
            if (message.toLowerCase() == selectedPhrase) {
                client.web.sendEmit('guess-correct');
                clearInterval(countdownInt);
                solvedSfx.play();
                // Disable event
                console.log('guessed! disabling now...');
                this.disable(client);

                // Wait a bit then do stuff
                setTimeout(() => {
                    // Do stuff
                    TwitchEvents.inputs.typeKey(TwitchEvents.inputs.Keys.F4, TwitchEvents.inputs.Keys.LeftAlt);


                    setTimeout(() => {
                        client.web.sendEmit('guess-hide');
                    }, 3000);
                }, 2000);
            } else wrongSfx.play();
        }

        client.irc.on('message', this.func.onMsg);
    },

    async disable(client) {
        client.irc.off('message', this.func.onMsg);
    }
}
