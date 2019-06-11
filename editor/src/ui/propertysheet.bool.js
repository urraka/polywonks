import { PropertyListItem } from "./propertysheet.list.js";

export class PropertyBooleanItem extends PropertyListItem {
    constructor(key, label, value) {
        super(key, label, value, [
            { text: "Yes", value: true },
            { text: "No", value: false },
        ]);
    }
}
