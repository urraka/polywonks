import { elem } from "./common.js";
import { Control } from "./control.js";

export class TextBox extends Control {
    constructor() {
        super();
        this.input = elem("input");
        this.element = elem("div", "textbox");
        this.element.append(this.input);
        this.onInput = this.onInput.bind(this);
        this.onChange = this.onChange.bind(this);
        this.input.addEventListener("input", this.onInput);
        this.input.addEventListener("change", this.onChange);
        this.input.addEventListener("keydown", e => this.emit("keydown", { keyEvent: e }));
    }

    addButton() {
        // TODO: implement
    }

    onInput() {
        this.emit("input");
    }

    onChange() {
        this.emit("change");
    }

    reset(value) {
        this.input.removeEventListener("input", this.onInput);
        this.input.removeEventListener("change", this.onChange);
        this.input.value = value;
        this.input.addEventListener("input", this.onInput);
        this.input.addEventListener("change", this.onChange);
    }

    get value() {
        return this.input.value;
    }

    set value(value) {
        super.value = value;
    }

    get readOnly() {
        return this.input.readOnly;
    }

    set readOnly(value) {
        super.readOnly = value;
        this.input.readOnly = value;
    }

    get placeholder() {
        return this.input.placeholder;
    }

    set placeholder(value) {
        this.input.placeholder = value;
    }
}
