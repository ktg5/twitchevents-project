const twitchGql = require("./twitchgql");
const path = require('node:path');
const gqlInstance = new twitchGql.Client("kimne78kx3ncx6brgo4mv6wki5h1ko");
const fs = require('fs');
const winston = require('winston');
const socketIo = require("socket.io");
const readline = require('readline');
const tmi = require('tmi.js');
// Custom
const { Hermes } = require("./hermes");
const { logger } = require('./logger');
const { webAuth } = require('./webauth');
const InputsListener = require('./inputListener');
const inputs = new InputsListener.InputListener();
const { Player } = require("./player");
const { Tts } = require('./tts');


// Create readline interface for listening for console commands
const rl = readline.createInterface({
    input: process.stdin
});
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);


/**
 * @typedef {{
 *      newOnInit: boolean | null,
 *      disableOnInit: boolean | null,
 *      votingTime: number,
 *      timeout: number,
 *      current: {
 *          voting: boolean,
 *          time: sameAs_votingTime,
 *          startedAt: string
 *          options: VoteEvent[]
 *          voters: Voter[],
 *          totalVotes: number,
 *          displayType: string,
 *          winningOption: VoteEvent | VoteEvent[] | null
 *      },
 *      sets: {
 *          interval: interval
 *          endTimeout: timeout
 *      },
 *      prev: {
 *          options: VoteEvent[],
 *          winningOption: VoteEvent
 *      }
 *  }} PollData
 */

/**
 * @typedef {{
 *      event: VoteEvent | null,
 *      interval: interval | null
 * }} CurrentEventData
 */

/**
 * @typedef {Object} EventData
 * @prop {string} name - The name of the event
 * @prop {string} [desc] - (Optional) The event desciription to be displayed on a vote (Only for VOTES events)
 * @prop {string} type - The type of the event (Defined in the "Types" enum/class)
 * @prop {string} [reward] - (Optional) The reward name that's linked with a Twitch channel reward
 */

/**
 * @callback EnableEvent
 * @param {Client} client - TwitchEvents client
 * @param {boolean} forced - If set to `true`, the event will not auto disable
 * @returns {void}
 */

/**
 * @callback DisableEvent
 * @param {Client} client - TwitchEvents client
 * @returns {void}
 */

/**
 * @typedef {Object} Event
 * @prop {EventData} data - Event data
 * @prop {number} [time] - The amount of time for the event to last
 * @prop {DisableEvent} [disable] - Disable event
 * @prop {EnableEvent} enable - Enable or run event function
 * @prop {boolean} enabled - If the event is running at the moment
 */

/**
 * @typedef {Object} VoteEvent
 * @prop {EventData} data - Event data
 * @prop {number} time - The amount of time for the event to last
 * @prop {DisableEvent} disable - Disable event
 * @prop {EnableEvent} enable - Enable or run event function
 * @prop {Number} [votes] - Is only defined when in a poll. Will return a number of how many votes this event has got during a poll
 */

/**
 * @typedef {Object} Voter
 * @prop {string} name - Username on twitch
 * @prop {number} votedFor - The number that the user voted for
 */


// Basic functions
function minsToMs(number = 0) { return number * 60 * 1000 };


// Other
const maxEventsPerVote = 4;
var addedEvents = false;
const pollPickRandomTime = 3000;


// Heere's where the fun begins
class Client {
    #eventTarget = new EventTarget();
    #listeners = new Map();
    /**
     * @type {tmi.Client}
     */
    irc;
    #gqlUser;
    /**
     * @type {socketIo.Server}
     */
    #io;


