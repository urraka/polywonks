import { Panel, elem } from "./ui.common.js";
import { Event } from "./event.js";

export class TabView extends Panel {
    constructor() {
        super("tab-view");
        this.tabs = this.append(new Panel("tab-container"));
        this.content = this.append(new Panel("tab-content"));
    }

    addPanel(panel) {
        this.tabs.append(panel.tab);
        this.content.append(panel.element);
        panel.tabView = this;
        panel.active = true;
    }

    closePanel(panel) {
        if (this.emit(new Event("close", panel))) {
            const activePanel = this.activePanel;
            if (panel === activePanel) {
                const nextPanel = TabPanel.from(panel.tab.previousSibling || panel.tab.nextSibling);
                if (nextPanel) {
                    nextPanel.active = true;
                }
            }
            panel.tab.remove();
            panel.element.remove();
        }
    }

    get activePanel() {
        return TabPanel.from(this.tabs.element.querySelector(".tab.active"));
    }

    get count() {
        return this.tabs.element.childElementCount;
    }
}

export class TabPanel extends Panel {
    constructor(title, content) {
        super("tab-panel");
        this.tabView = null;
        this.content = this.append(content);

        const label = elem("label");
        label.textContent = title;

        const close = elem("div", "close");
        close.setAttribute("title", "Close tab");
        close.addEventListener("click", () => this.tabView.closePanel(this));

        this.tab = elem("div", "tab");
        this.tab.append(label);
        this.tab.append(close);
        this.tab.addEventListener("mousedown", () => this.active = true);

        const panelsByTab = TabPanel.panelsByTab || (TabPanel.panelsByTab = new WeakMap());
        panelsByTab.set(this.tab, this);
    }

    close() {
        this.tabView.closePanel(this);
    }

    set title(value) {
        this.tab.querySelector("label").textContent = value;
    }

    set active(value) {
        if (value) {
            const activePanel = this.tabView.activePanel;
            if (activePanel) activePanel.active = false;
            this.element.classList.add("active");
            this.tab.classList.add("active");
            if (activePanel !== this.tabView.activePanel) {
                this.tabView.emit(new Event("change"));
            }
        } else {
            this.element.classList.remove("active");
            this.tab.classList.remove("active");
        }
    }

    static from(tabElement) {
        const panelsByTab = TabPanel.panelsByTab || (TabPanel.panelsByTab = new WeakMap());
        return panelsByTab.get(tabElement);
    }
}
