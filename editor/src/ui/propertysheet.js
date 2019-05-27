import { EventEmitter } from "../support/event.js";
import { iter } from "../support/iter.js";
import { Panel, elem } from "./common.js";
import { Select } from "./select.js";
import { ComboBox } from "./combobox.js";
import { TextBox } from "./textbox.js";

export class PropertySheet extends Panel {
    constructor() {
        super("property-sheet");
        this.properties = {};
        this.onChange = this.onChange.bind(this);
    }

    addProperty(property) {
        const key = property.key;
        if (key in this.properties) {
            this.properties[key].off("change", this.onChange);
            this.properties[key].label.remove();
            this.properties[key].control.element.remove();
        }
        this.properties[key] = property;
        this.element.append(property.label);
        this.element.append(property.control.element);
        property.on("change", this.onChange);
        return property;
    }

    clear(property) {
        if (property) {
            if (property.key in this.properties) {
                property.off("change", this.onChange);
                property.label.remove();
                property.control.element.remove();
                delete this.properties[property.key];
            }
        } else {
            iter(Object.values(this.properties)).each(property => this.clear(property));
        }
    }

    onChange(event) {
        this.emit("propertychange", { property: event.target });
    }
}

export class PropertyItem extends EventEmitter {
    constructor(key, label, value, ...args) {
        super();
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

export class PropertyListItem extends PropertyItem {
    constructor(key, label, value, options) {
        super(key, label, value, options);
    }

    createControl(options) {
        const control = new Select();
        options.forEach(option => control.addOption(option.text, option.value));
        control.on("change", () => this.onSelectChange());
        return control;
    }

    onSelectChange() {
        this.value = this.control.value;
        this.emit("change");
    }

    reset(value) {
        this.control.reset(value);
        super.reset(this.control.value);
    }
}

export class PropertyBooleanItem extends PropertyListItem {
    constructor(key, label, value) {
        super(key, label, value, [
            { text: "Yes", value: true },
            { text: "No", value: false },
        ]);
    }
}

export class PropertyTextItem extends PropertyItem {
    constructor(key, label, value, valueHandlers) {
        super(key, label, value, valueHandlers);
        this._immediateChange = false;
    }

    get immediateChange() {
        return !!this._immediateChange;
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
        }
    }

    onChange() {
        try {
            this.control.invalid = false;
            this.value = this.valueFromString(this.control.value);
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
                this.reset(this.value);
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
        super.reset(value);
    }

    valueToString(value) {
        return value.toString();
    }

    valueFromString(str) {
        return str;
    }
}

export class PropertyComboItem extends PropertyTextItem {
    constructor(key, label, value, options, valueHandlers) {
        super(key, label, value, options, valueHandlers);
    }

    createControl(options, valueHandlers) {
        const control = super.createControl(valueHandlers);
        options.forEach(option => control.addOption(option.text, option.value));
        return control;
    }

    createTextControl() {
        return new ComboBox();
    }
}
