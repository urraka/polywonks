import * as ui from "./ui/ui.js";
import { Path } from "./support/path.js";
import { Renderer } from "./render.js";
import { Editor } from "./editor.js";
import { Sidebar } from "./sidebar.js";
import { Settings, cfg } from "./settings.js";

export class App extends ui.Panel {
    constructor() {
        super("app");

        this.titlebar = null;
        this.menuItems = null;
        this.commands = null;
        this.tabs = null;
        this.sidebar = null;
        this.statusbar = null;
        this.renderer = new Renderer();

        this.createUserInterface();
        this.setupEvents();
        this.openDefault();
        this.updateMenuItems();
    }

    setupEvents() {
        this.onCursorChange = this.onCursorChange.bind(this);
        this.onViewChange = this.onViewChange.bind(this);
        this.onToolChange = this.onToolChange.bind(this);

        this.titlebar.menu.on("itemclick", e => this.onCommand(e.item.key));
        this.tabs.on("change", e => this.onTabChange(e));
        this.tabs.on("willchange", e => this.onTabWillChange(e));
        this.tabs.on("close", e => this.onTabClose(e));
        this.sidebar.explorers.forEach(explorer => explorer.on("open", e => this.onExplorerOpen(e.path)));

        ui.Dialog.on("modalstart", () => this.onModalStart());
        ui.Dialog.on("modalend", () => this.onModalEnd());

        window.addEventListener("beforeunload", e => this.onBeforeUnload(e));
        window.addEventListener("resize", e => this.onResize(e));

        document.addEventListener("drop", e => this.onDrop(e));
        document.addEventListener("dragover", e => this.onDragOver(e));
        document.addEventListener("dragenter", e => this.onDragEnter(e));
        document.addEventListener("keydown", e => this.onKeyDown(e));
        document.addEventListener("contextmenu", e => e.preventDefault());

        Settings.on("change", e => this.onSettingChange(e.setting));
    }

    createUserInterface() {
        this.titlebar = this.append(new ui.TitleBar());
        this.menuItems = this.createMenus(this.titlebar.menu);

        const clientArea = this.append(new ui.Panel("client-area"));
        this.sidebar = clientArea.append(new Sidebar());
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
                ["New", "new-map"],
                [],
                ["Open...", "show-explorer"],
                [],
                ["Save", "save"],
                ["Save As...", "save-as"],
                [],
                ["Export", "export"],
                ["Export As...", "export-as"],
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

        const menuItems = {};

        const create = (menu, submenu) => {
            for (const item of submenu) {
                if (item.length === 0) {
                    menu.addItem(new ui.MenuSeparator());
                } else if (item.length === 1 || typeof item[1] === "string") {
                    const menuItem = menu.addItem(new ui.MenuItem(item[0], item[1]));
                    if (item[1]) menuItems[item[1]] = menuItem;
                } else {
                    create(menu.addItem(new ui.MenuItem(item[0])), item[1]);
                }
            }
        };

        create(menubar, menus);
        return menuItems;
    }

    get editor() {
        const activePanel = this.tabs.activePanel;
        return activePanel ? activePanel.content : null;
    }

    openDefault() {
        const editor = this.open();
        editor.openedAsDefault = true;
    }

    openFile(path, fn) {
        const ext = Path.ext(path).toLowerCase();

        if (ext === ".pms" || ext === ".polywonks") {
            const activePanel = this.tabs.activePanel;
            const activeEditor = this.editor;

            Editor.loadFile(this.renderer, path, editor => {
                if (editor) {
                    const panel = this.tabs.addPanel(new ui.TabPanel(Path.filename(editor.saveName), editor));
                    editor.on("change", () => this.onEditorChange({editor, panel}));
                    this.sidebar.activeTab = "sidebar-tools";

                    if (activePanel && activeEditor.openedAsDefault && !activeEditor.modified) {
                        activePanel.close();
                    }

                    if (fn) fn(editor);
                } else {
                    ui.msgbox("Polywonks", "Invalid map format.");
                }
            });
        }
    }

    openEditor(editor = new Editor(this.renderer)) {
        const panel = this.tabs.addPanel(new ui.TabPanel(Path.filename(editor.saveName), editor));
        editor.on("change", () => this.onEditorChange({editor, panel}));
        return editor;
    }

    open(...args) {
        if (typeof args[0] === "string") {
            return this.openFile(...args);
        } else {
            return this.openEditor(...args);
        }
    }

    status(name, value) {
        this.statusbar.set(name, value);
    }

    onExplorerOpen(path) {
        this.openFile(path);
    }

    onSettingChange(setting) {
        if (setting === "app.library-url" || setting === "app.library-index") {
            for (const panel of this.tabs.panels()) {
                for (const node of panel.content.map.resources.descendants()) {
                    if (node.attributes.has("src") && Path.mount(node.path) === "library") {
                        this.renderer.disposeNodeResources(node);
                    }
                }
            }
        }

        this.updateMenuItems();
        this.renderer.redraw();
    }

    onCursorChange() {
        this.status("cursor", `${Math.round(this.editor.cursor.x)}, ${Math.round(this.editor.cursor.y)}`);
    }

