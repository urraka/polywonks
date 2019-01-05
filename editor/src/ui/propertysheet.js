import { Panel, elem } from "./common.js";

export class PropertySheet extends Panel {
    constructor() {
        super("property-sheet");
        this.inputs = {};
        this.columns = [
            this.append(elem("div", "property-labels")),
            this.append(elem("div", "property-inputs"))
        ];
    }

    addProperty(key, value, displayName = key) {
        const label = elem("label");
        const input = elem("input");

        label.textContent = displayName;
        input.value = value !== null ? value.toString() : "N/A";

        this.columns[0].append(label);
        this.columns[1].append(input);
        this.inputs[key] = input;
    }

    setValue(key, value) {
        if (key in this.inputs) {
            const input = this.inputs[key];
            input.value = value !== null ? value.toString() : "N/A";
        }
    }

    clear() {
        this.inputs = {};
        [...this.columns[0].querySelectorAll(":scope > *")].forEach(e => e.remove());
        [...this.columns[1].querySelectorAll(":scope > *")].forEach(e => e.remove());
    }
}