    /**
     * Makes a new TwitchEvents instance
     * @param {{
     *      port: number
     * }} data
     */
    constructor(data) {
        this.createdTime = new Date();


        this.initEventWeb(data.port);


        // CLI
        rl.on('line', (line) => {
            const command = line.trim();
            const args = command.split(' ');

            switch (args[0]) {
                case 'info':
                    logger.info(`TwitchEvents CLI: Time started: ${this.createdTime}`);
                    logger.info(`TwitchEvents CLI: Total events: ${this.events.redeems.length + this.events.votes.length}`);
                    logger.info(`TwitchEvents CLI: EventWeb URL: http://localhost:${this.web.port}`);
                break;

                case 'enable':
                    if (!args[1]) return logger.error(`TwitchEvents CLI: You must provide another arg at length 1`);
                    if (args[1] == 'auto-poll') return this.#togglePollInt(true);

                    // Find the event under the name provided by the cli user
                    var foundEvent = this.getEvent(args[1]);
                    if (!foundEvent) return logger.error(`TwitchEvents CLI: The name provided didn't link to any events`);
                    logger.info(`TwitchEvents CLI: Found event! Event data: `);
                    console.log(foundEvent);
                    logger.info(`TwitchEvents CLI: Enabling found event...`);
                    foundEvent.enable(this, true);
                break;

                case 'disable':
                    if (!args[1]) return logger.error(`TwitchEvents CLI: You must provide another arg at length 1`);
                    if (args[1] == 'auto-poll') return this.#togglePollInt(false);

                    // Find the event under the name provided by the cli user
                    var foundEvent = this.getEvent(args[1]);
                    if (!foundEvent) return logger.error(`TwitchEvents CLI: The name provided didn't link to any events`);
                    logger.info(`TwitchEvents CLI: Found event! Event data: `);
                    console.log(foundEvent);
                    logger.info(`TwitchEvents CLI: Disabling found event...`);
                    foundEvent.disable(this);
                break;

                case 'end':
                    switch (args[1]) {
                        case 'poll':
                            logger.info(`TwitchEvents CLI: Forcing poll to end!`);
                            this.#pollEnd();
                        break;

                        default:
                            if (!args[1] && args.length > 2) return logger.error(`TwitchEvents CLI: Detected possible multiple args, but not at length 1`);
                            else if (!args[1]) return logger.error(`TwitchEvents CLI: Another arg for what to test wasn't provided`);
                            else logger.error(`TwitchEvents CLI: The arg provided didn't match to any ends`);
                        break;
                    }
                break;

                case 'test':
                    switch (args[1]) {
                        case 'poll':
                            logger.info(`TwitchEvents CLI: Got test request for poll!`);
                            this.#pollStart(this);
                        break;

                        default:
                            if (!args[1] && args.length > 2) return logger.error(`TwitchEvents CLI: Detected possible multiple args, but not at length 1`);
                            else if (!args[1]) return logger.error(`TwitchEvents CLI: Another arg for what to test wasn't provided`);
                            else logger.error(`TwitchEvents CLI: The arg provided didn't match to any tests`);
                        break;
                    }
                break;

                default:
                    if (command == '') return;
                    logger.error(`TwitchEvents CLI: Unknown command: ${command}`);
                break;
            }
        });
        // End of CLI
    }


