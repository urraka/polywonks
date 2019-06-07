import { EventEmitter } from "../support/event.js";
import { iter } from "../support/iter.js";
import { Color } from "../support/color.js";
import { elem, registerStyles } from "./common.js";
import { Panel } from "./panel.js";
import { Select } from "./select.js";
import { ComboBox } from "./combobox.js";
import { TextBox } from "./textbox.js";
import { ColorPicker } from "./colorpicker.js";
import { styles } from "./propertysheet.styles.js";

registerStyles(styles);

export class PropertySheet extends Panel {
    constructor() {
        super("property-sheet");
        this.properties = {};
        this.onChange = this.onChange.bind(this);
    }

    get immediateChange() {
        return !!this._immediateChange;
    }

    set immediateChange(value) {
        this._immediateChange = !!value;
    }

    addProperty(property) {
        const key = property.key;
        this.clear(property);
        this.properties[key] = property;
        this.element.append(property.label);
        this.element.append(property.control.element);
        property.on("change", this.onChange);
        property.sheet = this;
        return property;
    }

    clear(property) {
        if (property) {
            const key = property.key;
            if (key in this.properties) {
                property = this.properties[key];
                property.sheet = null;
                property.off("change", this.onChange);
                property.label.remove();
                property.control.element.remove();
                delete this.properties[key];
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
    constructor(key, label, value, ...args) {
        super(key, label, value, ...args);
    }

    get immediateChange() {
        if (this._immediateChange !== undefined) {
            return this._immediateChange;
        } else {
            return !!this.sheet._immediateChange;
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
            if (this.control.invalid) {
                try {
                    this.valueFromString(this.control.value);
                    this.control.invalid = false;
                } catch (e) { }
            }
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

export class PropertyColorItem extends PropertyTextItem {
    constructor(key, label, color) {
        super(key, label, color, {
            valueToString: color => color.toString(),
            valueFromString: str => new Color(str),
            valueEquals: (a, b) => a.equals(b),
        });
    }

    get button() {
        return this._button || (this._button = this.control.element.querySelector(".color-icon-button > span"));
    }

    createTextControl() {
        const textbox = super.createTextControl();
        const button = textbox.addButton("color");
        button.classList.add("color-icon-button");
        button.appendChild(elem("span"));
        textbox.on("buttonclick", () => this.onColorIconClick());
        return textbox;
    }

    reset(value) {
        super.reset(value);
        this.updateColor(this.value);
    }

    updateColor(color) {
        this._currentColor = color;
        this.button.style.backgroundColor = color.toString("rgba");
        if (this.picker) {
            this.picker.reset(color);
        }
    }

    onColorIconClick() {
        if (this.picker) {
            this.picker.close("iconclick");
        } else {
            this.picker = ColorPicker.show(this.control.element, this._currentColor || this.value);
            this.picker.on("change", () => this.onColorPickerChange());
            this.picker.on("willclose", e => this.onColorPickerWillClose(e));
            this.picker.on("close", e => this.onColorPickerClose(e));
            this.control.active = true;
        }
    }

    onColorPickerWillClose(event) {
        if (event.reason === "focuslost" && this.control.element.contains(event.originalEvent.relatedTarget)) {
            event.preventDefault();
        }
    }

    onColorPickerClose(event) {
        const pickerColor = this.picker.color;
        this.picker = null;
        const focusBack = event.reason === "iconclick" || (event.reason === "focuslost" &&
            this.control.element.contains(event.originalEvent.relatedTarget));
        if (event.reason === "cancel") {
            this.reset(this.value);
        } else if (this.control.modified) {
            this.control.reset(this.valueToString(pickerColor));
            this.onChange();
        }
        if (event.reason !== "focuslost" || focusBack) {
            const i = this.control.value.length;
            this.control.input.focus();
            this.control.input.setSelectionRange(i, i);
        }
        setTimeout(() => this.control.active = false);
    }

    onColorPickerChange() {
        this.control.reset(this.valueToString(this.picker.color));
        this.onInput();
    }

    onInput() {
        super.onInput();
        if (!this.immediateChange) {
            try {
                this.updateColor(this.valueFromString(this.control.value));
            } catch (e) {}
        }
    }

    onKeyDown(event) {
        if (!this.control.active) {
            super.onKeyDown(event);
        }
    }
}
