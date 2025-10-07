/**
 * This is used for both `votes/ads.js` & `events/ad.js`
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');


let win;
function createWindow() {
    // Init
    win = new BrowserWindow({
        width: 1270,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        },
        fullscreen: false,
        frame: false,
        resizable: false,
        alwaysOnTop: false,
    });

    // Settings
    win.loadFile('index.html');

    // Events
    win.on('minimize', (e) => e.preventDefault());
    win.on('close', (e) => {
        if (!app.isQuitting) e.preventDefault();
    });
    win.once('ready-to-show', () => {
        win.show();
        win.focus();
    });
}
app.whenReady().then(createWindow);


// Extra ipc listener for focusing
ipcMain.on('proc-focus', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();

    win.show();
    win.focus();

    win.setAlwaysOnTop(true, 'screen-saver');
    win.setFullScreen(true);
});


// Quit Electron when video ends
ipcMain.on('video-ended', () => {
    console.log('Video ended, quitting Electron...');
    app.isQuitting = true;
    win.close();
    app.quit();
});
