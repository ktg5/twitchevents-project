const nut = require("../ktg5-nutjs-fork/nut-js");
const gkm = require("gkm");


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
    #lastSyntheticEvent = null;
    lastMousePos = { x: 0, y: 0 };
    /**
     * @enum {nut.Key}
     */
    Keys = nut.Key;
    /**
     * @enum
     */
    MouseBtn = nut.Button;


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
                    this.#handleEvent("keyPressed", e)
                break;

                case "key.released":
                    this.#handleEvent("keyReleased", e)
                break;

                case "key.typed":
                    this.#handleEvent("keyTyped", e)
                break;
            }
        });
    }


    // Mostly for the gkm events
    #handleEvent(type, e) {
        // Ignore if it matches last synthetic event
        if (this.#lastSyntheticEvent &&
            this.#lastSyntheticEvent.type === type &&
            this.#lastSyntheticEvent.key === e.key &&
            Date.now() - this.#lastSyntheticEvent.time < 80 // small window
        ) return;

        // Otherwise, emit as usual
        this.#emit(type, { ...e, synthetic: false });
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

        this.#lastSyntheticEvent = { type: thisEventName, returnData, time: Date.now() };
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

        this.#lastSyntheticEvent = { type: thisEventName, returnData, time: Date.now() };
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

        this.#lastSyntheticEvent = { type: thisEventName, targetClick, time: Date.now() };
        console.log('click');
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

        this.#lastSyntheticEvent = { type: thisEventName, targetClick, time: Date.now() };
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

        this.#lastSyntheticEvent = { type: thisEventName, targetClick, time: Date.now() };
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
        this.#lastSyntheticEvent = { type: thisEventName, key, time: Date.now() };

        this.holdKey(key, modifer);
        this.releaseKey(key, modifer);
        
        this.#emit("keyPressed", { key, synthetic: true });
        this.#emit("keyReleased", { key, synthetic: true });
        this.#emit(thisEventName, { key, synthetic: true });
    }

    // /**
    //  * Types out the given string one key at a time.
    //  * Will send a emit to all events relating to keys for each button
    //  * @param {string} string
    //  * @example
    //  * await InputListener.typeString("Hello World!");
    //  */
    // async typeString(string) {
    //     for (const char of string) await this.typeKey(Key[char] || char);
    // }

    /**
     * Hold a key
     * Will send a emit to "keyPressed"
     * @param {Keys} key The key to hold down
     * @param {Keys} modifer Modifer key to hold down with the `key`
     */
    async holdKey(key, modifer) {
        const thisEventName = "keyPressed";
        this.#lastSyntheticEvent = { type: thisEventName, key, time: Date.now() };

        if (modifer) nut.keyboard.pressKey(modifer, key);
        else nut.keyboard.pressKey(key);
        this.#emit(thisEventName, { key, synthetic: true });
    }

    /**
     * Release a key
     * Will send a emit to "keyReleased"
     * @param {Keys} key The key to release
     * @param {Keys} modifer Modifer key to hold down with the `key`
     */
    async releaseKey(key, modifer) {
        const thisEventName = "keyReleased";
        this.#lastSyntheticEvent = { type: thisEventName, key, time: Date.now() };

        if (modifer) nut.keyboard.releaseKey(modifer, key);
        else nut.keyboard.releaseKey(key);
        this.#emit(thisEventName, { key, synthetic: true });
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
