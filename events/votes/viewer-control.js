const TwitchEvents = require(`../../modules/twitchevents`);


const holdKeyTime = 1000;
const holdMouseTime = 1000;
var toggledKeys = {};

const mouseMove = 300;

const nonoSfx = new TwitchEvents.Player('system', `${__dirname}../../../assets/sfx/nono.wav`);
module.exports = {
    data: {
        name: "viewer-control",
        desc: "It's the viewers' turn!",
        type: TwitchEvents.Types.VOTE
    },


    func: {
        // Release any keyboard keys pressed by user
        pressedFunc(d) {
            // console.log('p: ', d);
            if (d.synthetic) return;
            if (
                d[0] == 'W'
                || d[0] == 'A'
                || d[0] == 'S'
                || d[0] == 'D'
            ) {
                TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.W);
                TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.A);
                TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.S);
                TwitchEvents.inputs.releaseKey(TwitchEvents.inputs.Keys.D);
            }
        },

        // Release any mouse keys pressed by user
        pressedMouseFunc(d) {
            if (d.synthetic) return;
            TwitchEvents.inputs.releaseMouse(Number(d[0]));
        },

        // If the mouse moved, try to do something do make the user not move
        async movedMouseFunc(d) {
            // console.log('movedMouseFunc:', d);
            if (d.synthetic) return;
            TwitchEvents.inputs.moveMouse(new TwitchEvents.Point( 300, 300 ));
            nonoSfx.play();
        }
    },



    async enable(client) {
        function pressKey(key) {
            TwitchEvents.inputs.holdKey(key);
            client.web.sendEmit('viewer_c-press', { key: key });
            setTimeout(() => {
                TwitchEvents.inputs.releaseKey(key);
                client.web.sendEmit('viewer_c-release', { key: key });
            }, holdKeyTime);
        }

        function toggleKey(key) {
            // If key is already toggled, release it
            if (toggledKeys[key]) {
                delete toggledKeys[key];
                TwitchEvents.inputs.releaseKey(key);
                client.web.sendEmit('viewer_c-release', { key: key });
                console.log(toggledKeys);
            // Else hold it
            } else {
                TwitchEvents.inputs.holdKey(key);
                client.web.sendEmit('viewer_c-press', { key: key });
                toggledKeys[key] = key;
            }
        }


        function clickMouseBtn(button) {
            TwitchEvents.inputs.holdMouse(button);
            setTimeout(() => {
                TwitchEvents.inputs.releaseMouse(button);
            }, 15);
            client.web.sendEmit('viewer_c-release', { mouse: button })
        }

        function holdMouseBtn(button) {
            TwitchEvents.inputs.holdMouse(button);
            client.web.sendEmit('viewer_c-press', { mouse: button });
            setTimeout(() => {
                TwitchEvents.inputs.releaseMouse(button);
                client.web.sendEmit('viewer_c-release', { mouse: button });
            }, holdMouseTime);
        }


        // Function for turning messages into inputs
        this.func.msgToInput = (channel, tags, message) => {
            // Split message into args
            const args = message.split(' ');

            // console.log(args[0]);
            switch (args[0].toLowerCase()) {
                // Handle keys
                case 'w':
                    pressKey(TwitchEvents.inputs.Keys.W);
                break;
                case 'a':
                    pressKey(TwitchEvents.inputs.Keys.A);
                break;
                case 's':
                    pressKey(TwitchEvents.inputs.Keys.S);
                break;
                case 'd':
                    pressKey(TwitchEvents.inputs.Keys.D);
                break;
                case 'q':
                    pressKey(TwitchEvents.inputs.Keys.Q);
                break;
                case '1':
                    pressKey(TwitchEvents.inputs.Keys.Num1);
                break;
                case '2':
                    pressKey(TwitchEvents.inputs.Keys.Num2);
                break;
                case '3':
                    pressKey(TwitchEvents.inputs.Keys.Num3);
                break;
                case '4':
                    pressKey(TwitchEvents.inputs.Keys.Num4);
                break;

                // Keys to only be held
                case 'shift':
                    toggleKey(TwitchEvents.inputs.Keys.LeftShift);
                break;
                case 'c':
                    toggleKey(TwitchEvents.inputs.Keys.C);
                break;

                // Handle mouse movement
                case 'mu':
                    fullMove = handleFullMove(args);
                    TwitchEvents.inputs.moveMouse(new TwitchEvents.Point( 0, -fullMove ));
                    client.web.sendEmit('viewer_c-mmove', 'mu');
                break;
                case 'md':
                    fullMove = handleFullMove(args);
                    TwitchEvents.inputs.moveMouse(new TwitchEvents.Point( 0, fullMove ));
                    client.web.sendEmit('viewer_c-mmove', 'md');
                break;
                case 'ml':
                    fullMove = handleFullMove(args);
                    TwitchEvents.inputs.moveMouse(new TwitchEvents.Point( -fullMove, 0 ));
                    client.web.sendEmit('viewer_c-mmove', 'ml');
                break;
                case 'mr':
                    fullMove = handleFullMove(args);
                    TwitchEvents.inputs.moveMouse(new TwitchEvents.Point( fullMove, 0 ));
                    client.web.sendEmit('viewer_c-mmove', 'mr');
                break;

                // Handle mouse click
                case 'l':
                    if (args[1] == 'h') holdMouseBtn(0);
                    else clickMouseBtn(0);
                break;
                case 'r':
                    if (args[1] == 'h') holdMouseBtn(1);
                    else clickMouseBtn(1);
                break;
                case 'm':
                    if (args[1] == 'h') holdMouseBtn(2);
                    else clickMouseBtn(2);
                break;
            }


            function handleFullMove(args) {
                if (args[1] == "h") return fullMove = mouseMove * 3;
                else return fullMove = mouseMove;
            }
        }

        client.irc.on('message', this.func.msgToInput);
        client.web.sendEmit('viewer_c-on', null);
        TwitchEvents.inputs.on('keyPressed', this.func.pressedFunc);
        TwitchEvents.inputs.on('mousePressed', this.func.pressedMouseFunc);
        TwitchEvents.inputs.on('mouseMoved', this.func.movedMouseFunc);
    },

    async disable(client) {
        client.irc.removeListener('message', this.func.msgToInput);
        client.web.sendEmit('viewer_c-off', null);
        TwitchEvents.inputs.off('keyPressed', this.func.pressedFunc);
        TwitchEvents.inputs.off('mousePressed', this.func.pressedMouseFunc);
        TwitchEvents.inputs.off('mouseMoved', this.func.movedMouseFunc);
    }
}
