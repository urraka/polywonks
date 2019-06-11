import { Select } from "./select.js";
import { PropertyItem } from "./propertysheet.item.js";

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
