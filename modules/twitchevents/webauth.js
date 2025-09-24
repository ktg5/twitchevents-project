const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { logger } = require('./logger');
const fs = require('fs');


var app, server, io;
/**
 * @returns {Promise<{ app: Express, server: http.Server, io: socketIo.Server }>}
 */
async function webAuth(port = 0, htmlPath = "") {
    // Check if this current session has already made a web
    if (
        app
        || server
        || io
    ) throw new Error('TwitchEvents Event Web: You can only make one TwitchEvents website per node instance!');
    fs.readdirSync(htmlPath);


    return new Promise(async (resolve, reject) => {
        // Make the server
        app = express();
        server = http.createServer(app);
        io = socketIo(server);

        // Modules to be used on web
        app.use('/modules/socket.io', express.static(`${__dirname}/../../node_modules/socket.io`));
        app.use('/modules/load-html', express.static(`${__dirname}/../../node_modules/load-html`));
        app.use('/modules/howler', express.static(`${__dirname}/../../node_modules/howler`));
        app.use(express.json());
        app.set('trust proxy', true);

        // Put da page on there!!!!!!!
        app.use(express.static(`${htmlPath}`, {
            extensions: 'html'
        }));

        // Start the server
        server.listen(port, () => {
            logger.info(`TwitchEvents Event Web: Running on http://localhost:${port}`);
            resolve({ app, server, io });
        });


        // IO requests
        io.on('connection', (socket) => {
            // logger.info(`TwitchEvents Event Web: New client: ${socket.id}`);
        });
    })
}


module.exports = { webAuth };