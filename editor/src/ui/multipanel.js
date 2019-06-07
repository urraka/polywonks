import { elem, registerStyles } from "./common.js";
import { Panel } from "./panel.js";
import { styles } from "./multipanel.styles.js";

registerStyles(styles);

export class MultiPanelView extends Panel {
    constructor() {
        super("multi-panel-view");
    }

    addPanel(title, content) {
        return this.append(new PanelView(title, content));
    }
}

export class PanelView extends Panel {
    constructor(title, content) {
        super("panel-view");
        this.header = null;
        if (title !== null) {
            this.header = this.append(new PanelHeader(this, title));
            this.header.element.addEventListener("mousedown", e => this.onHeaderMouseDown(e));
        }
        this.content = this.append(content);
    }

    onHeaderMouseDown(event) {
        if (event.button === 0) {
            this.element.classList.toggle("collapsed");
        }
    }

    onHeaderButtonClick(button) {
        this.emit("buttonclick", { button });
    }
}

export class PanelHeader {
    constructor(panel, text) {
        this.parentPanel = panel;
        this.element = elem("div", "panel-header");
        this.label = elem("label");
        this.element.append(this.label);
        this.title = text;
        this.toolbar = null;
    }

    get title() {
        return this.label.textContent;
    }

    set title(value) {
        this.label.textContent = value;
    }

    addButton(key, icon, title) {
        if (!this.toolbar) {
            this.toolbar = elem("div", "toolbar");
            this.element.append(this.toolbar);
        }

        const button = elem("button", icon);
        button.setAttribute("title", title);
        button.addEventListener("click", () => this.parentPanel.onHeaderButtonClick(key));
        button.addEventListener("mousedown", e => e.stopPropagation());
        this.toolbar.append(button);
    }
}
