import { elem, registerStyles } from "./common.js";
import { Panel } from "./panel.js";

registerStyles(/* css */`
.statusbar {
    height: 22px;
    line-height: 22px;
    flex-shrink: 0;
    background-color: rgb(var(--theme-statusbar));
}

.statusbar > .panel:last-child {
    justify-content: flex-end;
}

.statusbar > .panel:first-child .statusbar-item {
    margin-left: 10px;
}

.statusbar > .panel:last-child .statusbar-item {
    margin-right: 10px;
}
`);

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
