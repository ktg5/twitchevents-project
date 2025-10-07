const TwitchEvents = require(`../../modules/twitchevents`);


var shakeInterval;
var isLmbDown = false;

var countedShake = 0;
var lastShake = { x: 0, y: 0, dx: 0, dy: 0 };


module.exports = {
    data: {
        name: "shake",
        desc: "Shake while shooting",
        type: TwitchEvents.Types.VOTE
    },


    func: {
        async startShake() {
            if (shakeInterval) return;
            const mousePos = await TwitchEvents.inputs.getMousePos();
        
            shakeInterval = setInterval(async () => {
                // The amount of times the mouse has shakededed
                countedShake++;
                // Position to add to mouse
                const dx = (Math.random() - .5) * (15 * countedShake);
                const dy = (Math.random() - .5) * (15 * countedShake);
                lastShake.dx = dx;
                lastShake.dy = dy;
                // Added + current
                const newX = mousePos.x + dx;
                const newY = mousePos.y + dy;
                lastShake.x = newX;
                lastShake.y = newY;
        
                // Set new muose position
                await TwitchEvents.inputs.moveMouse(new TwitchEvents.Point( dx, dy ), true);
                // await TwitchEvents.inputs.moveMouse( new TwitchEvents.Point( newX, newY ) );
            }, 15);
        },

        async stopShake() {
            if (shakeInterval) {
                // Stop shaking!!!!!
                clearInterval(shakeInterval);
                shakeInterval = null;
                countedShake = 0;
        
                // Set mouse back to non-shaked position
                // Get non-shaked position
                const nonShakedPos = { x: lastShake.x - lastShake.dx, y: lastShake.y - lastShake.dy };
                // Set mouse position
                await TwitchEvents.inputs.setMouse(new TwitchEvents.Point( nonShakedPos.x, nonShakedPos.y ));
            }
        },
    },


    async enable(client) {
        this.func.onPressed = (d) => {
            console.log(d);
            if (
                d[0] == '1'
                || d[0] == '2'
            ) {
                isLmbDown = true;
                setTimeout(() => {
                    if (isLmbDown) this.func.startShake();
                }, 250);
            }
        }
        this.func.onRelease = (d) => {
            if (
                (
                    d[0] == '1'
                    || d[0] == '2'
                )
                && isLmbDown
            ) {
                isLmbDown = false;
                this.func.stopShake();
            }
        }


        // Mouse event listeners
        TwitchEvents.inputs.on('mousePressed', this.func.onPressed);
        TwitchEvents.inputs.on('mouseReleased', this.func.onRelease);
    },

    async disable(client) {
        clearInterval(shakeInterval);
        shakeInterval = null;
        TwitchEvents.inputs.off('mousePressed', this.func.onPressed);
        TwitchEvents.inputs.off('mouseReleased', this.func.onRelease);
    }
}
