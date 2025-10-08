const TwitchEvents = require(`../../modules/twitchevents`);


const mouseMoveSpeed = 50;
const mouseMoveAmount = 30;
/**
 * @typedef {Object} KeyAction
 * @prop {string} type The type of action this key should do. `btn` for mouse buttons, `pos` for mouse movement
 * @prop {number | TwitchEvents.Point} value The value this action should use for specific type. `btn` uses numbers, `pos` uses `TwitchEvents.Point`s
 */
/**
 * @type {KeyAction[]}
 */
const keyActions = {
    "U": {
        type: 'btn',
        value: 0
    },
    "I": {
        type: 'pos',
        value: new TwitchEvents.Point(0, -mouseMoveAmount)
    },
    "O": {
        type: 'btn',
        value: 1
    },
    "J": {
        type: 'pos',
        value: new TwitchEvents.Point(-mouseMoveAmount, 0)
    },
    "K": {
        type: 'pos',
        value: new TwitchEvents.Point(0, mouseMoveAmount)
    },
    "L": {
        type: 'pos',
        value: new TwitchEvents.Point(mouseMoveAmount, 0)
    },
};
const activeKeyInts = {};
function isAction(action) {
    return action
    && action.type !== undefined
    && action.value !== undefined;
}

const nonoSfx = new TwitchEvents.Player('system', `${__dirname}../../../assets/sfx/nono.wav`);


module.exports = {
    data: {
        name: "keys-to-mouse",
        desc: "No mouse, just keyboard",
        type: TwitchEvents.Types.VOTE
    },

    func: {
        // Main functions for event
        keyHeld(d) {
            const action = keyActions[d[0]];
            if (isAction(action)) {
                switch (action.type) {
                    case 'btn':
                        // Just hold the mouse button
                        if (typeof action.value === 'number') TwitchEvents.inputs.holdMouse(action.value);
                    break;
                
                    case 'pos':
                        // Clear existing interval first (in case of repeat)
                        if (activeKeyInts[d[0]]) clearInterval(activeKeyInts[d[0]]);
                        // Do first move
                        TwitchEvents.inputs.moveMouse(action.value);
                        // Create new interval for movement
                        activeKeyInts[d[0]] = setInterval(() => TwitchEvents.inputs.moveMouse(action.value), mouseMoveSpeed);
                    break;
                }
            }
        },

        keyRelease(d) {
            const action = keyActions[d[0]];
            if (isAction(action)) {
                switch (action.type) {
                    case 'btn':
                        // Releaseeeeeee
                        TwitchEvents.inputs.releaseMouse(action.value);
                    break;

                    case 'pos':
                        // CLEAR THE FUCKIN THING
                        if (activeKeyInts[d[0]]) {
                            clearInterval(activeKeyInts[d[0]]);
                            delete activeKeyInts[d[0]];
                        }
                    break;
                }
            }
        },


        // Release any mouse keys pressed by user
        pressedMouseFunc(d) {
            console.log(d.synthetic);
            if (d.synthetic) return;
            TwitchEvents.inputs.releaseMouse(keyActions[d[0]].value);
        },

        // If the mouse moved, try to do something do make the user not move
        async movedMouseFunc(d) {
            if (d.synthetic) return;
            TwitchEvents.inputs.moveMouse(new TwitchEvents.Point( 300, 300 ));
            nonoSfx.play();
        }
    },


    async enable(client) {
        TwitchEvents.inputs.on('keyPressed', this.func.keyHeld);
        TwitchEvents.inputs.on('keyReleased', this.func.keyRelease);
        // TwitchEvents.inputs.on('mousePressed', this.func.pressedMouseFunc);
        TwitchEvents.inputs.on('mouseMoved', this.func.movedMouseFunc);
    },

    async disable(client) {
        TwitchEvents.inputs.off('keyPressed', this.func.keyHeld);
        TwitchEvents.inputs.off('keyReleased', this.func.keyRelease);
        TwitchEvents.inputs.off('mousePressed', this.func.pressedMouseFunc);
        TwitchEvents.inputs.off('mouseMoved', this.func.movedMouseFunc);
    }
}
