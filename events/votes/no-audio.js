const TwitchEvents = require(`../../modules/twitchevents`);
const { spawn } = require("child_process");


var mutedInt;
module.exports = {
    data: {
        name: "no-audio",
        desc: "Streamer no audio",
        type: TwitchEvents.Types.VOTE
    },


    async enable(client) {
        muteStreamer();
        mutedInt = setInterval(() => {
            muteStreamer();
        }, 30000);

        function muteStreamer() {
            const proc = spawn("pwsh.exe", ["-NoProfile", '-Command', `
& "${__dirname}\\lib\\nircmd.exe" mutesysvolume 1
            `]);
        }
    },

    async disable(client) {
        clearInterval(mutedInt);
        mutedInt = null;
        spawn("pwsh.exe", ["-NoProfile", '-Command', `
& "${__dirname}\\lib\\nircmd.exe" mutesysvolume 0
        `]);
    }
}
