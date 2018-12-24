import { Panel, elem } from "./ui.base.js";

export * from "./ui.base.js";
export * from "./ui.tree.js";
export * from "./ui.menu.js";

export class Statusbar extends Panel {
    constructor() {
        super("statusbar");
        this.items = new Map();
        this.left = this.append(new Panel());
        this.right = this.append(new Panel());
    }

    addItem(name, side, width) {
        const item = elem("div", "statusbar-item");
        item.style.width = width + "px";
        this.items.set(name, item);
        this[side].append(item);
    }

    set(name, value) {
        this.items.get(name).textContent = value;
    }
}

export class MultiPanelView extends Panel {
    constructor() {
        super("multi-panel-view");
    }

    addPanel(title, panel) {
        const panelView = this.append(new Panel("panel-view"));
        const header = panelView.append(new PanelHeader(title));
        panelView.append(panel);
        header.element.addEventListener("mousedown", () => panelView.element.classList.toggle("collapsed"));
    }
}

export class PanelHeader {
    constructor(text) {
        this.element = elem("div", "panel-header");
        this.element.textContent = text;
    }
}
