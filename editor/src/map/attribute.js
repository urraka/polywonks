import { ValueType } from "../common/type.js";

export class Attribute {
    constructor(dataType, value) {
        this.dataType = dataType;
        this.value = value;
    }

    get value() {
        return this.val;
    }

    set value(value) {
        try {
            value = ValueType.sanitize(this.dataType, value);
        } catch (e) {
            value = ValueType.defaultValue(this.dataType);
        }

        this.val = value;
    }
}
