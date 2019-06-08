import { elem, registerStyles } from "./common.js";
import { Control } from "./control.js";
import { styles } from "./textbox.styles.js";

registerStyles(styles);

export class TextBox extends Control {
    constructor() {
        super();
        this.input = elem("input");
        this.input.spellcheck = false;
        this.element = elem("div", "textbox");
        this.element.append(this.input);
        this.onInput = this.onInput.bind(this);
        this.onChange = this.onChange.bind(this);
        this.input.addEventListener("input", this.onInput);
        this.input.addEventListener("change", this.onChange);
        this.input.addEventListener("keydown", e => this.emit("keydown", { keyEvent: e }));
    }

    addButton(key, icon, title) {
        const button = this.element.appendChild(elem("button", icon));
        if (title) button.setAttribute("title", title);
        button.addEventListener("click", () => this.emit("buttonclick", { button: key }));
        return button;
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
        for (const button of this.element.querySelectorAll("button")) {
            button.disabled = value;
        }
    }

    get placeholder() {
        return this.input.placeholder;
    }

    set placeholder(value) {
        this.input.placeholder = value;
    }

    get active() {
        return this.element.classList.contains("active");
    }

    set active(value) {
        this.element.classList.toggle("active", value);
    }
}
