import { Panel, elem } from "./common.js";
import { EventEmmiter, Event } from "../support/event.js";
import { ValueType } from "../support/type.js";

export class PropertyItem extends EventEmmiter {
    constructor(key, value, type, title) {
        super();
        this.key = key;
        this.value = value;
        this.type = type;
        this.label = elem("label");
        this.input = elem("input");
        this.label.textContent = title;
        this.input.value = ValueType.toString(type, value);
        this.onChange = this.onChange.bind(this);
        this.input.addEventListener("change", this.onChange);
    }

    onChange() {
        const strval = ValueType.toString(this.type, this.value);
        if (this.input.value !== strval) {
            try {
                const val = this.value;
                this.value = ValueType.fromString(this.type, this.input.value);
                this.input.removeEventListener("change", this.onChange);
                this.input.value = ValueType.toString(this.type, this.value);
                this.input.addEventListener("change", this.onChange);
                if (!ValueType.equals(this.type, val, this.value)) {
                    this.emit(new Event("change"));
                }
            } catch (e) {
                this.input.classList.add("invalid");
            }
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
        this.columns[1].append(property.input);
        property.on("change", () => this.emit(new Event("propertychange", { property })));
    }

    clear() {
        this.columns.forEach(col => [...col.childNodes].forEach(e => e.remove()));
    }
}
