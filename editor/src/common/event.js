export class Event {
    constructor(type, data, target) {
        this.type = type;
        this.target = target;
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
    }

    on(type, listener) {
        this.listeners[type] = this.listeners[type] || (this.listeners[type] = []);
        this.listeners[type].push(listener);
    }

    once(type, listener) {
        const wrapper = (...args) => {
            this.off(type, wrapper);
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

    /**
     * emit(event: Event)
     * emit(type, data = null, target = this)
     */
    emit(...args) {
        if (args[0] instanceof Event) {
            const event = args[0];
            if (this.listeners[event.type]) {
                [...this.listeners[event.type]].forEach(listener => listener.call(this, event));
            }
            return !event.defaultPrevented;
        } else {
            const [type, data = null, target = this] = args;
            return this.emit(new Event(type, data, target));
        }
    }
}
