import { Panel, elem } from "./common.js";
import { EventEmitter, Event } from "../support/event.js";
import { ValueType } from "../support/type.js";
import { Select } from "./select.js";

export class PropertyItem extends EventEmitter {
    constructor(key, value, type, title) {
        super();
        this.key = key;
        this.value = value;
        this.type = type;
        this.label = elem("label");
        this.label.textContent = title;
        this.onTextChange = this.onTextChange.bind(this);

        if (type.toString() === "enum") {
            this.input = new Select();
            [...type.names()].forEach(name => this.input.addOption(name, name));
            this.input.value = value;
            this.input.on("change", () => this.onSelectChange());
        } else {
            this.input = elem("input");
            this.input.value = ValueType.toString(type, value);
            this.input.addEventListener("change", this.onTextChange);
            this.input.addEventListener("input", () => this.onTextInput());
            this.input.addEventListener("keydown", e => this.onTextKeyDown(e));
        }
    }

    onSelectChange() {
        this.value = this.input.value;
        this.emit(new Event("change"));
    }

    onTextInput() {
        const strval = ValueType.toString(this.type, this.value);
        this.input.classList.toggle("modified", this.input.value !== strval);
    }

    onTextChange() {
        const strval = ValueType.toString(this.type, this.value);
        this.input.classList.remove("invalid");

        if (this.input.value !== strval) {
            try {
                const val = this.value;
                this.value = ValueType.fromString(this.type, this.input.value);
                this.input.classList.remove("modified");
                this.input.removeEventListener("change", this.onTextChange);
                this.input.value = ValueType.toString(this.type, this.value);
                this.input.addEventListener("change", this.onTextChange);
                if (!ValueType.equals(this.type, val, this.value)) {
                    this.emit(new Event("change"));
                }
            } catch (e) {
                this.input.classList.add("invalid");
            }
        }
    }

    onTextKeyDown(event) {
        if (event.key === "Escape" && (
            this.input.classList.contains("modified") ||
            this.input.classList.contains("invalid")
        )) {
            this.input.removeEventListener("change", this.onTextChange);
            this.input.value = ValueType.toString(this.type, this.value);
            this.input.addEventListener("change", this.onTextChange);
            this.input.classList.remove("modified");
            this.input.classList.remove("invalid");
        }
    }
}

export class PropertySheet extends Panel {
    constructor() {
        super("property-sheet");
        this.columns = ["property-labels", "property-inputs"].map(cls => this.append(elem("div", cls)));
    }

    addProperty(key, value, type, title = key) {
        const property = new PropertyItem(key, value, type, title);
        this.columns[0].append(property.label);
        this.columns[1].append(property.input.element || property.input);
        property.on("change", () => this.emit(new Event("propertychange", { property })));
    }

    clear() {
        this.columns.forEach(col => [...col.childNodes].forEach(e => e.remove()));
    }
}
