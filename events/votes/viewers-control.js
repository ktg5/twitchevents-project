const TwitchEvents = require(`../../modules/twitchevents`);


const holdKeyTime = 500;
module.exports = {
    data: {
        name: "viewers-control",
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
            if (d.synthetic) return;
            TwitchEvents.inputs.moveMouse(new TwitchEvents.Point( 300, 300 ));
        }
    },



    async enable(client) {
        /**
         * Custom function that holds a key for the `holdKeyTime`
         * @param {TwitchEvents.inputs.Keys} key 
         */
        function pressKey(key) {
            TwitchEvents.inputs.holdKey(key);
            setTimeout(() => {
                TwitchEvents.inputs.releaseKey(key);
            }, holdKeyTime);
        }

        /**
         * Custom function that holds a mouse button for the `holdKeyTime`
         * @param {number} button
         */
        function holdMouseBtn(button) {
            TwitchEvents.inputs.holdMouse(button);
            setTimeout(() => {
                TwitchEvents.inputs.releaseMouse(button);
            }, holdKeyTime);
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

                // Handle mouse movement
                case 'mu':
                    TwitchEvents.inputs.moveMouse(new TwitchEvents.Point( 0, -100 ));
                break;
                case 'md':
                    TwitchEvents.inputs.moveMouse(new TwitchEvents.Point( 0, 100 ));
                break;
                case 'ml':
                    TwitchEvents.inputs.moveMouse(new TwitchEvents.Point( -100, 0 ));
                break;
                case 'mr':
                    TwitchEvents.inputs.moveMouse(new TwitchEvents.Point( 100, 0 ));
                break;

                // Handle mouse click
                case 'l':
                    if (args[1] == 'h') holdMouseBtn(0);
                    else TwitchEvents.inputs.clickMouse(0);
                break;
                case 'r':
                    if (args[1] == 'h') holdMouseBtn(1);
                    else TwitchEvents.inputs.clickMouse(1);
                break;
                case 'm':
                    if (args[1] == 'h') holdMouseBtn(2);
                    else TwitchEvents.inputs.clickMouse(2);
                break;
            }
        }

        client.irc.on('message', this.func.msgToInput);
        TwitchEvents.inputs.on('keyPressed', this.func.pressedFunc);
        TwitchEvents.inputs.on('mousePressed', this.func.pressedMouseFunc);
        TwitchEvents.inputs.on('mouseMoved', this.func.movedMouseFunc);
    },

    async disable(client) {
        client.irc.removeListener('message', this.func.msgToInput);
        TwitchEvents.inputs.off('keyPressed', this.func.pressedFunc);
        TwitchEvents.inputs.off('mousePressed', this.func.pressedMouseFunc);
        TwitchEvents.inputs.off('mouseMoved', this.func.movedMouseFunc);
    }
}
