import * as ui from "../ui/ui.js";
import { Path } from "../common/path.js";
import { Editor } from "../editor/editor.js";
import { Command } from "./command.js";
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
        this.statusbar.on("command", e => this.onCommand(e.command));

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

        Command.provide(this);

        this.openDefault();
    }

    attach(element) {
        ui.initializeStyles();
        element.append(this.element);
        window.dispatchEvent(new Event('resize'));
    }

    openDefault() {
        this.tabs.addEditor(new Editor(), true);
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
                        this.tabs.addEditor(editor);
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

    onCommand(command, params) {
        document.activeElement.blur();
        for (const provider of this.commandProviders()) {
            Command.exec(provider, command, params);
        }
    }

    findCommand(name) {
        for (const provider of this.commandProviders()) {
            const command = Command.find(provider, name);
            if (command) return command;
        }
    }

    *commandProviders() {
        yield this;
        yield* this.tabs.activeEditor.commandProviders();
    }
}
