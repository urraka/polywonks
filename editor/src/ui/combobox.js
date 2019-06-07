import { registerStyles } from "./common.js";
import { Select } from "./select.js";
import { TextBox } from "./textbox.js";

registerStyles(/* css */`
.combobox::after {
    content: none;
    display: none;
}

.combobox > .textbox:focus, .combobox > .textbox:focus-within {
    outline: none;
}
`);

export class ComboBox extends Select {
    constructor() {
        super();
        this.label.remove();
        this.element.removeAttribute("tabindex")
        this.element.classList.add("combobox");
        this.unfilteredOptions = [];
        this.textBox = new TextBox();
        this.element.append(this.textBox.element);
        this.textBox.on("keydown", e => this.onTextKeyDown(e.keyEvent));
        this.textBox.on("input", () => this.onTextInput());
        this.textBox.on("change", () => this.emit("change"));
    }

    addOption(text, value) {
        super.addOption(text, value);
        const option = this.options.pop();
        option.textLowercased = option.text.toLowerCase();
        this.unfilteredOptions.push(option);
    }

    selectOption(option) {
        this.value = option.value;
    }

    reset(value) {
        this.textBox.reset(value);
    }

    set value(value) {
        this.textBox.value = value;
    }

    get value() {
        return this.textBox.value;
    }

    set readOnly(value) {
        this.textBox.readOnly = value;
        super.readOnly = value;
    }

    get readOnly() {
        return super.readOnly;
    }

    filterOptions() {
        const filter = this.value.toLowerCase();
        this.options = this.unfilteredOptions.filter(({ textLowercased }) => textLowercased.includes(filter));

        if (this.options.length === 0) {
            this.close();
        } else if (this.list) {
            const active = this.updateListItems();
            active.classList.remove("current");
            this.list.firstElementChild.classList.add("current");
            this.list.scrollTop = 0;
        }
    }

    open() {
        this.filterOptions();
        super.open();
    }

    close() {
        if (this.list) {
            super.close();
            this.textBox.input.focus();
        }
    }

    onTextKeyDown(event) {
        switch (event.key) {
            case "ArrowDown": event.preventDefault(); break;
            case "ArrowUp": event.preventDefault(); break;
            case "Backspace": if (this.textBox.value === "") this.close(); break;
            case "Tab": {
                if (this.list) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.selectOption(this.activeOption);
                }
                break;
            }
        }
    }

    onTextInput() {
        this.filterOptions();
        if (!this.list) {
            this.open();
        }
        this.emit("input");
    }
}
