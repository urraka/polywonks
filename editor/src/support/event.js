export class Event {
    constructor(type, data = null) {
        this.type = type;
        this.target = null;
        this.defaultPrevented = false;
        Object.assign(this, data);
    }

    preventDefault() {
        this.defaultPrevented = true;
    }
}

export class EventEmitter {
    constructor() {
        this.listeners = {};
        this.emitterLockCount = 0;
    }

    on(type, listener) {
        this.listeners[type] = this.listeners[type] || (this.listeners[type] = []);
        this.listeners[type].push(listener);
    }

    once(type, listener) {
        const wrapper = (...args) => {
            this.remove(type, wrapper);
            listener.call(this, ...args);
        };
        this.on(type, wrapper);
    }

    off(type, listener) {
        const index = this.listeners[type] ? this.listeners[type].indexOf(listener) : -1;
        if (index >= 0) {
            this.listeners[type].splice(index, 1);
        }
    }

    emit(event) {
        if (this.emitterLockCount > 0) return;
        event.target = event.target || this;
        if (this.listeners[event.type]) {
            [...this.listeners[event.type]].forEach(listener => listener.call(this, event));
        }
        return !event.defaultPrevented;
    }

    lockEmitter() {
        this.emitterLockCount++;
    }

    unlockEmitter() {
        this.emitterLockCount--;
    }
}
