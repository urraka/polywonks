import * as ui from "./ui/ui.js";
import * as fmt from "./support/format.js";
import * as cmd from "./commands.js";
import { Path } from "./support/path.js";
import { Renderer } from "./render.js";
import { Editor } from "./editor.js";
import { Sidebar } from "./sidebar.js";

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
        this.sidebar = null;
        this.statusbar = null;
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
        this.tabs.on("willchange", e => this.onTabWillChange(e));
        this.tabs.on("close", e => this.onTabClose(e));
        window.addEventListener("beforeunload", e => this.onBeforeUnload(e));
        window.addEventListener("resize", e => this.onResize(e));
        document.addEventListener("drop", e => this.onDrop(e));
        document.addEventListener("dragover", e => this.onDragOver(e));
        document.addEventListener("dragenter", e => this.onDragEnter(e));
        document.addEventListener("keydown", e => this.onKeyDown(e));
        document.addEventListener("contextmenu", e => e.preventDefault());
    }

    createUserInterface() {
        const titlebar = this.append(new ui.TitleBar());
        this.createMenus(titlebar.menu);

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
            const title = Path.filename(path);

            Editor.loadFile(this.renderer, path, editor => {
                const panel = this.tabs.addPanel(new ui.TabPanel(title, editor));
                editor.on("change", () => this.onEditorChange({editor, panel}));

                if (activePanel && activeEditor.openedAsDefault && !activeEditor.modified) {
                    activePanel.close();
                }

                if (fn) fn(editor);
            });
        }
    }

    openEditor(editor = new Editor(this.renderer), title = "Untitled") {
        const panel = this.tabs.addPanel(new ui.TabPanel(title, editor));
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

    onCursorChange(event) {
        this.status("cursor", `${Math.round(this.editor.cursor.x)}, ${Math.round(this.editor.cursor.y)}`);
    }

    onViewChange(event) {
        this.status("cursor", `${Math.round(this.editor.cursor.x)}, ${Math.round(this.editor.cursor.y)}`);
        this.status("zoom", Math.round(100 * this.editor.view.scale) + "%");
    }

    onToolChange(event) {
        this.status("tool", event.status);
    }

    onTabWillChange() {
        const editor = this.editor;

        if (editor) {
            editor.onDeactivate();
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
        editor.onActivate();
        this.sidebar.editor = editor;
    }

    onTabClose(event) {
        const editor = event.panel.content;
        editor.onClose(event);

        if (!event.defaultPrevented && this.tabs.count === 1) {
            this.openDefault();
        }
    }

    onEditorChange(event) {
        event.panel.modified = event.editor.modified;
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
                    if (ext === ".pms") {
                        this.open(Editor.loadPms(this.renderer, reader.result), file.name);
                    } else {
                        this.open(Editor.loadPolywonks(this.renderer, reader.result), file.name);
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
}
