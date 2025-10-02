const path = require('path');
const { spawn, exec } = require("child_process");
const { logger } = require('./logger');
const fs = require('fs');
const wav = require('node-wav');


/**
 * @typedef {"system" | "ff"} PlayerType
 */

/**
 * @typedef {Object} PlayerOptions
 * @prop {debug} [debug] - If the Player instance should show debug messages
 * @prop {number} [pitch] - (Only for Player.type `ff`) Change the pitch of the audio
 * @prop {number} [speed] - (Only for Player.type `ff`) Change the speed of the audio
 */


class Player {
    #proc;

    /**
     * Plays sound using the `System.Media.SoundPlayer` PowerShell object
     *
     * This--of course--creates a PowerShell instance within the Node isntance
     * @param {PlayerType} type - Can be either `system` for system audio engine (can be loaded before playing + play & pause functions), or `ff` for ffplay aka ffmpeg (has to be autoplayed, but can be customized)
     * @param {string} filePath - Path to file
     * @param {PlayerOptions} [options] - Displays all lines written by the PowerShell instance
     */
    constructor(type, filePath, options) {
        this.filePath = path.resolve(filePath);
        this.id = this.#generateId();
        /**
         * @type {PlayerType}
         */
        this.type = type;
        
        // Make sure sound is a wav
        if (path.extname(filePath) !== '.wav') throw new Error('TwitchEvents.Player: You must provide a .WAV file! No need to make it a big file either, change the quailty or somethin\'. And don\'t just change the god damn file extension!!!');
        // Then get it's data
        this.duration = this.#getWavData();

    
        switch (type) {
            case 'system':
                if (
                    options
                    && (
                        options.pitch
                        || options.speed
                    )
                ) logger.warn(`TwitchEvents.Player: The vars, "pitch" & "speed" in "options" can be only used in the "ff" player type.`);

                // Spawn le PowerShell process
                this.#proc = spawn("pwsh.exe", ["-NoProfile"]);

                // Log everything from the process if enabled
                if (options && options.debug === true) this.#proc.stdout.on("data", (data) => {
                    logger.info("TwitchEvents.Player.proc.Out:");
                    console.log(data.toString());
                });
                // Error logs should probably be logged no matter the "debug" mode
                this.#proc.stderr.on("data", (data) => {
                    logger.error("TwitchEvents.Player.proc.Err:");
                    console.log(data.toString());
                });
            
                // Initialize SoundPlayer in the PowerShell session
                this.#sendCommand(`$global:twitchevents_player_${this.id} = New-Object System.Media.SoundPlayer "${this.filePath}"`);
            break;

            case 'ff':
                // Spawn le PowerShell process
                this.#proc = exec(`ffplay "${this.filePath}" -nodisp -autoexit -af "rubberband=tempo=${options && options.speed ? Number(options.speed) : 1}:pitch=${options && options.pitch ? Number(options.pitch) : 1}:pitchq=quality"`);
                

                // Log everything from the process if enabled
                if (options && options.debug === true) this.#proc.stdout.on("data", (data) => {
                    logger.info("TwitchEvents.Player.proc.Out:");
                    console.log(data.toString());
                });
            break;
        }
    }


    #generateId(length = 22) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < length; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }


    #getWavData() {
        const fileBuffer = fs.readFileSync(this.filePath);
        const wavDecode = wav.decode(fileBuffer);
        return wavDecode.channelData[0].length / wavDecode.sampleRate;
    }
    

    // Send commands to current instance
    #sendCommand(cmd) {
        if (this.#proc && !this.#proc.killed) this.#proc.stdin.write(`${cmd}\n`);
    }
    

    play(sync = false) {
        if (this.type == 'ff') return null;
        if (!this.#proc || this.#proc.killed) return null;
        const method = sync ? "PlaySync" : "Play";
        this.#sendCommand(`$global:twitchevents_player_${this.id}.${method}()`);
        return true;
    }
    
    stop() {
        if (this.type == 'ff') return this.kill();
        if (!this.#proc || this.#proc.killed) return null;
        this.#sendCommand(`$global:twitchevents_player_${this.id}.Stop()`);
        return true;
    }
    

    kill() {
        if (this.#proc && !this.#proc.killed) {
            if (this.type == 'system') this.#sendCommand("exit");
            this.#proc.kill();
            return true;
        } else return false;
    }
}


module.exports = { Player };