    onViewChange() {
        this.status("cursor", `${Math.round(this.editor.cursor.x)}, ${Math.round(this.editor.cursor.y)}`);
        this.status("zoom", Math.round(100 * this.editor.view.scale) + "%");
    }

    onToolChange(event) {
        this.status("tool", event.status);
    }

    onTabWillChange() {
        const editor = this.editor;

        if (editor) {
            editor.deactivate();
            editor.off("cursorchange", this.onCursorChange);
            editor.off("viewchange", this.onViewChange);
            editor.off("toolchange", this.onToolChange);
        }
    }

    onTabChange() {
        const editor = this.editor;
        editor.on("cursorchange", this.onCursorChange);
        editor.on("viewchange", this.onViewChange);
        editor.on("toolchange", this.onToolChange);
        this.renderer.editor = editor;
        this.sidebar.editor = editor;
        if (App.hasFocus) {
            editor.activate();
        }
    }

    onTabClose(event) {
        const editor = event.panel.content;
        editor.onClose(event);

        if (!event.defaultPrevented) {
            this.sidebar.onEditorClose(editor);
            if (this.tabs.count === 1) {
                this.openDefault();
            }
        }
    }

    onEditorChange(event) {
        event.panel.title = Path.filename(event.editor.saveName);
        event.panel.modified = event.editor.modified;
        this.updateMenuItem(this.menuItems["undo"]);
        this.updateMenuItem(this.menuItems["redo"]);
    }

    static get hasFocus() {
        return !ui.Dialog.activeDialog;
    }

    onModalStart() {
        this.editor.deactivate();
    }

    onModalEnd() {
        this.editor.activate();
    }

    onBeforeUnload(event) {
        for (const tab of this.tabs.tabs.element.querySelectorAll(".tab")) {
            const panel = ui.TabPanel.from(tab);
            const editor = panel.content;
            if (editor.modified) {
                event.preventDefault();
                event.returnValue = "";
                break;
            }
        }
    }

    onResize() {
        this.renderer.redraw();
    }

    onDrop(event) {
        event.preventDefault();

        if (event.dataTransfer.files.length) {
            const file = event.dataTransfer.files[0];
            const ext = Path.ext(file.name).toLowerCase();

            if (ext === ".pms" || ext === ".polywonks") {
                const reader = new FileReader();

                reader.addEventListener("load", () => {
                    const editor = ext === ".pms" ?
                        Editor.loadPms(this.renderer, reader.result, file.name) :
                        Editor.loadPolywonks(this.renderer, reader.result, file.name);
                    if (editor) {
                        this.open(editor);
                        this.sidebar.activeTab = "sidebar-tools";
                    } else {
                        ui.msgbox("Polywonks", "Invalid map format.");
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

    onKeyDown(event) {
        if (event.ctrlKey && (event.key === "z") || event.key === "ContextMenu") {
            event.preventDefault();
        }
    }

    isMenuItemEnabled(item) {
        switch (item.key) {
            case "undo": return this.editor && this.editor.commandHistory.length > this.editor.undone;
            case "redo": return this.editor && this.editor.undone > 0;
            default: return true;
        }
    }

    isMenuItemChecked(item) {
        switch (item.key) {
            case "toggle-grid": return cfg("view.grid");
            case "toggle-background": return cfg("view.background");
            case "toggle-wireframe": return cfg("view.wireframe");
            case "show-polygon-texture": return cfg("view.polygons") === "texture";
            case "show-polygon-plain": return cfg("view.polygons") === "plain";
            case "show-polygon-none": return cfg("view.polygons") === "none";
            default: return false;
        }
    }

    updateMenuItem(item) {
        item.enabled = this.isMenuItemEnabled(item);
        item.checked = this.isMenuItemChecked(item);
    }

    updateMenuItems() {
        for (const item of Object.values(this.menuItems)) {
            this.updateMenuItem(item);
        }
    }

    onCommand(command) {
        const commands = this.commands || (this.commands = {
            "new-map": () => {
                this.open();
                this.sidebar.activeTab = "sidebar-tools";
            },
            "show-explorer": () => this.sidebar.activeTab = "sidebar-explorer",
            "save": () => this.editor.save(),
            "save-as": () => this.editor.saveAs(),
            "export": () => this.editor.export(),
            "export-as": () => this.editor.exportAs(),
            "undo": () => this.editor.undo(),
            "redo": () => this.editor.redo(),
            "reset-viewport": () => this.editor.view.reset(),
            "toggle-grid": () => cfg("view.grid", !cfg("view.grid")),
            "toggle-background": () => cfg("view.background", !cfg("view.background")),
            "toggle-wireframe": () => cfg("view.wireframe", !cfg("view.wireframe")),
            "show-polygon-texture": () => cfg("view.polygons", "texture"),
            "show-polygon-plain": () => cfg("view.polygons", "plain"),
            "show-polygon-none": () => cfg("view.polygons", "none"),
            "browse-to-github": () => window.open(cfg("app.github")),
        });

        commands[command]();
    }
}
