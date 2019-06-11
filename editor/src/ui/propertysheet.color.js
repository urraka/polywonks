import { Color } from "../common/color.js";
import { elem } from "./common.js";
import { ColorPicker } from "./colorpicker.js";
import { PropertyTextItem } from "./propertysheet.text.js";

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
        this.updateColor();
    }

    updateColor() {
        this.button.style.backgroundColor = this.currentValue.toString("rgba");
        if (this.picker) {
            this.picker.reset(this.currentValue);
        }
    }

    onColorIconClick() {
        if (this.picker) {
            this.picker.close("iconclick");
        } else {
            this.picker = ColorPicker.show(this.control.element, this.currentValue);
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
        const focusBack = event.reason === "iconclick" || (event.reason === "focuslost" &&
            this.control.element.contains(event.originalEvent.relatedTarget));
        if (event.reason === "cancel") {
            this.revert();
        } else if (this.control.modified) {
            this.onColorPickerChange();
            this.onChange();
        }
        if (event.reason !== "focuslost" || focusBack) {
            const i = this.control.value.length;
            this.control.input.focus();
            this.control.input.setSelectionRange(i, i);
        }
        setTimeout(() => {
            this.picker = null;
            this.control.active = false;
        });
    }

    onColorPickerChange() {
        this.control.reset(this.valueToString(this.picker.color));
        this.onInput();
    }

    onInput() {
        super.onInput();
        if (!this.immediateChange) {
            this.updateColor();
        }
    }

    onKeyDown(event) {
        if (!this.picker) {
            super.onKeyDown(event);
        }
    }
}
