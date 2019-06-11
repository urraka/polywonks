import { EventEmitter } from "../common/event.js";
import { elem } from "./common.js";

export class PropertyItem extends EventEmitter {
    constructor(key, label, value, ...args) {
        super();
        this.sheet = null;
        this.key = key;
        this.label = elem("label");
        this.label.textContent = label;
        this.control = this.createControl(...args);
        this.reset(value);
    }

    createControl() {
        throw new Error("Must implement");
    }

    valueEquals(a, b) {
        return a === b;
    }

    reset(value) {
        this._value = value;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        const prevValue = this._value;
        this.reset(value);
        if (!this.valueEquals(prevValue, this._value)) {
            this.emit("change");
        }
    }

    get readOnly() {
        return this.control.readOnly;
    }

    set readOnly(value) {
        this.control.readOnly = value;
        this.label.classList.toggle("readonly", value);
    }
}
