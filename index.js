const TwitchEvents = require(`./modules/twitchevents`);
const config = require('./config.json');


// Init my code lol
const client = new TwitchEvents.Client({
    res: {
        w: 2560,
        h: 1440
    }
});
client.initEventWeb(config.webPort, `${__dirname}/html`);
client.watch({
    user: 'ktg5_special',
    poll: config.poll
});


client.on('init', () => {
    client.addEvents([
        `${__dirname}/events/redeems`,
        `${__dirname}/events/votes`
    ]);

    
    // client.events.votes.find(v => v.data.name === "nausea").enable();
});


module.exports = { client };
