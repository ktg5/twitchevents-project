const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');


class AdsManager {
    #proc;

    constructor() {
        const appPath = path.join(__dirname, 'initElectron'); // Your electron entry point

        this.#proc = spawn(electron, [appPath], { cwd: __dirname, stdio: 'ignore' });
        spawn("powershell", ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', `${__dirname}/tabInto.ps1`, '-pid', `${this.#proc.pid}`], { stdio: 'ignore' });
    }


    kill() {
        return this.#proc.kill();
    }
}


module.exports = { AdsManager };
