import { iter } from "../common/iter.js";
import { registerStyles } from "./common.js";
import { Panel } from "./panel.js";
import { styles } from "./propertysheet.styles.js";

registerStyles(styles);

export class PropertySheet extends Panel {
    constructor() {
        super("property-sheet");
        this.properties = {};
        this.onInput = this.onInput.bind(this);
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
        property.on("input", this.onInput);
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
                property.off("input", this.onInput);
                property.off("change", this.onChange);
                property.label.remove();
                property.control.element.remove();
                delete this.properties[key];
            }
        } else {
            iter(Object.values(this.properties)).each(property => this.clear(property));
        }
    }

    onInput(event) {
        this.emit("propertyinput", { property: event.target });
    }

    onChange(event) {
        this.emit("propertychange", { property: event.target });
    }
}
