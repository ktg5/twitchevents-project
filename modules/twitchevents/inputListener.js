const nut = require("../ktg5-nutjs-fork/nut-js");
const gkm = require("gkm");
const keysEnum = require('./keyEnum');


/**
 * @typedef {"mouseMoved" | "mouseClicked" | "mousePressed" | "mouseReleased" |
 *           "keyPressed" | "keyReleased" | "keyTyped"} TwitchEventInputEvents
*/


class Point {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
}


class InputListener extends EventTarget {
    #eventTarget = new EventTarget();
    #listeners = new Map();
    #lastSyntheticEvent = {};
    lastMousePos = { x: 0, y: 0 };
    /**
     * @enum {nut.Key}
     */
    Keys = keysEnum.Keys;
    /**
     * @enum
     */
    MouseBtn = nut.Button;
    #pressed = {
        stat: false,
        key: null
    };
    getKeyCharByCode = keysEnum.getKeyCharByCode;
    getKeyCodeByString = keysEnum.getKeyCodeByString;


    constructor() {
        super();

        // Setup GKM listeners for physical events
        const gkmMouseEvent = gkm.events.on('mouse.*', (e) => {
            switch (gkmMouseEvent.event) {
                case "mouse.moved":
                    let splitData = e[0].split(',');
                    let pos = { x: Number(splitData[0]), y: Number(splitData[1]) };

                    delete e[0];
                    e.x = pos.x;
                    e.y = pos.y;

                    this.lastMousePos = { ...e };
                    this.#handleEvent("mouseMoved", e);
                break;

                case "mouse.clicked":
                    this.#handleEvent("mouseClicked", e);
                break;

                case "mouse.released":
                    this.#handleEvent("mouseReleased", e);
                break;

                case "mouse.pressed":
                    this.#handleEvent("mousePressed", e);
                break;
            }
        });
        const gkmKeyEvent = gkm.events.on("key.*", (e) => {
            switch (gkmKeyEvent.event) {
                case "key.pressed":
                    if (
                        this.#pressed.stat === false
                        || this.#pressed.key !== e[0]
                    ) {
                        this.#handleEvent("keyPressed", e);
                        this.#pressed.stat = true;
                        this.#pressed.key = e[0];
                    }
                break;

                case "key.released":
                    this.#handleEvent("keyReleased", e);
                    this.#pressed.stat = false;
                    this.#pressed.key = null;
                break;

                case "key.typed":
                    this.#handleEvent("keyTyped", e);
                break;
            }
        });
    }


    // Mostly for the gkm events
    #handleEvent(type, e) {
        // Ignore if it matches last synthetic event
        if (
            this.#lastSyntheticEvent[type] !== undefined &&
            (Date.now() - this.#lastSyntheticEvent[type].time) < 80
        ) if (
            // Mouse & keyboard inputs
            (
                e[0]
                && this.#lastSyntheticEvent[type][0] === e[0]
            )
            // Mouse positions
            || (
                e.x && e.y
                && this.#lastSyntheticEvent[type].x === e.x
                && this.#lastSyntheticEvent[type].y === e.y
            )
        ) return;
        else return;

        // Debug logging stuff
        // if (this.#lastSyntheticEvent[type]) {
        //     console.log('l: ', this.#lastSyntheticEvent[type])
        //     console.log('e: ', e);
        // }

        // Otherwise, emit as usual
        this.#emit(type, { ...e, synthetic: false });
    }

    /**
     * @param {string} type 
     * @param {any} d
     */
    #setSyntheticEvent(type, d) {
        this.#lastSyntheticEvent[type] = { ...d, time: Date.now() };
    }


    /**
     * Set the mouse position to a specific position via the `point` arg
     * Will send a emit to "mouseMoved"
     * @param {Point} point
     */
    async setMouse(point) {
        const thisEventName = "mouseMoved";

        const deltaX = point.x - this.lastMousePos.x;
        const deltaY = point.y - this.lastMousePos.y;
        const returnData = { x: point.x, y: point.y, deltaX, deltaY, synthetic: true };

        this.#setSyntheticEvent(thisEventName, returnData);
        await nut.mouse.move(point);
        this.lastMousePos = { x: point.x, y: point.y };

        this.#emit(thisEventName, returnData);
    }

    /**
     * Moves the mouse by the amount defined in the `point` arg
     * @param {Point} point A basic point, which contains X & Y values
     */
    async moveMouse(point) {
        const thisEventName = "mouseMoved";

        const mousePos = await this.getMousePos();
        const deltaX = point.x - this.lastMousePos.x;
        const deltaY = point.y - this.lastMousePos.y;
        const fullX = mousePos.x + point.x;
        const fullY = mousePos.y + point.y;
        const returnData = { x: fullX, y: fullY, deltaX, deltaY, synthetic: true };

        this.#setSyntheticEvent(thisEventName, returnData);
        await nut.mouse.move(point, true);
        this.lastMousePos = { x: fullX, y: fullY };
        
        this.#emit(thisEventName, returnData);
    }

    /**
     * Get the current mouse position
     * @returns {Promise<Point>}
     */
    async getMousePos() {
        return new Promise(async (resolve, reject) => {
            const nutPos = await nut.mouse.getPosition();
            resolve(new Point(nutPos.x, nutPos.y)); 
        });
    }


    #handleMouseButton(button) {
        let targetClick;
        switch (button) {
            case 0:
                targetClick = this.MouseBtn.LEFT;
            break;

            case 1:
                targetClick = this.MouseBtn.RIGHT;
            break;

            case 2:
                targetClick = this.MouseBtn.MIDDLE;
            break;
        
            default:
                targetClick = this.MouseBtn.LEFT;
            break;
        }

        return targetClick;
    }

    /**
     * Click a given `MouseBtn` enum
     * Will send a emit to "mouseClicked"
     * @param {MouseBtn} [button] Can be either `0` for left, `1` for right or `2` for middle
     */
    async clickMouse(button = this.MouseBtn.LEFT) {
        const thisEventName = "mouseClicked";

        let targetClick = this.#handleMouseButton(button);

        this.#setSyntheticEvent(thisEventName, { 0: targetClick });
        await nut.mouse.click(targetClick);
        this.#emit("mousePressed", { 0: targetClick, synthetic: true });
        this.#emit("mouseReleased", { 0: targetClick, synthetic: true });
        this.#emit(thisEventName, { 0: targetClick, synthetic: true });
    }

    /**
     * Hold a given `MouseBtn` enum
     * Will send a emit to "mouseClicked"
     * @param {MouseBtn} [button] Can be either `0` for left, `1` for right or `2` for middle
     */
    async holdMouse(button = this.MouseBtn.LEFT) {
        const thisEventName = "mousePressed";

        let targetClick = this.#handleMouseButton(button);

        this.#setSyntheticEvent(thisEventName, { 0: targetClick });
        await nut.mouse.pressButton(targetClick);
        this.#emit(thisEventName, { 0: targetClick, synthetic: true });
    }

    /**
     * Release a given `MouseBtn` enum
     * Will send a emit to "mouseReleased"
     * @param {MouseBtn} [button] Can be either `0` for left, `1` for right or `2` for middle 
     */
    async releaseMouse(button = this.MouseBtn.LEFT) {
        const thisEventName = "mouseReleased";

        let targetClick = this.#handleMouseButton(button);

        this.#setSyntheticEvent(thisEventName, { 0: targetClick });
        await nut.mouse.releaseButton(targetClick);
        this.#emit(thisEventName, { 0: targetClick, synthetic: true });
    }


    /**
     * Type a key
     * Will send a emit to all events relating to keys
     * @param {Keys} key The key to press
     * @param {Keys} modifer Modifer key to hold down with the `key`
     */
    async typeKey(key, modifer) {
        const thisEventName = "keyTyped";
        this.#setSyntheticEvent(thisEventName, { 0: this.getKeyCharByCode(key) });

        this.holdKey(key, modifer);
        this.releaseKey(key, modifer);
        this.#emit(thisEventName, { 0: this.getKeyCharByCode(key), synthetic: true });
    }

    /**
     * Hold a key
     * Will send a emit to "keyPressed"
     * @param {Keys} key The key to hold down
     * @param {Keys} modifer Modifer key to hold down with the `key`
     */
    async holdKey(key, modifer) {
        const thisEventName = "keyPressed";
        setTimeout(() => this.#setSyntheticEvent(thisEventName, { 0: this.getKeyCharByCode(key) }), 300);

        if (modifer) nut.keyboard.pressKey(modifer, key);
        else nut.keyboard.pressKey(key);
        this.#emit(thisEventName, { 0: this.getKeyCharByCode(key), synthetic: true });
    }

    /**
     * Release a key
     * Will send a emit to "keyReleased"
     * @param {Keys} key The key to release
     * @param {Keys} modifer Modifer key to hold down with the `key`
     */
    async releaseKey(key, modifer) {
        const thisEventName = "keyReleased";
        this.#setSyntheticEvent(thisEventName, { 0: this.getKeyCharByCode(key) });

        if (modifer) nut.keyboard.releaseKey(modifer, key);
        else nut.keyboard.releaseKey(key);
        this.#emit(thisEventName, { 0: this.getKeyCharByCode(key), synthetic: true });
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
     * @param {TwitchEventInputEvents} event
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
     * @param {TwitchEventInputEvents} event
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


module.exports = { InputListener, Point };
