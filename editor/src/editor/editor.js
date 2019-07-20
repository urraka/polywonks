import * as PMS from "../pms/pms.js";
import * as ui from "../ui/ui.js";
import { Path } from "../common/path.js";
import { iter } from "../common/iter.js";
import { MapDocument, LayerNode } from "../map/map.js";
import { Command } from "../app/command.js";
import { File } from "../app/file.js";
import { Settings } from "../app/settings.js";
import { View } from "./view.js";
import { ZoomTool } from "./tools/zoom.js";
import { Selection } from "./selection.js";
import { Grid } from "./grid.js";
import { Toolset } from "./toolset.js";
import { EditorHistory } from "./history.js";
import { EditorSidebar } from "./sidebar.js";
import { styles } from "./editor.styles.js";

ui.registerStyles(styles);

export class Editor extends ui.Panel {
    constructor(map = MapDocument.default()) {
        super("editor");

        this.map = map;
        this.activated = false;
        this.view = new View(this);
        this.grid = new Grid(this.view);
        this.selection = new Selection(this);
        this.preview = new Selection(this);
        this.reactive = new Selection(this);
        this.history = new EditorHistory(this);
        this.toolset = new Toolset(this);
        this.sidebar = new EditorSidebar(this);

        this.onSettingChange = this.onSettingChange.bind(this);
        this.selection.on("change", () => this.onSelectionChange());
        Settings.on("change", this.onSettingChange);

        Command.provide(this);
    }

    get cursor() {
        return this._cursor || (this._cursor = this.toolset.passiveTools.get("cursor"));
    }

    get width() {
        return this._width || 0;
    }

    get height() {
        return this._height || 0;
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

    *commandProviders() {
        yield this;
        yield* this.toolset.commandProviders();
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

    dispose() {
        Settings.off("change", this.onSettingChange);
        Command.dispose(this);
        this.toolset.dispose();
    }

    exec(command, params) {
        return Command.exec(this, command, params);
    }

    onResize() {
        this._width = this.element.clientWidth;
        this._height = this.element.clientHeight;
    }

    onSelectionChange() {
        const node = iter(this.selection.nodes).first();
        if (node === this.map) {
            this.activeLayer = null;
        } else if (node instanceof LayerNode) {
            this.activeLayer = node;
        }
    }

    onSettingChange(event) {
        if (event.setting === "editor.zoom-min" || event.setting === "editor.zoom-max") {
            const zoom = new ZoomTool();
            zoom.activate(this);
            zoom.zoom(1, this.width / 2, this.height / 2);
            zoom.deactivate();
        }
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
