import { elem, registerStyles } from "./common.js";
import { Panel } from "./panel.js";
import { styles } from "./statusbar.styles.js";

registerStyles(styles);

export class Statusbar extends Panel {
    constructor() {
        super("statusbar");
        this.items = new Map();
        this.left = this.append(new StatusbarPanel(this));
        this.right = this.append(new StatusbarPanel(this));
    }

    itemType(key) {
        const item = this.items.get(key);
        if (item) {
            switch (item.tagName) {
                case "DIV": return "text";
                case "BUTTON": return "button";
            }
        }
    }

    set(key, value) {
        this.items.get(key).textContent = value;
    }

    toggle(key, value) {
        this.items.get(key).classList.toggle("active", value);
    }
}

export class StatusbarPanel extends Panel {
    constructor(statusbar) {
        super();
        this.statusbar = statusbar;
    }

    addItem(key, type = "div") {
        const item = this.append(elem(type, "statusbar-item"));
        this.statusbar.items.set(key, item);
        return item;
    }

    addTextItem(key, width, textAlign = null) {
        const item = this.addItem(key);
        item.style.width = width + "px";
        if (textAlign) item.style.textAlign = textAlign;
        return item;
    }

    addToggleButton(key, icon, text = "") {
        const item = this.addItem(key, "button");
        item.classList.add(icon);
        item.title = text;
        item.addEventListener("click", () => this.statusbar.emit("buttonclick", { button: key }));
        return item;
    }

    addSeparator() {
        this.append(elem("div", "separator"));
    }
}
