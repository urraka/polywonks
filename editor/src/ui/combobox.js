import { elem } from "./common.js";
import { Select } from "./select.js";

export class ComboBox extends Select {
    constructor() {
        super();
        this.element.removeAttribute("tabindex")
        this.element.classList.add("combobox");
        this.unfilteredOptions = [];
        this.input = elem("input");
        this.element.append(this.input);
        this.onTextInput = this.onTextInput.bind(this);
        this.onTextChange = this.onTextChange.bind(this);
        this.input.addEventListener("keydown", e => this.onInputKeyDown(e));
        this.input.addEventListener("input", this.onTextInput);
        this.input.addEventListener("change", this.onTextChange);
    }

    set value(v) {
        if (v !== this.val) {
            this.val = v;
            this.input.value = v;
        }
    }

    get value() {
        return this.input.value;
    }

    addOption(text, value) {
        super.addOption(text, value);
        const option = this.options.pop();
        option.textLowercased = option.text.toLowerCase();
        this.unfilteredOptions.push(option);
    }

    setText(text) {
        this.input.value = text;
    }

    selectOption(option) {
        this.input.removeEventListener("change", this.onTextChange);
        super.selectOption(option);
        this.input.addEventListener("change", this.onTextChange);
    }

    filterOptions() {
        const filter = this.input.value.toLowerCase();
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
            this.input.focus();
        }
    }

    onInputKeyDown(event) {
        switch (event.key) {
            case "ArrowDown": event.preventDefault(); break;
            case "ArrowUp": event.preventDefault(); break;
            case "Backspace": if (this.input.value === "") this.close(); break;
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
        this.val = this.input.value;
        this.filterOptions();
        if (!this.list) {
            this.open();
        }
    }

    onTextChange() {
        this.val = this.input.value;
        this.emit("change");
    }
}
