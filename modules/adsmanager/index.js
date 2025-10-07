const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');


class AdsManager {
    #proc;

    constructor() {
        const appPath = path.join(__dirname, 'initElectron');

        this.#proc = spawn(electron, [appPath], { cwd: __dirname, detached: true, stdio: 'ignore' });
        this.#proc.unref();
    }


    kill() {
        return this.#proc.kill();
    }
}


module.exports = { AdsManager };
