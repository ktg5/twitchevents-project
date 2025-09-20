const TwitchEvents = require(`../../modules/twitchevents`);


var shakeInterval;
var isLmbDown = false;


var countedShake = 0;
var lastShake = { x: 0, y: 0, dx: 0, dy: 0 };
async function startShake() {
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
        await TwitchEvents.inputs.moveMouse( new TwitchEvents.Point( dx, dy ), true );
        // await TwitchEvents.inputs.moveMouse( new TwitchEvents.Point( newX, newY ) );
    }, 15);
}

async function stopShake() {
    if (shakeInterval) {
        // Stop shaking!!!!!
        clearInterval(shakeInterval);
        shakeInterval = null;
        countedShake = 0;

        // Set mouse back to non-shaked position
        // Get non-shaked position
        const nonShakedPos = { x: lastShake.x - lastShake.dx, y: lastShake.y - lastShake.dy };
        // Set mouse position
        await TwitchEvents.inputs.setMouse( nonShakedPos.x, nonShakedPos.y );
    }
}


function onPressed(d) {
    if (d[0] == "1") {
        isLmbDown = true;
        setTimeout(() => {
            if (isLmbDown) startShake();
        }, 250);
    }
}

function onRelease(d) {
    if (
        d[0] == "1"
        && isLmbDown
    ) {
        isLmbDown = false;
        stopShake();
    }
}


module.exports = {
    data: {
        name: "shake",
        desc: "Shake while shooting",
        type: TwitchEvents.Types.VOTE
    },


    async enable(event) {
        // Mouse event listeners
        TwitchEvents.inputs.on('mousePressed', onPressed);
        TwitchEvents.inputs.on('mouseReleased', onRelease);
    },


    async disable(event) {
        clearInterval(shakeInterval);
        shakeInterval = null;
        TwitchEvents.inputs.off('mousePressed', onPressed);
        TwitchEvents.inputs.off('mouseReleased', onRelease);
    }
}
