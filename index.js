const TwitchEvents = require(`./modules/twitchevents`);
const config = require('./config.json');


// Init my code lol
const client = new TwitchEvents.Client({
    port: config.webPort
});
client.watch({
    user: config.user,
    poll: config.poll
});


client.on('init', () => {
    client.addEvents([
        `${__dirname}/events/redeems`,
        `${__dirname}/events/votes`
    ]);
});


module.exports = { client };
