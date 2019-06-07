import { elem, registerStyles } from "./common.js";
import { Control } from "./control.js";
import { styles } from "./select.styles.js";

registerStyles(styles);

export class Select extends Control {
    constructor() {
        super();
        this.label = elem("label");
        this.element = elem("div", "select");
        this.element.setAttribute("tabindex", 0);
        this.element.append(this.label);
        this.list = null;
        this.options = [];
        this.displayCount = 10;
        this.onWindowScrollOrMouseDown = this.onWindowScrollOrMouseDown.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.element.addEventListener("click", () => this.onClick());
        this.element.addEventListener("keydown", this.onKeyDown);
        this.element.addEventListener("focusout", e => this.onFocusOut(e));
    }

    reset(value) {
        this.resetOption(this.options.find(opt => value === opt.value));
    }

    set value(value) {
        this.selectOption(this.options.find(opt => value === opt.value));
    }

    get value() {
        return super.value;
    }

    set readOnly(value) {
        this.close();
        super.readOnly = value;
        if (value) {
            this.element.removeAttribute("tabindex");
        } else {
            this.element.setAttribute("tabindex", 0);
        }
    }

    get readOnly() {
        return super.readOnly;
    }

    addOption(text, value) {
        if (this.list) this.close();
        this.options.push({ text, value });
    }

    setText(text) {
        this.label.textContent = text;
    }

    selectOption(option) {
        const value = this.value;
        this.resetOption(option);
        if (this.value !== value) {
            this.emit("change");
        }
    }

    resetOption(option) {
        if (option && this.value !== option.value) {
            super.reset(option.value);
            this.setText(option.text);
        } else if (!option && this.value !== undefined) {
            super.reset(undefined);
            this.setText("");
        }
    }

    onClick() {
        if (!this.list) {
            this.open();
        } else {
            this.close();
        }
    }

    onFocusOut(event) {
        if (this.list && event.relatedTarget && this.list.contains(event.relatedTarget)) {
            this.element.focus();
        } else {
            this.close();
        }
    }

    onOptionsClick(event) {
        if (event.target.classList.contains("current")) {
            this.submit();
        }
    }

    onOptionsMouseOver(event) {
        if (event.target.classList.contains("select-item")) {
            this.list.querySelector(".current").classList.remove("current");
            event.target.classList.add("current");
        }
    }

    onWindowScrollOrMouseDown(event) {
        if (!this.element.contains(event.target) && !this.list.contains(event.target)) {
            this.close();
        }
    }

    onWindowResize() {
        this.close();
    }

    onKeyDown(event) {
        let handled = true;

        switch (event.key) {
            case "Enter": {
                if (this.list) {
                    this.submit();
                } else if (!this.modified) {
                    this.open();
                    handled = !!this.list;
                } else {
                    handled = false;
                }
                break;
            }
            case "Escape": this.list ? this.close() : (handled = false); break;
            case "ArrowUp": this.selectPrevious(); break;
            case "ArrowDown": this.selectNext(); break;
            default: handled = false;
        }

        if (handled) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            this.emit("keydown", { keyEvent: event });
        }
    }

    get activeOption() {
        if (this.list) {
            let index = 0;
            let item = this.list.querySelector(".current");
            while (item.previousElementSibling) {
                item = item.previousElementSibling;
                index++;
            }
            return this.options[index];
        } else {
            return null;
        }
    }

    submit() {
        this.selectOption(this.activeOption);
        this.close();
    }

    selectPrevious() {
        if (this.list) {
            const item = this.list.querySelector(".current");
            const prev = item.previousElementSibling;
            if (prev) {
                item.classList.remove("current");
                prev.classList.add("current");
                this.scrollToItem(prev);
            }
        } else if (!this.readOnly) {
            const index = this.options.findIndex(({ value }) => value === this.value) - 1;
            if (index >= 0) {
                this.selectOption(this.options[index]);
            }
        }
    }

    selectNext() {
        if (this.list) {
            const item = this.list.querySelector(".current");
            const next = item.nextElementSibling;
            if (next) {
                item.classList.remove("current");
                next.classList.add("current");
                this.scrollToItem(next);
            }
        } else if (!this.readOnly) {
            const index = this.options.findIndex(({ value }) => value === this.value) + 1;
            if (index < this.options.length) {
                this.selectOption(this.options[index]);
            }
        }
    }

    scrollToItem(item) {
        if (item.offsetTop < this.list.scrollTop) {
            item.scrollIntoView({ block: "start" });
        } else if (item.offsetTop + item.offsetHeight > this.list.scrollTop + this.list.clientHeight) {
            item.scrollIntoView({ block: "end" });
        }
    }

    updateListItems() {
        while (this.list.firstChild) {
            this.list.firstChild.remove();
        }

        let currentItem = null;

        for (const { text, value } of this.options) {
            const item = elem("div", "select-item");
            this.list.append(item);
            item.textContent = text;
            if (value === this.value && !currentItem) {
                currentItem = item;
            }
        }

        currentItem = currentItem || this.list.firstElementChild;
        currentItem.classList.add("current");

        const selectRect = this.element.getBoundingClientRect();
        const itemRect = currentItem.getBoundingClientRect();
        const n = Math.min(this.options.length, this.displayCount);
        const height = Math.min(window.innerHeight, n * itemRect.height);

        this.list.style.left = selectRect.left + "px";
        this.list.style.top = selectRect.top + selectRect.height + "px";
        this.list.style.width = selectRect.width + "px";
        this.list.style.height = height + "px";

        if (selectRect.top + selectRect.height + height > window.innerHeight) {
            this.list.style.top = Math.max(0, selectRect.top - height) + "px";
        }

        return currentItem;
    }

    open() {
        if (this.list) {
            this.close();
        }

        if (this.readOnly || this.options.length === 0) {
            return;
        }

        this.list = elem("div", "select-options");
        this.list.setAttribute("tabindex", -1);
        document.body.append(this.list);

        this.list.addEventListener("click", e => this.onOptionsClick(e));
        this.list.addEventListener("mouseover", e => this.onOptionsMouseOver(e));
        window.addEventListener("mousedown", this.onWindowScrollOrMouseDown, true);
        window.addEventListener("scroll", this.onWindowScrollOrMouseDown, true);
        window.addEventListener("resize", this.onWindowResize, true);

        const currentItem = this.updateListItems();
        currentItem.scrollIntoView({ block: "center" });
        this.element.classList.add("active");
    }

    close() {
        if (this.list) {
            window.removeEventListener("mousedown", this.onWindowScrollOrMouseDown, true);
            window.removeEventListener("scroll", this.onWindowScrollOrMouseDown, true);
            window.removeEventListener("resize", this.onWindowResize, true);
            this.list.remove();
            this.list = null;
            this.element.classList.remove("active");
            this.element.focus();
        }
    }
}