    /**
     * 
     * @param {number} port
     * @returns {{ io: socketIo.Server }}
     * @throws {Error} If the port is not defined or is not a number.
     */
    async initEventWeb(port) {
        if (!port || !(typeof port == "number")) throw new Error('TwitchEvents: "port", is not defined or a number when using "initEventWeb".')

        // Make html website with given dir
        let webData = await webAuth(port, `${__dirname}/html`);
        // And return the stuff we and the dumbass coder to use
        this.web = {
            port: port,
            /**
             * Sends data to TwitchEvents web clients via socket.io without having to pass through the specific user format
             * @param {string} channel 
             * @param {*} [data] 
             */
            sendEmit: (channel, data) => {
                if (!channel) throw new Error('TwitchEvents: "channel" need to be defined.');
                // Send emit over io
                this.#io.emit(`${this.web.getListener(channel)}`, data);
            },
            getListener: (channel) => {
                return `${this.user}@${channel}`;
            }
        };
        this.#io = webData.io;

        // Send client info on IO request
        this.#io.on('connection', (socket) => {
            socket.on('get-client', e => {
                // Get event html dirs within `html/events`
                const eventsDir = fs.readdirSync(path.join(__dirname, 'html/events'));
                var eventHtmlDirs = [];
                eventsDir.forEach((file) => { if (fs.lstatSync(path.join(__dirname, 'html/events/', file)).isDirectory) eventHtmlDirs.push(file); });

                // Send to client
                let tempInt = setInterval(() => {
                    if (addedEvents) {
                        clearInterval(tempInt);
                        let safePoll = {...this.poll};
                        delete safePoll.sets;
                        socket.emit('got-client', {
                            user: this.user,
                            poll: safePoll,
                            hermes: this.hermes,
                            eventHtmlDirs
                        });
                        // logger.info('TwitchEvents: Sent TwitchEvents Client info to web client.');
                    }
                }, 100);
            });
        });

        return this.web;
    };


    /**
     * 
     * @this {Client} - Refers to the current instance of the Client class.
     * @param {{
     *      user: string,
     *      eventTime: number,
     *      poll: {
     *          newOnInit: boolean,
     *          time: number
     *      }
     * }} data - Data related to the user and poll configuration.
     * @returns {Client} The current instance of the Client class.
     * @throws {Error} If the data object is invalid or contains missing properties.
     */
    async watch(data) {
        if (!data || typeof data !== "object") throw new Error(`TwitchEvents.Client: "data", is either not defined or is not a "object".`)
        if (!data.user || typeof data.user !== "string") throw new Error(`TwitchEvents.Client: "data.user", is either not defined or not a "string".`);
        if (!data.eventTime || typeof data.eventTime !== "number") throw new Error(`TwitchEvents.Client: "data.eventTime", is either not defined or not a "number".`);
        if (!data.poll || typeof data.poll !== "object") throw new Error(`TwitchEvents.Client: "data.pollMins", is either not defined or not a "object".`);


        // Set data to this
        this.user = data.user;
        this.eventTime = data.eventTime;
        /**
         * @type {PollData}
         */
        this.poll = this.#defaultPollData(data);
        /**
         * @type {CurrentEventData[]}
         */
        this.currentEvent = {
            event: null,
            interval: null
        }


        // First, let's a get a Hermes instance running
        this.#gqlUser = await gqlInstance.getChannel(this.user);
        let hermesCheck = false;
        this.hermes = new Hermes(Number(this.#gqlUser.id), 'all');
        // Reward redeem event listener
        this.hermes.on('data', (d) => {
            if (d.type == "reward-redeemed") {
                const foundEvent = this.events.redeems.find((r) => r.data.reward.toLowerCase() === d.data.redemption.reward.title.toLowerCase());
                // Enable the event
                if (foundEvent) foundEvent.enable(this);
            }
        });


        // Make tmi.js client
        this.irc = new tmi.Client({
            channels: [ this.user ]
        });
        this.irc.connect();
        // Make listener for polls
        this.irc.on('message', (channel, tags, message) => this.#pollIrc(channel, tags, message));


        // ###########
        // ########### Generate polls
        // ###########
        // DEBUG:
        // setTimeout(e => { this.#pollStart(); }, 1000);
        // DEFAULT:
        if (!this.poll.disableOnInit && this.poll.disableOnInit !== true) this.#togglePollInt();


        // Set the events object
        this.events = {
            /**
             * List of redeem events.
             * 
             * @type {Event[]}
             */
            redeems: [],
            /**
             * List of redeem events.
             * 
             * @type {VoteEvent[]}
             */
            votes: []
        }


        // Make sure we init'd everything
        this.hermes.on('init', () => { hermesCheck = true; });


        // Check for all inits & then send "init" back
        let tempInt = setInterval(() => {
            if (
                hermesCheck
            ) {
                this.#emit('init');
                clearInterval(tempInt);
            }
        }, 100);


        return this;
    }

    #togglePollInt(force) {
        if (this.poll.sets.interval !== null || force == false) {
            clearInterval(this.poll.sets.interval);
            this.poll.sets.interval = null;
            logger.info(`TwitchEvents: Cleared new poll interval`);
        } else {
            // So yeah, it's the poll timeouot + time to vote. Event time doesn't account in here, but it can if you set the times correctly......................................................nerd...
            const timeCalc = minsToMs(this.poll.timeout) + minsToMs(this.poll.votingTime);
            this.poll.sets.interval = setInterval(async () => { await this.#pollStart(); }, timeCalc + (pollPickRandomTime * 2)); // The extra is added to be a "just in case" moment, if ya'know what I mean
            logger.info(`TwitchEvents: Intervaling new polls every ${timeCalc / 60 / 1000} minute${((timeCalc / 60 / 1000) === 1) ? '' : 's'}...`);

            // If user config said to make new poll on init
            if (this.poll.newOnInit === true) setTimeout(() => { this.#pollStart(); }, 1000);
        }
    }

    /**
     * @param {Client} data 
     * @returns {PollData}
     */
    #defaultPollData(data) {
        return {
            ...data.poll,
            current: {
                voting: false,
                time: 0,
                startedAt: null,
                options: [],
                voters: [],
                totalVotes: 0,
                displayType: "",
                winningOption: null
            },
            sets: {
                interval: null,
                endTimeout: null
            }
        };
    }

    /**
     * Create a new poll on the current client for the user's twitch to vote on. This also uses some socketio stuff to talk with the event web.
     */
    async #pollStart() {
        if (this.poll.current.voting == true) {
            logger.info('TwitchEvents: Ending current poll...');
            await this.#pollEnd();
        }
        // Select 4 events from this.events.votes
        /**
         * @type {VoteEvent[]}
         */
        let pollList = [];
        /// Make a copy of the current vote events list & randomize it
        const eventListCopy = [...this.events.votes];
        for (let i = eventListCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [eventListCopy[i], eventListCopy[j]] = [eventListCopy[j], eventListCopy[i]];
        }
        // DEBUG:
        // console.log(eventListCopy);
        /// Split the copy into the amount of votes to show & check if the previous options had any of the pollList
        const splitListCopy = eventListCopy.splice(0, maxEventsPerVote);
        splitListCopy.forEach((evtInCopy) => { // For each event in the split copy
            // Check if it's in the previous option list
            isInLast(this, evtInCopy);
            /**
             * @param {Client} client 
             * @param {VoteEvent} evt 
             */
            function isInLast(client, evt) {
                let attempts = 0;
                if (client.poll.prev) while (attempts < 20) {
                    var isDuplicate = false;
                    client.poll.prev.options.forEach((prevEvent) => { if (prevEvent.data.name === evt.data.name) return isDuplicate = true; });
                    if (!isDuplicate) break;
            
                    // Pick a new one
                    evt = eventListCopy[Math.floor(Math.random() * eventListCopy.length)];
                    attempts++;
                }
            
                pollList.push({
                    ...evt,
                    votes: 0
                });
            }
        });


        // Send to all clients
        this.poll.current.voting = true;
        this.poll.current.time = this.poll.votingTime;
        this.poll.current.startedAt = new Date();
        this.poll.current.options = pollList;
        this.poll.current.totalVotes = 0;
        this.poll.current.displayType = "VOTES";
        this.web.sendEmit(`poll-new`, this.poll.current);
        logger.info(`TwitchEvents: Started a new poll! Closes in ${this.poll.current.time} minute${(this.poll.current.time === 1) ? "" : "s"}!`);


        // Wait the poll time provided & end everything
        this.poll.sets.endTimeout = setTimeout(() => { this.#pollEnd() }, minsToMs(this.poll.votingTime));
    }

    /**
     * 
     * @param {string} channel 
     * @param {tmi.ChatUserstate} tags 
     * @param {string} message 
     * @param {Client} client
     */
    #pollIrc(channel, tags, message, client) {
        // If a poll isn't happening, no need to run any of this
        if (this.poll.current.voting != true) return;

        const sender = tags['username'];
        const sentNumber = Number(message) - 1;

        // Check if the sender is new to the current poll
        const foundSender = this.poll.current.voters ? this.poll.current.voters.find((v) => v.name == sender) : null;
        if (!foundSender) {
            // Check to make sure the message they put in the chat is within the max length of the selected options
            if (
                (sentNumber + 1) <= this.poll.current.options.length
                && (sentNumber + 1) > 0
            ) {
                // Put them into the voters list & count their vote
                this.poll.current.voters.push({
                    name: sender,
                    votedFor: sentNumber
                });
                this.poll.current.options[sentNumber].votes++;
                this.poll.current.totalVotes++;
                sendUpdate(this);
            }
        // If the voter is voting for a different choice, let them change their vote
        } else if (
            foundSender.votedFor !== sentNumber
            && (sentNumber + 1) > 0
            && this.poll.current.options[sentNumber]
        ) {
            const pastVote = foundSender.votedFor;
            foundSender.votedFor = sentNumber;
            this.poll.current.options[pastVote].votes--;
            this.poll.current.options[sentNumber].votes++;
            sendUpdate(this);
        }

        // Send the data to the web viewer as well
        /**
         * @param {Client} client 
         */
        function sendUpdate(client) { client.web.sendEmit(`poll-update`, client.poll.current) };
    }

    /**
     * End the currently running poll on this client
     * @returns {Promise<boolean>} - If the poll ending was a success
     */
    #pollEnd() {
        return new Promise(async (resolve, reject) => {
            // Set voting to false
            this.poll.current.voting = false;

            // Clear timeout
            clearTimeout(this.poll.sets.endTimeout);
            this.poll.sets.endTimeout = null;

            // Get event winner information
            this.poll.current.options.forEach((option) => {
                if (this.poll.current.winningOption == null) return this.poll.current.winningOption = option;
                // Check an option in the (possibly) winning array to see if it's the same value or is higher
                if (Array.isArray(this.poll.current.winningOption)) {
                    if (this.poll.current.winningOption[0].votes < option.votes) return this.poll.current.winningOption = option;
                    else if (this.poll.current.winningOption[0].votes == option.votes) return this.poll.current.winningOption.push(option);
                // Normal stuff happens down here
                } else {
                    if (this.poll.current.winningOption.votes < option.votes) return this.poll.current.winningOption = option;
                    else if (this.poll.current.winningOption.votes == option.votes) return this.poll.current.winningOption = [this.poll.current.winningOption, option];
                }
            });
            
            // Enabling the winning option...
            if (Array.isArray(this.poll.current.winningOption)) {
                // Pick a random one after sending a emit for the picking animation
                logger.info('TwitchEvents: Picking one of the winning events...');
                this.web.sendEmit(`poll-picking`, this.poll.current);
                
                setTimeout(async () => {
                    this.poll.current.winningOption = this.poll.current.winningOption[Math.floor(Math.random() * this.poll.current.winningOption.length)];
                    end(this);
                }, pollPickRandomTime);
            } else end(this);

            // End
            /**
             * @param {Client} client 
             */
            function end(client) {
                if (!client.poll.current || !client.poll.current.winningOption) return;
                // Send emits
                client.web.sendEmit(`poll-end`, client.poll.current);

                // For coolness......... lmao
                setTimeout(() => {
                    // Enable option
                    if (!client.poll.current.winningOption.enable) console.log(client.poll.current.winningOption);
                    client.poll.current.winningOption.enable(client);
                    client.currentEvent = {
                        event: client.poll.current.winningOption,
                        interval: null
                    };

                    // Make interval for current event to disable it after a while


                    // Clear everythin'
                    const pastPoll = { ...client.poll.current };
                    client.poll = client.#defaultPollData(client);
                    client.poll.prev = { options: pastPoll.options, winningOption: pastPoll.winningOption };

                    logger.info('TwitchEvents: Current poll has ended!');
                }, 1000);

                resolve();
            }
        });
    }


    /**
     * Add a directory of event scripts, which depending on type (defined in the event script),
     * will be checked for default values & added to a list within the Client.
     * @example
     * await addEvents(['./events/dir1', './events/dir2']);
     * @param {[string]} dirList String of paths
     * @throws {Error} If:
     * - `dirList` is not defined, is not an array, or is empty.
     * - Any item in `dirList` is not a string.
     * - Any event file does not meet the required structure (missing `data` or `enable`
     * properties).
     * - An event with the same name already exists in the system.
     * - An event type is invalid or not supported (e.g., missing `reward` for `REDEEM`
     * events).
     * - A `VOTE` event does not have a `disable` function.
     * @returns {Client}
     */
    async addEvents(dirList) {
        if (!dirList || typeof dirList !== 'object' || !Array.isArray(dirList)) throw new Error(`TwitchEvents: The returned arg is not defined or is not a array.`);
        
        // Check dir locations in list & add each of their childern
        for (let i = 0; i < dirList.length; i++) {
            const dir = dirList[i];
            if (typeof dir !== "string") throw new Error(`TwitchEvents: The dir string in position ${i} is not a string`);


            const eventFileList = fs.readdirSync(dir);
            eventFileList.forEach(eventName => {
                // Check for file type
                const eventExt = path.extname(eventName);
                if (
                    eventExt !== '.js'
                    && eventExt !== '.ts'
                ) return;

                // Open event file
                const eventPath = path.join(dir, eventName);
                /**
                 * Event file.
                 * @type {Event}
                 */
                const event = require(eventPath);


                // Check if events have the default opinions
                if (
                    !'data' in event
                    && !'enable' in event
                ) throw new Error(`TwitchEvents: The event, "${eventName}", doesn't meet the event script requirements.`);
                // Check if the event has been put into one of the event array already
                if (
                    this.events.votes.find(v => v.data.name === event.data.name)
                    || this.events.redeems.find(v => v.data.name === event.data.name)
                ) throw new Error(`TwitchEvents: The event, "${eventName}", has the same name in it's "data" object--that being "${event.data.name}"--as a already existing event.`);

                // Default data
                this.eventTime
                const eventData = {
                    data: event.data,
                    time: event.time ? event.time : undefined,
                    enable(client, forced) {
                        if (!client) throw new Error(noClientErr);

                        if (event.data.type === Types.VOTE) {
                            if (event.enabled) logger.error(`TwitchEvents: The event, "${eventName}" is already enabled. Disable it to enable it again.`);
                            // Set time so that event can auto-disable
                            this.time = client.eventTime;
                        }
                        
                        // Auto disable for events with the "time" value
                        if (this.time) {
                            // Throw error if the "time" value is set but no disable function is made
                            if (!event.disable) throw new Error(`TwitchEvents: The event, "${eventName}" has a "time" value set, or is a "VOTE" type, but doesn't have a "disable" function!`);

                            // Enable then disable after the given time
                            setTimeout(() => { this.disable(client); }, minsToMs(this.time));
                            logger.info(`TwitchEvents: Enabled "${eventName}" & disabling in ${this.time} minute${(this.time === 1) ? "" : "s"}!`);
                        // Normal--just log we're enabling
                        } else logger.info(`TwitchEvents: Enabled "${eventName}"!`);

                        event.enable(client);
                    },
                    disable(client) {
                        if (!client) throw new Error(noClientErr);

                        event.disable(client);
                        logger.info(`TwitchEvents: Disabled "${eventName}"!`);
                    }
                };

                // More possible errors & put event in the right spot
                switch (event.data.type) {
                    case Types.REDEEM:
                        if (!event.data.reward) throw new Error(`TwitchEvents: The event, "${eventName}", is a "REDEEM" type, but doesn't have the "reward" variable.`);
                        if (this.#gqlUser.customRewards.find(r => r.title.toLowerCase() === event.data.reward.toLowerCase()) == undefined) logger.warn(`TwitchEvents: The Twitch reward named, "${event.data.reward}", wasn't found on the channel, "${this.#gqlUser.login}", for event file, "${eventName}".`);
                        this.events.redeems.push(eventData);
                    break;

                    case Types.VOTE:
                        if (!event.disable) throw new Error(`TwitchEvents: The event, "${eventName}", is a "VOTE" type, but doesn't have the "disable" function.`);
                        this.events.votes.push(eventData);
                    break;
                
                    default:
                        throw new Error(`TwitchEvents: Couldn't find the type given for "${eventName}".`);
                    break;
                }


                // Rewrite enable & disable script
                let noClientErr = `TwitchEvents: The "client" arg is required for enabling/disabling events, so they know where they are, lol`;
            });


            logger.info(`TwitchEvents: Added the event list located at: "${dir}"`);
        }

        addedEvents = true;
    }


    /**
     * Find a event under the given "string"
     * @param {string} string 
     * @returns {Event | null}
     */
    getEvent(string) {
        var foundEvent = null;
        if (!this.events) return;
        const votesSearch = this.events.votes.find(v => v.data.name === string);
        const redeemsSearch = this.events.redeems.find(v => v.data.name === string);

        if (votesSearch) foundEvent = votesSearch;
        else if (redeemsSearch) foundEvent = redeemsSearch;
        return foundEvent;
    }


    // Send event
    #emit(event, data) {
        // Emit to any client listening to the "event" via this.on
        const customEvent = new CustomEvent(event, {
            detail: data
        });
        this.#eventTarget.dispatchEvent(customEvent);
    }

    /**
     * @param {string} event
     * @param {(data: EventPayloads[K]) => void} callback
     */
    on(event, callback) {
        const wrapper = (e) => callback(e.detail);

        // store so we can remove later
        if (!this.#listeners.has(event)) this.#listeners.set(event, new Map());
        this.#listeners.get(event).set(callback, wrapper);

        this.#eventTarget.addEventListener(event, wrapper);
    }

    /**
     * @param {string} event
     * @param {(data: EventPayloads[K]) => void} callback
     */
    off(event, callback) {
        const wrapper = this.#listeners.get(event)?.get(callback);
        if (wrapper) {
            this.#eventTarget.removeEventListener(event, wrapper);
            this.#listeners.get(event).delete(callback);
        }
    }
}


const Types = Object.freeze({
    VOTE: "VOTE",
    REDEEM: "REDEEM"
});


module.exports = { Client, Event, Types, inputs, Point: InputsListener.Point, Player, Tts };
