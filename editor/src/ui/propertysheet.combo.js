import { ComboBox } from "./combobox.js";
import { PropertyTextItem } from "./propertysheet.text.js";

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
