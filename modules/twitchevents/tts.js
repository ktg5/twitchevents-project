const { spawn } = require("child_process");
const { logger } = require('./logger');


class Tts {
    #proc;

    /**
     * Say a line using Windows' built-in `SpeechSynthesizer`
     * @param {number} speed - The multiplier to add to the speech speed (min: `-10`, max: `10`)
     */
    constructor(speed) {
        this.#proc = spawn("pwsh.exe", ["-NoProfile"]);
        this.speed = speed;
        this.queueId = 0;
        this.pending = new Map();

        // Init TTS
        this.#sendCommand(`$global:speak = New-Object System.Speech.Synthesis.SpeechSynthesizer`);
        if (this.speed) this.#sendCommand(`$global:speak.Rate = ${this.speed}`);


        // Error logs should probably be logged no matter the "debug" mode
        this.#proc.stderr.on("data", (data) => {
            logger.error("TwitchEvents.Tts.PS.Err:");
            console.log(data.toString());
        });
    }


    // Send commands to current instance
    #sendCommand(cmd) {
        if (this.#proc && !this.#proc.killed) this.#proc.stdin.write(`${cmd}\n`);
    }


    /**
     * @param {number} speed - The multiplier to add to the speech speed (min: `-10`, max: `10`)
     * @returns {boolean | null} - `null` if the PS process is killed
     */
    changeSpeed(speed) {
        if (!speed || typeof speed !== 'number') throw new Error(`TwitchEvents.Tts.changeSpeed: "speed" must be defined & be a "number".`);
        if (!this.#proc || this.#proc.killed) return null;

        this.speed = speed;
        this.#sendCommand(`$speak.Rate = ${this.speed}`);
        return true;
    }

    /**
     * @param {number} speed - The multiplier to add to the speech speed (min: `-10`, max: `10`)
     * @returns {void}
     */
    say(string) {
        if (!string || typeof string !== 'string') throw new Error(`TwitchEvents.Tts.say: "string" must be defined & be a "string".`);
        if (!this.#proc || this.#proc.killed) return null;
        
        return new Promise((resolve, reject) => {
            const id = this.queueId++;
            this.pending.set(id, resolve);

            // PowerShell script to speak async and write a unique marker when done
            const cmd = `$global:speak.Speak("${string
                .replaceAll(/"/g, '""')
                .replaceAll("$", " dollar ")
            }")`;
            this.#sendCommand(cmd);
        });
    }

    #handleForTts(data) {
        logger.info("TwitchEvents.Player.PS.Out:");
        console.log(data.toString());
    }


    kill() {
        if (this.#proc && !this.#proc.killed) {
            this.#sendCommand("exit");
            this.#proc.kill();
            return true;
        } else return false;
    }
}


module.exports = { Tts }
