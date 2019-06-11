import { TextBox } from "./textbox.js";
import { PropertyItem } from "./propertysheet.item.js";

export class PropertyTextItem extends PropertyItem {
    constructor(key, label, value, ...args) {
        super(key, label, value, ...args);
    }

    get currentValue() {
        return this._currentValue || (this._currentValue = this.value);
    }

    set currentValue(value) {
        this._currentValue = value;
    }

    get immediateChange() {
        if (this._immediateChange !== undefined) {
            return this._immediateChange;
        } else {
            return this.sheet ? !!this.sheet._immediateChange : false;
        }
    }

    set immediateChange(value) {
        this._immediateChange = !!value;
    }

    get placeholder() {
        return this.control.placeholder;
    }

    set placeholder(value) {
        this.control.placeholder = value;
    }

    createControl({ valueEquals, valueToString, valueFromString } = {}) {
        this.valueEquals = valueEquals || this.valueEquals;
        this.valueToString = valueToString || this.valueToString;
        this.valueFromString = valueFromString || this.valueFromString;

        const control = this.createTextControl();
        control.on("input", () => this.onInput());
        control.on("change", () => this.onChange());
        control.on("keydown", e => this.onKeyDown(e.keyEvent));
        return control;
    }

    createTextControl() {
        return new TextBox();
    }

    onInput() {
        if (this.immediateChange) {
            this.onChange();
        } else {
            const valueString = this.valueToString(this.value);
            this.control.modified = this.control.value !== valueString;
            try {
                this.currentValue = this.valueFromString(this.control.value);
                this.control.invalid = false;
            } catch (e) { }
            this.emit("input");
        }
    }

    onChange() {
        try {
            this.control.invalid = false;
            this.value = this.valueFromString(this.control.value);
            this.currentValue = this.value;
            this.control.reset(this.valueToString(this.value));
            this.control.modified = false;
        } catch (e) {
            this.control.invalid = true;
        }
    }

    onKeyDown(event) {
        if (!this.immediateChange) {
            if (event.key === "Escape") {
                event.stopPropagation();
                this.revert();
            } else if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                this.onChange();
            }
        }
    }

    reset(value) {
        this.control.invalid = false;
        this.control.modified = false;
        this.control.reset(this.valueToString(value));
        this.currentValue = value;
        super.reset(value);
    }

    revert() {
        const prevValue = this.control.value;
        this.reset(this.value);
        if (this.control.value !== prevValue) {
            this.emit("input");
        }
    }

    valueToString(value) {
        return value.toString();
    }

    valueFromString(str) {
        return str;
    }
}
