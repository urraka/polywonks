import * as PMS from "../pms/pms.js";
import * as ui from "../ui/ui.js";
import { Path } from "../common/path.js";
import { iter } from "../common/iter.js";
import { MapDocument, LayerNode } from "../map/map.js";
import { File } from "../file.js";
import { RenderView } from "../render.view.js";
import { cfg, Settings } from "../settings.js";
import { EditorFunction } from "./func/func.js";
import { SelectTool } from "./tools/select.js";
import { PanTool } from "./tools/pan.js";
import { ZoomTool } from "./tools/zoom.js";
import { MovePositionTool } from "./tools/move.position.js";
import { MoveTextureTool } from "./tools/move.texture.js";
import { PolygonTool } from "./tools/polygon.js";
import { CursorTool } from "./tools/cursor.js";
import { ToolPropertiesItem } from "./tool.properties.js";
import { SceneryTool } from "./tools/scenery.js";
import { SpawnTool } from "./tools/spawn.js";
import { ColliderTool } from "./tools/collider.js";
import { WaypointTool } from "./tools/waypoint.js";
import { ConnectionTool } from "./tools/connection.js";
import { MapExplorer } from "./map.explorer.js";
import { MapProperties } from "./map.properties.js";
import { Selection } from "./selection.js";
import { Grid } from "./grid.js";
import { styles } from "./editor.styles.js";

ui.registerStyles(styles);

