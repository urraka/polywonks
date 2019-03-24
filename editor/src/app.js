import * as ui from "./ui/ui.js";
import { Path } from "./support/path.js";
import { Renderer } from "./render.js";
import { Editor } from "./editor/editor.js";
import { Sidebar } from "./sidebar.js";
import { Settings, cfg } from "./settings.js";
import { KeyBindings } from "./keybindings.js";
import { Clipboard } from "./clipboard.js";

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
        this.keybindings = new KeyBindings();

        this.createUserInterface();
        this.setupEvents();
        this.openDefault();
        this.updateMenuItems();
    }

    setupEvents() {
        this.onEditorStatusChange = this.onEditorStatusChange.bind(this);
        this.onSelectionChange = this.onSelectionChange.bind(this);
        this.onKeyBindingsCommand = e => this.onCommand(e.command);

        this.keybindings.on("command", this.onKeyBindingsCommand);
        this.titlebar.menu.on("itemclick", e => this.onCommand(e.item.key));
        this.tabs.on("change", e => this.onTabChange(e));
        this.tabs.on("willchange", e => this.onTabWillChange(e));
        this.tabs.on("close", e => this.onTabClose(e));
        this.sidebar.explorers.forEach(explorer => explorer.on("open", e => this.onExplorerOpen(e.path)));

        ui.Dialog.on("modalstart", () => this.onModalStart());
        ui.Dialog.on("modalend", () => this.onModalEnd());

        window.addEventListener("beforeunload", e => this.onBeforeUnload(e));
        window.addEventListener("resize", e => this.onResize(e));
        window.addEventListener("blur", () => this.keybindings.onFocusLost());

        document.addEventListener("drop", e => this.onDrop(e));
        document.addEventListener("dragover", e => this.onDragOver(e));
        document.addEventListener("dragenter", e => this.onDragEnter(e));
        document.addEventListener("keydown", e => this.onKeyDown(e));
        document.addEventListener("keyup", e => this.onKeyUp(e));
        document.addEventListener("contextmenu", e => e.preventDefault());

        Settings.on("change", e => this.onSettingChange(e.setting));
        Clipboard.on("change", () => this.onClipboardChange());
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
        this.statusbar.addItem("layer", "left", 200, "left");
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
                [],
                ["Cut", "cut"],
                ["Copy", "copy"],
                ["Paste", "paste"],
            ]],
            ["View", [
                ["Reset Viewport", "reset-viewport"],
                [],
                ["Snap to Grid", "toggle-snap-to-grid"],
                ["Snap to Objects", "toggle-snap-to-objects"],
                [],
                ["Show Grid", "toggle-grid"],
                ["Show Background", "toggle-background"],
                ["Show Vertices", "toggle-vertices"],
                ["Show Wireframe", "toggle-wireframe"],
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
                    editor.on("change", () => this.onEditorChange({ editor, panel }));
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
        editor.on("change", () => this.onEditorChange({ editor, panel }));
        return editor;
    }

    open(...args) {
        if (typeof args[0] === "string") {
            return this.openFile(...args);
        } else {
            return this.openEditor(...args);
        }
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

    onClipboardChange() {
        this.updateMenuItems();
    }

    onEditorStatusChange(event) {
        for (const [name, value] of Object.entries(event.status)) {
            this.statusbar.set(name, value);
        }
    }

    onSelectionChange() {
        this.updateMenuItems();
    }

    onTabWillChange() {
        const editor = this.editor;

        if (editor) {
            editor.deactivate();
            editor.off("statuschange", this.onEditorStatusChange);
            editor.off("selectionchange", this.onSelectionChange);
        }
    }

    onTabChange() {
        const editor = this.editor;
        editor.on("statuschange", this.onEditorStatusChange);
        editor.on("selectionchange", this.onSelectionChange);
        this.renderer.editor = editor;
        this.sidebar.editor = editor;
        this.updateMenuItems();
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
        this.updateMenuItems();
    }

    static get hasFocus() {
        return !ui.Dialog.activeDialog;
    }

    onModalStart() {
        this.keybindings.onFocusLost();
        this.keybindings.off("command", this.onKeyBindingsCommand);
        this.editor.deactivate();
    }

    onModalEnd() {
        this.editor.activate();
        this.keybindings.on("command", this.onKeyBindingsCommand);
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
        if (!(event.target instanceof HTMLInputElement)) {
            this.keybindings.onKeyDown(event);
        }
    }

    onKeyUp(event) {
        this.keybindings.onKeyUp(event);
    }

    isMenuItemEnabled(item) {
        switch (item.key) {
            case "undo": return this.editor && this.editor.commandHistory.length > this.editor.undone;
            case "redo": return this.editor && this.editor.undone > 0;
            case "cut": return this.editor && this.editor.canCopy();
            case "copy": return this.editor && this.editor.canCopy();
            case "paste": return this.editor && this.editor.activeLayer && !Clipboard.empty();
            default: return true;
        }
    }

    isMenuItemChecked(item) {
        switch (item.key) {
            case "toggle-snap-to-grid": return cfg("editor.snap-to-grid");
            case "toggle-snap-to-objects": return cfg("editor.snap-to-objects");
            case "toggle-grid": return cfg("view.grid");
            case "toggle-background": return cfg("view.background");
            case "toggle-vertices": return cfg("view.vertices");
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
        item.keyBinding = this.keybindings.find(item.key);
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
            "cut": () => this.editor.cut(),
            "copy": () => this.editor.copy(),
            "paste": () => this.editor.paste(),
            "delete": () => this.editor.delete(),
            "reset-viewport": () => this.editor.view.reset(),
            "toggle-snap-to-grid": () => cfg("editor.snap-to-grid", !cfg("editor.snap-to-grid")),
            "toggle-snap-to-objects": () => cfg("editor.snap-to-objects", !cfg("editor.snap-to-objects")),
            "toggle-grid": () => cfg("view.grid", !cfg("view.grid")),
            "toggle-background": () => cfg("view.background", !cfg("view.background")),
            "toggle-vertices": () => cfg("view.vertices", !cfg("view.vertices")),
            "toggle-wireframe": () => cfg("view.wireframe", !cfg("view.wireframe")),
            "show-polygon-texture": () => cfg("view.polygons", "texture"),
            "show-polygon-plain": () => cfg("view.polygons", "plain"),
            "show-polygon-none": () => cfg("view.polygons", "none"),
            "browse-to-github": () => window.open(cfg("app.github")),
        });

        if (commands[command]) {
            commands[command]();
        } else if (this.editor) {
            this.editor.onCommand(command);
        }
    }
}
