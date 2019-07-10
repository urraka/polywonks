import * as PMS from "../pms/pms.js";
import * as ui from "../ui/ui.js";
import { Path } from "../common/path.js";
import { iter } from "../common/iter.js";
import { MapDocument, LayerNode } from "../map/map.js";
import { File } from "../app/file.js";
import { cfg, Settings } from "../app/settings.js";
import { View } from "./view.js";
import { EditorFunction } from "./func/func.js";
import { ZoomTool } from "./tools/zoom.js";
import { Selection } from "./selection.js";
import { Grid } from "./grid.js";
import { Toolset } from "./toolset.js";
import { EditorSidebar } from "./sidebar.js";
import { styles } from "./editor.styles.js";

ui.registerStyles(styles);

export class Editor extends ui.Panel {
    constructor(map = MapDocument.default()) {
        super("editor");
        this.activated = false;
        this.openedAsDefault = false;
        this.map = map;
        this.view = new View(this);
        this.grid = new Grid(this.view);
        this.selection = new Selection(this);
        this.activeLayer = null;
        this.previewNodes = new Set();
        this.reactiveNode = null;
        this.saveName = this.initialSaveName(map.path);
        this.saveIndex = 0;
        this.undone = 0;
        this.commandHistory = [];
        this.functions = EditorFunction.instantiate(this);
        this.toolset = new Toolset(this);
        this.sidebar = new EditorSidebar(this);
        this.setupEvents();
    }

    initialSaveName(path) {
        if (path === "") {
            return "Untitled.polywonks";
        } else if (path.startsWith("/library/") || Path.ext(path).toLowerCase() === ".pms") {
            return Path.replaceExtension(Path.filename(path), ".polywonks");
        } else {
            return path;
        }
    }

    setupEvents() {
        this.selection.on("change", () => this.onSelectionChange());
        Settings.on("change", e => this.onSettingChange(e.setting));
        for (const [name, func] of Object.entries(this.functions)) {
            func.on("change", () => this.emit("functionchange", { name }));
        }
    }

    textureInfo(node) {
        if (this.renderer) {
            return this.renderer.textureInfo(node);
        } else {
            return { width: 0, height: 0 };
        }
    }

    get renderer() {
        return this._renderer;
    }

    set renderer(value) {
        this._renderer = value;
    }

    get cursor() {
        return this._cursor || (this._cursor = this.toolset.passiveTools.get("cursor"));
    }

    get modified() {
        return this.saveIndex !== this.undone;
    }

    onSave(saveIndex = this.undone, saveName = this.saveName) {
        if (saveName !== this.saveName) {
            const changed = (saveIndex !== this.undone);
            this.exec("relocate", { path: saveName });
            this.saveName = saveName;
            saveIndex = changed ? saveIndex : this.undone;
        }
        this.saveIndex = saveIndex;
        this.emit("historychange");
    }

    do(command) {
        if (!command.hasChanges) {
            return;
        }

        if (this.saveIndex >= 0) {
            this.saveIndex = this.saveIndex - this.undone + 1;
        }

        this.commandHistory.splice(0, this.undone, command);
        this.undone = 0;

        const limit = cfg("editor.undo-limit");
        if (limit > 0 && this.commandHistory.length > limit) {
            this.commandHistory = this.commandHistory.slice(0, limit);
        }

        command.do();
        this.emit("historychange");
        return command;
    }

    redo() {
        if (this.undone > 0) {
            this.commandHistory[--this.undone].do();
            this.emit("historychange");
        }
    }

    undo(command) {
        if (this.commandHistory.length > this.undone && (!command || command === this.commandHistory[this.undone])) {
            this.commandHistory[this.undone++].undo();
            this.emit("historychange");
            return true;
        }
        return false;
    }

    get width() {
        return this._width || 0;
    }

    get height() {
        return this._height || 0;
    }

    onResize() {
        this._width = this.element.clientWidth;
        this._height = this.element.clientHeight;
    }

    activate() {
        if (!this.activated) {
            this.activated = true;
            this.onResize();
            this.toolset.activate();
        }
    }

    deactivate() {
        if (this.activated) {
            this.activated = false;
            this.toolset.deactivate();
        }
    }

    exec(command, params) {
        return this.functions[command].exec(params);
    }

    onCommand(command, params) {
        if (command in this.functions) {
            this.exec(command, params);
        } else {
            this.toolset.currentTool.onCommand(command, params);
        }
    }

    get activeLayer() {
        return this._activeLayer || null;
    }

    set activeLayer(layer) {
        layer = layer || null;
        if (this.activeLayer !== layer) {
            this._activeLayer = layer;
            this.emit("activelayerchange");
        }
    }

    onSelectionChange() {
        const node = iter(this.selection.nodes).first();
        if (node === this.map) {
            this.activeLayer = null;
        } else if (node instanceof LayerNode) {
            this.activeLayer = node;
        }
    }

    onSettingChange(setting) {
        if (setting === "editor.zoom-min" || setting === "editor.zoom-max") {
            const zoom = new ZoomTool();
            zoom.activate(this);
            zoom.zoom(1, this.width / 2, this.height / 2);
            zoom.deactivate();
        }
    }

    static isEditorFunction(name) {
        return EditorFunction.includes(name);
    }

    static loadFile(path, fn) {
        const ext = Path.ext(path).toLowerCase();

        if (!path.startsWith("/")) {
            throw new Error("Editor.loadFile() - path is not absolute.");
        }

        if (ext !== ".pms" && ext !== ".polywonks") {
            throw new Error("Editor.loadFile() - file must be either .pms or .polywonks.");
        }

        File.refresh(Path.mount(path), () => {
            if (ext === ".pms") {
                File.readBuffer(path, buffer => {
                    fn(buffer ? Editor.loadPms(buffer, path) : null);
                });
            } else if (ext === ".polywonks") {
                File.readText(path, text => {
                    fn(text ? Editor.loadPolywonks(text, path) : null);
                });
            }
        });
    }

    static loadPms(buffer, path = "") {
        try {
            const pms = PMS.Map.fromArrayBuffer(buffer);
            return new Editor(MapDocument.fromPMS(pms, path));
        } catch (e) {
            return null;
        }
    }

    static loadPolywonks(text, path = "") {
        try {
            const map = MapDocument.unserialize(text, path);
            return new Editor(map);
        } catch (e) {
            return null;
        }
    }
}
