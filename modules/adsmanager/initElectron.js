/**
 * This is used for both `votes/ads.js` & `events/ad.js`
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1270,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        }
    });

    mainWindow.setFullScreen(true);
    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile('index.html');

    mainWindow.on('minimize', (e) => e.preventDefault());
    mainWindow.on('close', (e) => {
        if (!app.isQuitting) e.preventDefault();
    });
}

app.whenReady().then(createWindow);


// Quit Electron when video ends
ipcMain.on('video-ended', () => {
    console.log('Video ended, quitting Electron...');
    app.isQuitting = true;
    mainWindow.close();
    app.quit();
});