export class Editor extends ui.Panel {
    constructor(map = MapDocument.default()) {
        super("editor");

        this.activated = false;
        this.openedAsDefault = false;
        this.map = map;
        this.view = new RenderView(this);
        this.grid = new Grid(this.view);
        this.selection = new Selection(this);
        this.activeLayer = null;
        this.previewNodes = new Set();
        this.reactiveNode = null;
        this.cursor = new CursorTool();
        this.saveName = this.initialSaveName(map.path);
        this.saveIndex = 0;
        this.undone = 0;
        this.commandHistory = [];

        this.functions = EditorFunction.instantiate(this);
        this.cursor.activate(this);
        this.tools = this.createTools();
        this.setupEvents();
        this.currentTool = this.tools.select;
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

    createTools() {
        return {
            current: null,
            previous: null,
            passive: {
                pan: new PanTool(1),
                zoom: new ZoomTool(),
            },
            pan: new PanTool(0),
            select: new SelectTool(),
            move: new MovePositionTool(),
            texture: new MoveTextureTool(),
            polygon: new PolygonTool(),
            scenery: new SceneryTool(),
            spawn: new SpawnTool(),
            collider: new ColliderTool(),
            waypoint: new WaypointTool(),
            connection: new ConnectionTool(),
        };
    }

    createSidebarPanels(keybindings) {
        const sidebar = {};
        sidebar.mainPanel = new ui.MultiPanelView();
        sidebar.mainPanel.element.classList.add("editor-sidebar-panels");
        sidebar.tools = sidebar.mainPanel.addPanel(null, new ui.ListView());
        sidebar.explorer = sidebar.mainPanel.addPanel("Map", new MapExplorer(this));
        sidebar.properties = sidebar.mainPanel.addPanel("Map Properties", new MapProperties(this));

        const bindings = keybindings.findAll("set-tool");

        const tools = [
            ["pan", "Pan"],
            ["select", "Select"],
            ["move", "Move"],
            ["texture", "Texture"],
            ["polygon", "Polygons"],
            ["scenery", "Scenery"],
            ["spawn", "Spawns"],
            ["collider", "Colliders"],
            ["waypoint", "Waypoints"],
            ["connection", "Connections"],
        ];

        tools.forEach(([key, text]) => {
            const tool = this.tools[key];
            const item = new ui.ListViewItem(text, tool);
            const binding = bindings.find(b => b.params.tool === key);
            sidebar.tools.content.addItem(item);
            if (binding) {
                item.keyBinding = binding.keys;
            }
            if (tool.attributes.size > 0) {
                sidebar.tools.content.addItem(new ToolPropertiesItem(this, tool));
            }
            if (tool === this.currentTool) {
                sidebar.tools.content.activeItem = item;
            }
        });

        sidebar.properties.content.on("nodechange", () => this.onPropertiesNodeChange());
        sidebar.tools.content.on("itemclick", e => this.currentTool = e.item.data);

        return sidebar;
    }

    setupEvents() {
        this.onToolStatusChange = this.onToolStatusChange.bind(this);
        this.map.on("attributechange", e => this.onMapAttrChange(e));
        this.map.on("visibilitychange", e => this.onMapVisibilityChange(e));
        this.view.on("change", () => this.onViewChange());
        this.cursor.on("change", () => this.onCursorChange());
        this.selection.on("change", () => this.onSelectionChange());
        Settings.on("change", e => this.onSettingChange(e.setting));

        for (const [name, func] of Object.entries(this.functions)) {
            func.on("change", () => this.emit("functionchange", { name }));
        }
    }

    sidebar(keybindings) {
        if (!this._sidebar && keybindings) {
            this._sidebar = this.createSidebarPanels(keybindings);
        }
        return this._sidebar;
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

    get currentTool() {
        return this.tools.current;
    }

    set currentTool(value) {
        const activated = this.tools.current && this.tools.current.activated;
        this.tools.previous = this.tools.current || value;

        if (this.tools.current) {
            this.tools.current.deactivate();
            this.tools.current.off("statuschange", this.onToolStatusChange);
        }

        this.tools.current = value;
        this.tools.current.on("statuschange", this.onToolStatusChange);

        if (this.sidebar()) {
            const listView = this.sidebar().tools.content;
            listView.activeItem = iter(listView.items()).find(item => item.data === value);
        }

        if (activated) {
            this.tools.current.activate(this);
        }

        this.redraw();
    }

    get modified() {
        return this.saveIndex !== this.undone;
    }

    onSave(saveIndex, saveName) {
        if (saveName !== this.saveName) {
            const changed = (saveIndex !== this.undone);
            this.exec("relocate", { path: saveName });
            this.saveName = saveName;
            saveIndex = changed ? saveIndex : this.undone;
        }
        this.saveIndex = saveIndex;
        this.emit("change");
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
        this.emit("change");
        this.redraw();
        return command;
    }

    redo() {
        if (this.undone > 0) {
            this.commandHistory[--this.undone].do();
            this.emit("change");
            this.redraw();
        }
    }

    undo(command) {
        if (this.commandHistory.length > this.undone && (!command || command === this.commandHistory[this.undone])) {
            this.commandHistory[this.undone++].undo();
            this.emit("change");
            this.redraw();
            return true;
        }
        return false;
    }

    redraw() {
        this.emit("redraw");
    }

    statusChange(...args) {
        const status = {};

        const fn = this._statusFn || (this._statusFn = {
            tool: () => this.tools.current.status,
            layer: () => "Layer: " + (this.activeLayer || "None").toString(),
            cursor: () => this.cursor.status,
            zoom: () => Math.round(100 * this.view.scale) + "%",
        });

        if (args.length === 0) args = Object.keys(fn);
        args.forEach(name => status[name] = fn[name]());
        this.emit("statuschange", { status });
    }

    get width() { return this._width || 0; }
    get height() { return this._height || 0; }

    onResize() {
        this._width = this.element.clientWidth;
        this._height = this.element.clientHeight;
    }

    activate() {
        if (!this.activated) {
            this.activated = true;
            this.onResize();
            this.tools.passive.pan.activate(this);
            this.tools.passive.zoom.activate(this);
            this.tools.current.activate(this);
            this.statusChange();
        }
    }

    deactivate() {
        if (this.activated) {
            this.activated = false;
            this.tools.current.deactivate();
            this.tools.passive.zoom.deactivate();
            this.tools.passive.pan.deactivate();
        }
    }

    exec(command, params) {
        this.functions[command].exec(params);
    }

    onCommand(command, params) {
        if (command in this.functions) {
            this.exec(command, params);
        } else {
            this.tools.current.onCommand(command, params);
        }
    }

    onClose(event) {
        if (this.modified) {
            event.preventDefault();
            ui.confirm("Closing", `Save changes to ${Path.filename(this.saveName)}?`, "yes", result => {
                if (result === "no") {
                    this.saveIndex = this.undone;
                    event.panel.close();
                }
            });
        } else if (this.renderer) {
            this.renderer.disposeNodeResources(this.map);
        }
    }

    onPropertiesNodeChange() {
        this.sidebar().properties.header.title = this.sidebar().properties.content.node.nodeName + " properties";
    }

    onMapAttrChange(event) {
        if (this.renderer && (event.attribute === "src" || event.attribute === "color-key")) {
            this.renderer.disposeNodeResources(event.target);
        }
        this.redraw();
    }

    onMapVisibilityChange() {
        this.redraw();
    }

    onViewChange() {
        this.statusChange("cursor", "zoom");
        this.redraw();
    }

    onToolStatusChange() {
        this.statusChange("tool");
    }

    get activeLayer() {
        return this._activeLayer || null;
    }

    set activeLayer(layer) {
        layer = layer || null;
        if (this.activeLayer !== layer) {
            this._activeLayer = layer;
            this.statusChange("layer");
        }
    }

    onSelectionChange() {
        const node = iter(this.selection.nodes).first();
        if (node === this.map) {
            this.activeLayer = null;
        } else if (node instanceof LayerNode) {
            this.activeLayer = node;
        }
        this.emit("selectionchange");
        this.redraw();
    }

    onCursorChange() {
        this.statusChange("cursor");
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
