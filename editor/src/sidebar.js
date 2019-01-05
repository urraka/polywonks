import * as ui from "./ui/ui.js";
import { Explorer } from "./explorer.js";
import { MapExplorer } from "./map.explorer.js";
import { MapProperties } from "./map.properties.js";

export class Sidebar extends ui.Panel {
    constructor() {
        super("sidebar");
        this.panels = new Map();
        this.explorers = [];
        this.append(this.createTabs());
        this.append(this.createTools());
        this.append(this.createExplorers());
        this.setActiveTab("sidebar-tools");
    }

    set editor(editor) {
        const explorer = this.element.querySelector(".map-explorer");
        const properties = this.element.querySelector(".map-properties");
        explorer.replaceWith(editor.explorer.element);
        properties.replaceWith(editor.properties.element);
    }

    setActiveTab(id) {
        if (!id) return;
        const tabs = this.element.querySelectorAll(":scope > .sidebar-toolbar > .active");
        const panels = this.element.querySelectorAll(":scope > .sidebar-panel.active");
        for (const e of tabs) e.classList.remove("active");
        for (const e of panels) e.classList.remove("active");
        this.element.querySelector(`:scope > .sidebar-toolbar > [for=${id}]`).classList.add("active");
        this.element.querySelector(`#${id}`).classList.add("active");
    }

    createTabs() {
        const tabs = new ui.Panel("sidebar-toolbar");
        const tools = tabs.append(ui.elem("button", "tools-icon"));
        const explorer = tabs.append(ui.elem("button", "explorer-icon"));
        tools.setAttribute("for", "sidebar-tools");
        explorer.setAttribute("for", "sidebar-explorer");
        tabs.element.addEventListener("click", e => this.setActiveTab(e.target.getAttribute("for")));
        return tabs;
    }

    createTools() {
        const container = new ui.Panel("sidebar-panel");
        const header = container.append(new ui.Panel("sidebar-header"));
        const panels = container.append(new ui.MultiPanelView());

        container.element.setAttribute("id", "sidebar-tools");
        header.element.textContent = "Tools";

        panels.addPanel("Map", new MapExplorer());
        panels.addPanel("Properties", new MapProperties());

        return container;
    }

    createExplorers() {
        const container = new ui.Panel("sidebar-panel");
        const header = container.append(new ui.Panel("sidebar-header"));
        const panels = container.append(new ui.MultiPanelView());

        container.element.setAttribute("id", "sidebar-explorer");
        header.element.textContent = "Explorer";

        for (const mount of ["polydrive", "soldat", "library"]) {
            const explorer = new Explorer(mount);
            const panel = panels.addPanel(mount, explorer.tree);
            panel.header.addButton("refresh-icon", "Refresh", "refresh-explorer", { mount });
            this.explorers.push(explorer);
        }

        return container;
    }
}
