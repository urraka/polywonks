import { Panel, elem } from "./common.js";
import { EventEmitter, Event } from "../support/event.js";
import { ValueType } from "../support/type.js";
import { Select } from "./select.js";
import { ComboBox } from "./combobox.js";

export class PropertySheet extends Panel {
    constructor() {
        super("property-sheet");
        this.columns = ["property-labels", "property-controls"].map(cls => this.append(elem("div", cls)));
        this.properties = {};
    }

    addProperty(key, value, type, title = key, autocomplete = null) {
        const property = new PropertyItem(key, value, type, title, autocomplete);
        this.properties[key] = property;
        this.columns[0].append(property.label);
        this.columns[1].append(property.control.element || property.control);
        property.on("change", () => this.emit(new Event("propertychange", { property })));
    }

    clear() {
        this.properties = {};
        this.columns.forEach(col => [...col.childNodes].forEach(e => e.remove()));
    }
}

export class PropertyItem extends EventEmitter {
    constructor(key, value, type, title, autocomplete = null) {
        super();
        this.key = key;
        this.value = value;
        this.type = type;
        this.label = elem("label");
        this.label.textContent = title;
        this.onTextChange = this.onTextChange.bind(this);
        this.onSelectChange = this.onSelectChange.bind(this);

        switch (ValueType.typeOf(type)) {
            case "enum": {
                this.control = new Select();
                [...type.names()].forEach(name => this.control.addOption(name, name));
                this.control.value = value;
                this.control.on("change", this.onSelectChange);
                break;
            }

            case "array": {
                this.control = new Select();
                type.forEach(item => this.control.addOption(item.toString(), item));
                this.control.value = value;
                this.control.on("change", this.onSelectChange);
                break;
            }

            default: {
                if (autocomplete) {
                    this.control = new ComboBox();
                    autocomplete.forEach(item => this.control.addOption(item, item));
                    this.control.value = value;
                    this.control.input.addEventListener("change", this.onTextChange);
                    this.control.input.addEventListener("input", () => this.onTextInput());
                } else {
                    this.control = elem("input");
                    this.control.value = ValueType.toString(type, value);
                    this.control.addEventListener("change", this.onTextChange);
                    this.control.addEventListener("input", () => this.onTextInput());
                    this.control.addEventListener("keydown", e => this.onTextKeyDown(e));
                }
            }
        }
    }

    onSelectChange() {
        this.value = this.control.value;
        this.emit(new Event("change"));
    }

    onTextInput() {
        const strval = ValueType.toString(this.type, this.value);
        this.toggleState("modified", this.control.value !== strval);
    }

    onTextChange() {
        this.submit();
    }

    onTextKeyDown(event) {
        if (event.key === "Escape") {
            event.stopPropagation();
            if (this.hasState("modified") || this.hasState("invalid")) {
                this.reset(this.value);
            }
        } else if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            this.submit(true);
        }
    }

    reset(value) {
        this.value = value;

        if (this.control instanceof Select) {
            this.control.off("change");
            this.control.value = value;
            this.control.on("change", this.onSelectChange);
        } else {
            this.input.removeEventListener("change", this.onTextChange);
            this.control.value = ValueType.toString(this.type, value);
            this.input.addEventListener("change", this.onTextChange);
            this.toggleState("modified", false);
            this.toggleState("invalid", false);
        }
    }

    submit(force = false) {
        const strval = ValueType.toString(this.type, this.value);
        this.toggleState("invalid", false);

        if (force || this.control.value !== strval) {
            try {
                const val = this.value;
                this.value = ValueType.fromString(this.type, this.control.value);
                this.toggleState("modified", false);
                this.input.removeEventListener("change", this.onTextChange);
                this.control.value = ValueType.toString(this.type, this.value);
                this.input.addEventListener("change", this.onTextChange);
                if (force || !ValueType.equals(this.type, val, this.value)) {
                    this.emit(new Event("change"));
                }
            } catch (e) {
                this.toggleState("invalid", true);
            }
        }
    }

    toggleState(state, enable) {
        (this.control.classList || this.control.element.classList).toggle(state, enable);
    }

    hasState(state) {
        (this.control.classList || this.control.element.classList).contains(state);
    }

    get input() {
        return this.control instanceof ComboBox ? this.control.input : this.control;
    }
}
