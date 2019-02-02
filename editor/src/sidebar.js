import * as ui from "./ui/ui.js";
import { FileExplorer } from "./file.explorer.js";
import { Settings } from "./settings.js";

export class Sidebar extends ui.Panel {
    constructor() {
        super("sidebar");
        this.panels = new Map();
        this.explorers = [];
        this.append(this.createTabs());
        this.append(this.createTools());
        this.append(this.createFileExplorers());
        this.append(this.createSettings());
        this.activeTab = "sidebar-tools";
    }

    set editor(editor) {
        const explorer = this.element.querySelector(".map-explorer");
        const properties = this.element.querySelector(".map-properties");
        explorer.replaceWith(editor.explorer.element);
        properties.replaceWith(editor.properties.element);
    }

    get activeTab() {
        const tab = this.element.querySelector(":scope > .sidebar-toolbar > .active");
        return tab ? tab.getAttribute("for") : null;
    }

    set activeTab(id) {
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
        tabs.element.addEventListener("click", e => this.activeTab = e.target.getAttribute("for"));

        const tools = tabs.append(ui.elem("button", "tools-icon"));
        tools.setAttribute("for", "sidebar-tools");
        tools.setAttribute("title", "Tools");

        const explorer = tabs.append(ui.elem("button", "explorer-icon"));
        explorer.setAttribute("for", "sidebar-explorer");
        explorer.setAttribute("title", "Explorer");

        const settings = tabs.append(ui.elem("button", "settings-icon"));
        settings.setAttribute("for", "sidebar-settings");
        settings.setAttribute("title", "Settings");

        return tabs;
    }

    createTools() {
        const container = new ui.Panel("sidebar-panel");
        const header = container.append(new ui.Panel("sidebar-header"));
        const panels = container.append(new ui.MultiPanelView());

        container.element.setAttribute("id", "sidebar-tools");
        header.element.textContent = "Tools";

        panels.addPanel("Map", new ui.Panel("map-explorer"));
        panels.addPanel("Properties", new ui.Panel("map-properties"));

        return container;
    }

    createFileExplorers() {
        const container = new ui.Panel("sidebar-panel");
        const header = container.append(new ui.Panel("sidebar-header"));
        const panels = container.append(new ui.MultiPanelView());

        container.element.setAttribute("id", "sidebar-explorer");
        header.element.textContent = "Explorer";

        for (const mount of ["polydrive", "soldat", "library"]) {
            const explorer = new FileExplorer(mount);
            const panel = panels.addPanel(mount, explorer.tree);
            panel.header.addButton("refresh", "refresh-icon", "Refresh");
            panel.on("buttonclick", e => this.onExplorerButtonClick(explorer, e.button));
            this.explorers.push(explorer);
        }

        return container;
    }

    onExplorerButtonClick(explorer, button) {
        if (button === "refresh") {
            explorer.refresh();
        }
    }

    createSettings() {
        const container = new ui.Panel("sidebar-panel");
        const header = container.append(new ui.Panel("sidebar-header"));
        container.append(new Settings());
        container.element.setAttribute("id", "sidebar-settings");
        header.element.textContent = "Settings";
        return container;
    }
}
