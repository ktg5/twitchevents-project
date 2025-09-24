const TwitchEvents = require(`./modules/twitchevents`);
const config = require('./config.json');


// Init my code lol
const client = new TwitchEvents.Client({
    port: config.webPort
});
client.watch(config);


client.on('init', async () => {
    client.addEvents([
        `${__dirname}/events/redeems`,
        `${__dirname}/events/votes`
    ]);

    setTimeout(() => {
        // new TwitchEvents.Tts().say('I used to be crazy once. I was in a room. A room full of CHATTERS. And that makes me lose my shit.');
    }, 1000);
});


module.exports = { client };
