const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');


class AdsManager {
    #proc;

    constructor() {
        const appPath = path.join(__dirname, 'initElectron');

        this.#proc = spawn(electron, [appPath], { cwd: __dirname, detached: true, stdio: 'ignore' });
        this.#proc.unref();

        this.#tabToProc();
    }


    #tabToProc(attempt = 0) {
        // 
        const ps = spawn('powershell.exe', [
            '-NoProfile',
            '-Command',
            `
            $p = Get-Process -Id ${this.#proc.pid} -ErrorAction SilentlyContinue
            if ($p -and $p.MainWindowHandle -ne 0) { Write-Output $p.MainWindowHandle } else { Write-Output 0 }
            `
        ]);
    
        let data = '';
        ps.stdout.on('data', chunk => data += chunk);
    
        ps.on('exit', () => {
            const hwnd = parseInt(data.trim());
            if (hwnd && hwnd !== 0) this.#focusWindow();
            else if (attempt < 10) setTimeout(() => this.#tabToProc(attempt + 1), 100);
        });
    }

    #focusWindow() {
        spawn('powershell.exe', [
            '-NoProfile',
            '-Command',
            `
            $sig = '
                [DllImport("user32.dll")] public static extern bool SetForegroundWindow(int hWnd);
                [DllImport("user32.dll")] public static extern bool ShowWindowAsync(int hWnd, int nCmdShow);
            '
            Add-Type -MemberDefinition $sig -Name WinAPI -Namespace Utils
    
            $p = Get-Process -Id ${this.#proc.pid}
            $hwnd = $p.MainWindowHandle
    
            [Utils.WinAPI]::ShowWindowAsync($hwnd, 3) | Out-Null  # 3 = SW_MAXIMIZE
            [Utils.WinAPI]::SetForegroundWindow($hwnd)
            `
        ]);
    }


    kill() {
        return this.#proc.kill();
    }
}


module.exports = { AdsManager };
