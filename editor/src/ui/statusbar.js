import { Panel, elem } from "./common.js";

export class Statusbar extends Panel {
    constructor() {
        super("statusbar");
        this.items = new Map();
        this.left = this.append(new Panel());
        this.right = this.append(new Panel());
    }

    addItem(name, side, width, textAlign = null) {
        const item = elem("div", "statusbar-item");
        item.style.width = width + "px";

        if (textAlign) {
            item.style.textAlign = textAlign;
        }

        this.items.set(name, item);
        this[side].append(item);
    }

    set(name, value) {
        this.items.get(name).textContent = value;
    }
}
