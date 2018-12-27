import { Panel, elem } from "./ui.common.js";

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
