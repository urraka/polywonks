import * as ui from "../ui/ui.js";
import { Path } from "../common/path.js";
import { Editor } from "../editor/editor.js";
import { cfg } from "./settings.js";
import { Keybindings } from "./keybindings.js";
import { Renderer } from "./render.js";
import { Sidebar } from "./sidebar.js";
import { Menu } from "./menu.js";
import { EditorTabs } from "./tabs.js";
import { Statusbar } from "./statusbar.js";
import { styles } from "./app.styles.js";

ui.registerStyles(styles);

export class App extends ui.Panel {
    constructor() {
        super("app");
        this.renderer = new Renderer(this);

        this.tabs = new EditorTabs(this);
        this.tabs.on("close", e => this.onTabClose(e));
        this.tabs.on("change", () => this.onTabChange());

        this.menu = new Menu(this);
        this.menu.on("command", e => this.onCommand(e.command));

        this.sidebar = new Sidebar(this);
        this.sidebar.explorers.forEach(explorer => explorer.on("open", e => this.onExplorerOpen(e.path)));
        this.sidebar.explorers.forEach(explorer => explorer.on("command", e => this.onCommand(e.command, e.params)));

        this.statusbar = new Statusbar(this);

        const clientArea = new ui.Panel("client-area");
        clientArea.append(this.sidebar);
        clientArea.append(this.tabs);

        this.append(this.menu);
        this.append(clientArea);
        this.append(this.statusbar);

        document.addEventListener("drop", e => this.onDrop(e));
        document.addEventListener("dragover", e => this.onDragOver(e));
        document.addEventListener("dragenter", e => this.onDragEnter(e));
        document.addEventListener("contextmenu", e => e.preventDefault());
        Keybindings.on("command", e => this.onCommand(e.command, e.params));

        this.openDefault();
    }

    attach(element) {
        ui.initializeStyles();
        element.append(this.element);
        window.dispatchEvent(new Event('resize'));
    }

    openDefault() {
        const editor = this.open();
        editor.openedAsDefault = true;
    }

    openFile(path, fn) {
        const ext = Path.ext(path).toLowerCase();
        if (ext === ".pms" || ext === ".polywonks") {
            Editor.loadFile(path, editor => {
                if (editor) {
                    this.tabs.addEditor(editor);
                    this.sidebar.activeTab = "sidebar-tools";
                    if (fn) fn(editor);
                } else {
                    ui.msgbox("Polywonks", "Invalid map format.");
                }
            });
        }
    }

    openEditor(editor = new Editor()) {
        this.tabs.addEditor(editor);
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

    onTabChange() {
        this.emit("activeeditorchange", { editor: this.tabs.activeEditor });
    }

    onTabClose(event) {
        this.emit("editorclose", { editor: event.editor });
        if (this.tabs.editorCount === 0) this.openDefault();
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
                        Editor.loadPms(reader.result, file.name) :
                        Editor.loadPolywonks(reader.result, file.name);
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

    onCommand(command, params = null) {
        const commands = this._commands || (this._commands = {
            "new-map": () => {
                this.open();
                this.sidebar.activeTab = "sidebar-tools";
            },
            "show-explorer": () => this.sidebar.activeTab = "sidebar-explorer",
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

        document.activeElement.blur();

        if (commands[command]) {
            commands[command](params);
        } else if (this.tabs.activeEditor) {
            this.tabs.activeEditor.onCommand(command, params);
        }
    }
}
