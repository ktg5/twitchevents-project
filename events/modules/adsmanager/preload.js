const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const videoEl = document.querySelector('#video video');
        const closeBtn = document.querySelector('#close-btn');
        if (!videoEl) throw new Error("Video element not found");


        const adsFolder = path.join(__dirname, 'ads');
        const files = fs.readdirSync(adsFolder)
            .map(f => path.join(adsFolder, f))
            .filter(f => /\.(mp4|webm|mov)$/i.test(f));

        if (files.length === 0) throw new Error("No video files found in ads folder");


        const randomFile = files[Math.floor(Math.random() * files.length)];


        const duration = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(randomFile, (err, metadata) => {
                if (err) return reject(err);
                resolve(metadata.format.duration);
            });
        });


        videoEl.src = `file:///${randomFile.replaceAll('\\', '/')}`;
        videoEl.autoplay = true;


        if (closeBtn) {
            closeBtn.removeAttribute('hide');
            if (duration >= 16) {
                let i = 0;
                closeBtn.querySelector('.text').innerHTML = `Skip this ad in 10 second(s)...`;
                videoEl.addEventListener('play', (e) => {
                    let skipCountdown = setInterval(() => {
                        i++;
                        console.log(i == 10);
                        if (i > 10) return clearInterval(skipCountdown);
                        if (i == 10) {
                            clearInterval(skipCountdown);
                            closeBtn.querySelector('.text').innerHTML = 'SKIP THIS SHIT!!!';
                            closeBtn.addEventListener('click', () => ipcRenderer.send('video-ended') );
                            closeBtn.setAttribute('click', '');
                        } else closeBtn.querySelector('.text').innerHTML = `Skip this ad in ${10 - i} second(s)...`;
                    }, 1000);
                });
            } else {
                closeBtn.querySelector('.text').innerHTML = 'Watch to skip';
            }
        }


        videoEl.addEventListener('ended', () => {
            ipcRenderer.send('video-ended');
        });

    } catch (err) {
        console.error('Preload error:', err);
        ipcRenderer.send('video-ended');
    }
});
