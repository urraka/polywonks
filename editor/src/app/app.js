import * as ui from "../ui/ui.js";
import { iter } from "../common/iter.js";
import { Path } from "../common/path.js";
import { Editor } from "../editor/editor.js";
import { Settings, cfg } from "./settings.js";
import { KeyBindings } from "./keybindings.js";
import { Renderer } from "./render.js";
import { Sidebar } from "./sidebar.js";
import { AppMenu } from "./menu.js";
import { styles } from "./app.styles.js";

ui.registerStyles(styles);

export class App extends ui.Panel {
    constructor() {
        super("app");

        this.menu = null;
        this.commands = null;
        this.tabs = null;
        this.sidebar = null;
        this.statusbar = null;
        this.renderer = new Renderer();
        this.keybindings = new KeyBindings();

        this.createUserInterface();
        this.setupEvents();
        this.openDefault();
    }

    setupEvents() {
        this.onEditorStatusChange = this.onEditorStatusChange.bind(this);
        this.onKeyBindingsCommand = e => this.onCommand(e.command, e.params);

        this.keybindings.on("command", this.onKeyBindingsCommand);
        this.menu.on("command", e => this.onCommand(e.command));
        this.tabs.on("change", e => this.onTabChange(e));
        this.tabs.on("willchange", e => this.onTabWillChange(e));
        this.tabs.on("close", e => this.onTabClose(e));
        this.sidebar.explorers.forEach(explorer => explorer.on("open", e => this.onExplorerOpen(e.path)));
        this.sidebar.explorers.forEach(explorer => explorer.on("command", e => this.onCommand(e.command, e.params)));

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
    }

    createUserInterface() {
        this.menu = this.append(new AppMenu(this));
        const clientArea = this.append(new ui.Panel("client-area"));
        this.sidebar = clientArea.append(new Sidebar(this));
        this.tabs = clientArea.append(new ui.TabView());
        this.tabs.content.element.prepend(this.renderer.context.canvas);
        this.statusbar = this.append(new ui.Statusbar());
        this.statusbar.addItem("tool", "left", 200);
        this.statusbar.addItem("layer", "left", 200, "left");
        this.statusbar.addItem("zoom", "right", 100, "right");
        this.statusbar.addItem("cursor", "right", 100, "right");
    }

    get editor() {
        const activePanel = this.tabs.activePanel;
        return activePanel ? activePanel.content : null;
    }

    get editors() {
        return iter(this.tabs.panels()).map(panel => panel.content);
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

            Editor.loadFile(path, editor => {
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

    openEditor(editor = new Editor()) {
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
        this.renderer.redraw();
    }

    onEditorStatusChange(event) {
        for (const [name, value] of Object.entries(event.status)) {
            this.statusbar.set(name, value);
        }
    }

    onTabWillChange() {
        const editor = this.editor;
        if (editor) {
            editor.deactivate();
            editor.off("statuschange", this.onEditorStatusChange);
        }
    }

    onTabChange() {
        const editor = this.editor;
        editor.on("statuschange", this.onEditorStatusChange);
        this.renderer.editor = editor;
        this.sidebar.editor = editor;
        this.menu.editor = editor;
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
        for (const editor of this.editors) {
            if (editor.modified) {
                event.preventDefault();
                event.returnValue = "";
                break;
            }
        }
    }

    onResize() {
        iter(this.editors).each(editor => editor.onResize());
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

    onKeyDown(event) {
        if (!(event.target instanceof HTMLInputElement)) {
            this.keybindings.onKeyDown(event);
        }
    }

    onKeyUp(event) {
        this.keybindings.onKeyUp(event);
    }

    onCommand(command, params = null) {
        const commands = this.commands || (this.commands = {
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
        } else if (this.editor) {
            this.editor.onCommand(command, params);
        }
    }
}
