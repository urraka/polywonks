import { EventEmitter, Event } from "../support/event.js";
import { elem } from "./common.js";

export class Select extends EventEmitter {
    constructor() {
        super();
        this.element = elem("div", "select");
        this.element.setAttribute("tabindex", 0);
        this.list = null;
        this.options = [];
        this.displayCount = 10;
        this.val = undefined;
        this.element.addEventListener("click", () => this.onClick());
        this.onWindowMouseDown = this.onWindowMouseDown.bind(this);
        this.onWindowMouseDown = this.onWindowMouseDown.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    addOption(text, value) {
        if (this.list) this.close();
        this.options.push({text, value});
    }

    set value(v) {
        if (v !== this.val) {
            const option = this.options.find(({value}) => v === value);

            if (option) {
                this.val = option.value;
                this.element.textContent = option.text;
            } else {
                this.val = undefined;
                this.element.textContent = "";
            }

            this.emit(new Event("change"));
        }
    }

    get value() {
        return this.val;
    }

    onClick() {
        if (!this.list) {
            this.open();
        } else {
            this.close();
        }
    }

    onOptionsClick(event) {
        if (event.target.classList.contains("select-item")) {
            let index = 0, item = event.target;
            while (item.previousElementSibling) {
                item = item.previousElementSibling;
                index++;
            }

            if (this.val !== this.options[index].value) {
                this.val = this.options[index].value;
                this.element.textContent = this.options[index].text;
                this.emit(new Event("change"));
            }

            this.close();
        }
    }

    onWindowMouseDown(event) {
        if (!this.element.contains(event.target) && !this.list.contains(event.target)) {
            this.close();
        }
    }

    onWindowScroll(event) {
        if (this.list !== event.target) {
            this.close();
        }
    }

    onWindowResize() {
        this.close();
    }

    onKeyDown(event) {
        if (event.key === "Escape") {
            this.close();
        }
    }

    open() {
        if (this.list) {
            this.close();
        }

        if (this.options.length === 0) {
            return;
        }

        const selectRect = this.element.getBoundingClientRect();
        this.list = elem("div", "select-options");
        this.list.style.width = selectRect.width + "px";
        this.list.style.left = selectRect.left + "px";
        this.list.style.top = selectRect.top + selectRect.height + "px";

        for (const {text} of this.options) {
            const item = elem("div", "select-item");
            item.textContent = text;
            this.list.append(item);
        }

        document.body.append(this.list);

        const itemRect = this.list.firstElementChild.getBoundingClientRect();
        const n = Math.min(this.options.length, this.displayCount);
        const height = Math.min(window.innerHeight, n * itemRect.height);
        this.list.style.height = height + "px";
        if (selectRect.top + selectRect.height + height > window.innerHeight) {
            this.list.style.top = Math.max(0, selectRect.top - height) + "px";
        }

        this.list.addEventListener("click", e => this.onOptionsClick(e));
        window.addEventListener("mousedown", this.onWindowMouseDown, true);
        window.addEventListener("scroll", this.onWindowMouseDown, true);
        window.addEventListener("resize", this.onWindowResize, true);
        document.addEventListener("keydown", this.onKeyDown, true);

        this.element.classList.add("active");
    }

    close() {
        if (this.list) {
            window.removeEventListener("mousedown", this.onWindowMouseDown, true);
            window.removeEventListener("scroll", this.onWindowMouseDown, true);
            window.removeEventListener("resize", this.onWindowResize, true);
            document.removeEventListener("keydown", this.onKeyDown, true);
            this.list.remove();
            this.list = null;
            this.element.classList.remove("active");
        }
    }
}
