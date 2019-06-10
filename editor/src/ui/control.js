import { EventEmitter } from "../common/event.js";

export class Control extends EventEmitter {
    reset(value) {
        this._value = value;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        const prevValue = this.value;
        this.reset(value);
        if (this.value !== prevValue) {
            this.emit("change");
        }
    }

    get readOnly() {
        return this.element.classList.contains("readonly");
    }

    set readOnly(value) {
        this.element.classList.toggle("readonly", value);
    }

    get modified() {
        return this.element.classList.contains("modified");
    }

    set modified(value) {
        this.element.classList.toggle("modified", value);
    }

    get invalid() {
        return this.element.classList.contains("invalid");
    }

    set invalid(value) {
        this.element.classList.toggle("invalid", value);
    }
}
