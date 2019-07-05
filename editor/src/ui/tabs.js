import { elem, registerStyles } from "./common.js";
import { Panel } from "./panel.js";
import { styles } from "./tabs.styles.js";

registerStyles(styles);

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
        return panel;
    }

    closePanel(panel) {
        if (this.emit("willclose", { panel })) {
            const activePanel = this.activePanel;
            if (panel === activePanel) {
                const nextPanel = TabPanel.from(panel.tab.previousSibling || panel.tab.nextSibling);
                if (nextPanel) {
                    nextPanel.active = true;
                }
            }
            panel.tab.remove();
            panel.element.remove();
            this.emit("close", { panel });
        }
    }

    *panels() {
        for (const tab of this.tabs.element.children) {
            yield TabPanel.from(tab);
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

        const close = elem("button", "close");
        close.setAttribute("title", "Close tab");
        close.addEventListener("click", () => this.close());

        this.tab = elem("div", "tab");
        this.tab.append(label);
        this.tab.append(close);
        this.tab.addEventListener("mousedown", e => this.onTabMouseDown(e));

        const panelsByTab = TabPanel.panelsByTab || (TabPanel.panelsByTab = new WeakMap());
        panelsByTab.set(this.tab, this);
    }

    onTabMouseDown(event) {
        if (!event.target.classList.contains("close")) {
            this.active = true;
        }
    }

    close() {
        this.tabView.closePanel(this);
    }

    get title() {
        return this.tab.querySelector("label").textContent;
    }

    set title(value) {
        this.tab.querySelector("label").textContent = value;
    }

    set active(value) {
        if (value) {
            const activePanel = this.tabView.activePanel;

            if (activePanel !== this) {
                this.tabView.emit("willchange");
                if (activePanel) activePanel.active = false;
                this.element.classList.add("active");
                this.tab.classList.add("active");
                this.tabView.emit("change");
            }
        } else {
            this.element.classList.remove("active");
            this.tab.classList.remove("active");
        }
    }

    set modified(value) {
        this.tab.classList.toggle("modified", value);
    }

    static from(tabElement) {
        const panelsByTab = TabPanel.panelsByTab || (TabPanel.panelsByTab = new WeakMap());
        return panelsByTab.get(tabElement);
    }
}
