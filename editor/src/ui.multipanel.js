import { Panel, elem } from "./ui.common.js";
import { Command } from "./ui.command.js";

export class MultiPanelView extends Panel {
    constructor() {
        super("multi-panel-view");
    }

    addPanel(title, content) {
        const panelView = this.append(new Panel("panel-view"));
        panelView.header = panelView.append(new PanelHeader(title));
        panelView.content = panelView.append(content);
        panelView.header.element.addEventListener("mousedown", e => this.onHeaderMouseDown(e, panelView));
        return panelView;
    }

    onHeaderMouseDown(event, panelView) {
        if (event.button === 0 && event.target.tagName !== "BUTTON") {
            panelView.element.classList.toggle("collapsed");
        }
    }
}

export class PanelHeader {
    constructor(text) {
        this.element = elem("div", "panel-header");
        this.element.append(elem("label"));
        this.element.querySelector("label").textContent = text;
        this.toolbar = null;
    }

    addButton(icon, title, command, params) {
        if (!this.toolbar) {
            this.toolbar = elem("div", "toolbar");
            this.element.append(this.toolbar);
        }

        const button = elem("button", icon);
        button.addEventListener("click", () => Command.find(command).execute(params));
        button.setAttribute("title", title);
        this.toolbar.append(button);
    }
}
