import * as ui from "./ui.js";
import * as cmd from "./commands.js";
import * as fmt from "./format.js";
import { Renderer } from "./render.js";
import { Editor } from "./editor.js";
import { Explorer } from "./explorer.js";
import { Path } from "./path.js";

export class App extends ui.Panel {
    static launch() {
        Object.keys(cmd).forEach(cmdType => {
            if (cmdType.endsWith("Command")) {
                const cmdName = fmt.pascalToDash(cmdType.replace(/Command$/, ""));
                ui.Command.add(cmdName, new cmd[cmdType]());
            }
        });

        window.app = new App();
    }

    constructor() {
        super("app");

        this.tabs = null;
        this.statusbar = null;
        this.explorers = null;
        this.editor = null;
        this.renderer = new Renderer();

        this.createUserInterface();
        this.setupEvents();
        this.openDefault();
    }

    setupEvents() {
        this.onCursorChange = this.onCursorChange.bind(this);
        this.onViewChange = this.onViewChange.bind(this);
        this.onToolChange = this.onToolChange.bind(this);

        this.tabs.on("change", e => this.onTabChange(e));
        this.tabs.on("close", e => this.onTabClose(e));
        window.addEventListener("resize", e => this.onResize(e));
        document.addEventListener("drop", e => this.onDrop(e));
        document.addEventListener("dragover", e => this.onDragOver(e));
        document.addEventListener("dragenter", e => this.onDragEnter(e));
    }

    createUserInterface() {
        const titlebar = this.append(new ui.TitleBar());
        this.createMenus(titlebar.menu);

        const clientArea = this.append(new ui.Panel("client-area"));

        const sidebar = clientArea.append(new ui.Panel("sidebar"));
        const sidebarHeader = sidebar.append(new ui.Panel("sidebar-header"));
        sidebarHeader.element.textContent = "Explorer";
        const sidebarPanels = new ui.MultiPanelView();
        this.explorers = ["polydrive", "soldat", "library"].map(root => new Explorer(root));
        this.explorers.forEach(explorer => sidebarPanels.addPanel(explorer.root, explorer.tree));
        sidebar.append(sidebarPanels);

        this.tabs = clientArea.append(new ui.TabView());
        this.tabs.content.element.prepend(this.renderer.context.canvas);

        this.statusbar = this.append(new ui.Statusbar());
        this.statusbar.addItem("tool", "left", 200);
        this.statusbar.addItem("zoom", "right", 100, "right");
        this.statusbar.addItem("cursor", "right", 100, "right");

        document.body.querySelector(".startup-loading").remove();
        document.body.append(this.element);
    }

    createMenus(menubar) {
        const menus = [
            ["File", [
                ["New Map", "new-map"],
                ["Save"],
                ["Save As..."],
                [],
                ["Settings"],
            ]],
            ["Edit", [
                ["Undo", "undo"],
                ["Redo", "redo"],
            ]],
            ["View", [
                ["Reset Viewport", "reset-viewport"],
                [],
                ["Grid", "toggle-grid"],
                ["Background", "toggle-background"],
                ["Wireframe", "toggle-wireframe"],
                ["Polygons", [
                    ["Texture", "show-polygon-texture"],
                    ["Plain Color", "show-polygon-plain"],
                    ["Hide", "show-polygon-none"],
                ]],
            ]],
            ["Help", [
                ["Github", "browse-to-github"],
            ]],
        ];

        const create = (menu, submenu) => {
            for (const item of submenu) {
                if (item.length === 0) {
                    menu.addItem(new ui.MenuSeparator());
                } else if (item.length === 1 || typeof item[1] === "string") {
                    menu.addItem(new ui.MenuItem(item[0], item[1]));
                } else {
                    create(menu.addItem(new ui.MenuItem(item[0])), item[1]);
                }
            }
        };

        create(menubar, menus);
    }

    openDefault() {
        const editor = this.open();
        editor.openedAsDefault = true;
    }

    open(path, title = "Untitled") {
        if (path) {
            const ext = Path.ext(path).toLowerCase();
            if (ext === ".pms" || ext === ".polywonks") {
                if (this.editor.openedAsDefault && !this.editor.modified) {
                    this.editor.load(path);
                    this.tabs.activePanel.title = Path.filename(path);
                    return this.editor;
                } else {
                    const editor = new Editor(this.renderer);
                    this.tabs.addPanel(new ui.TabPanel(Path.filename(path), editor));
                    editor.load(path);
                    return editor;
                }
            }
        } else {
            const editor = new Editor(this.renderer);
            this.tabs.addPanel(new ui.TabPanel(title, editor));
            return editor;
        }
    }

    status(name, value) {
        this.statusbar.set(name, value);
    }

    onCursorChange(event) {
        this.status("cursor", `${Math.round(this.editor.cursor.x)}, ${Math.round(this.editor.cursor.y)}`);
    }

    onViewChange(event) {
        this.status("cursor", `${Math.round(this.editor.cursor.x)}, ${Math.round(this.editor.cursor.y)}`);
        this.status("zoom", Math.round(100 * this.editor.view.scale) + "%");
    }

    onToolChange(event) {
        this.status("tool", event.data);
    }

    onTabChange() {
        if (this.editor) {
            this.editor.off("cursorchange", this.onCursorChange);
            this.editor.off("viewchange", this.onViewChange);
            this.editor.off("toolchange", this.onToolChange);
        }

        this.editor = this.tabs.activePanel.content;
        this.editor.on("cursorchange", this.onCursorChange);
        this.editor.on("viewchange", this.onViewChange);
        this.editor.on("toolchange", this.onToolChange);
        this.editor.onShow();
    }

    onTabClose(event) {
        const editor = this.tabs.activePanel.content;
        editor.onClose(event);

        if (!event.defaultPrevented && this.tabs.count === 1) {
            this.openDefault();
        }
    }

    onResize() {
        this.editor.redraw();
    }

    onDrop(event) {
        event.preventDefault();

        if (event.dataTransfer.files.length) {
            const file = event.dataTransfer.files[0];
            const ext = Path.ext(file.name).toLowerCase();

            if (ext === ".pms" || ext === ".polywonks") {
                const reader = new FileReader();

                reader.addEventListener("load", () => {
                    const editor = this.open(null, "*" + file.name);
                    if (ext === ".pms") {
                        editor.loadPms(reader.result);
                    } else {
                        editor.loadPolywonks(reader.result);
                    }
                });

                if (ext === ".pms") {
                    reader.readAsArrayBuffer(file);
                } else {
                    reader.readAsText(file);
                }
            }
        }
    }

    onDragOver(event) {
        event.preventDefault();
    }

    onDragEnter(event) {
        event.preventDefault();
    }
}
