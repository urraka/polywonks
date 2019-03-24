import * as PMS from "../pms/pms.js";
import * as ui from "../ui/ui.js";
import { Path } from "../support/path.js";
import { iter } from "../support/iter.js";
import { MapDocument, LayerNode, ConnectionNode, ResourceNode, ClonedNodesCollection, TriangleNode } from "../map/map.js";
import { File } from "../file.js";
import { Clipboard } from "../clipboard.js";
import { SaveDialog } from "../dialog.save.js";
import { RenderView } from "../render.view.js";
import { cfg, Settings } from "../settings.js";
import { MapExplorer } from "./map.explorer.js";
import { MapProperties } from "./map.properties.js";
import { Selection } from "./selection.js";
import { EditorCommand } from "./command.js";
import { Grid } from "./grid.js";
import { SelectTool } from "./tools/select.js";
import { PanTool } from "./tools/pan.js";
import { ZoomTool } from "./tools/zoom.js";
import { MoveTool } from "./tools/move.js";
import { PolygonTool } from "./tools/polygon.js";
import { CursorTool } from "./tools/cursor.js";

export class Editor extends ui.Panel {
    constructor(renderer, map = MapDocument.default()) {
        super("editor");

        this.renderer = renderer;
        this.activated = false;
        this.openedAsDefault = false;
        this.view = new RenderView(renderer);
        this.grid = new Grid(this.view);
        this.map = map;
        this.map.iconsInfo = this.renderer.iconsInfo;
        this.selection = new Selection(this);
        this.activeLayer = null;
        this.previewNodes = new Set();
        this.reactiveNode = null;
        this.cursor = new CursorTool();
        this.saveName = this.initialSaveName(map.path);
        this.saveIndex = 0;
        this.undone = 0;
        this.commandHistory = [];

        this.cursor.activate(this);
        this.tools = this.createTools();
        this.sidebar = this.createSidebarPanels();
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
            pan: new PanTool(),
            zoom: new ZoomTool(),
            select: new SelectTool(),
            move: new MoveTool(),
            polygon: new PolygonTool(),
        };
    }

    createSidebarPanels() {
        const sidebar = {};
        sidebar.mainPanel = new ui.MultiPanelView();
        sidebar.mainPanel.element.classList.add("editor-sidebar-panels");
        sidebar.tools = sidebar.mainPanel.addPanel(null, new ui.ListView());
        sidebar.explorer = sidebar.mainPanel.addPanel("Map", new MapExplorer(this));
        sidebar.properties = sidebar.mainPanel.addPanel("Map Properties", new MapProperties(this));
        sidebar.tools.content.addItem(new ui.ListViewItem("Select", this.tools.select));
        sidebar.tools.content.addItem(new ui.ListViewItem("Move", this.tools.move));
        sidebar.tools.content.addItem(new ui.ListViewItem("Create Polygons", this.tools.polygon));
        return sidebar;
    }

    setupEvents() {
        this.onToolStatusChange = this.onToolStatusChange.bind(this);
        this.sidebar.properties.content.on("nodechange", () => this.onPropertiesNodeChange());
        this.sidebar.tools.content.on("itemclick", e => this.currentTool = e.item.data);
        this.map.on("attributechange", e => this.onMapAttrChange(e));
        this.map.on("visibilitychange", e => this.onMapVisibilityChange(e));
        this.view.on("change", () => this.onViewChange());
        this.cursor.on("change", () => this.onCursorChange());
        this.selection.on("change", () => this.onSelectionChange());
        Settings.on("change", e => this.onSettingChange(e.setting));
    }

    get modified() {
        return this.saveIndex !== this.undone;
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

        const element = this.sidebar.tools.content.element.querySelector("li.active");
        if (element) element.classList.remove("active");
        const item = iter(this.sidebar.tools.content.items()).find(item => this.tools[item.data] === this.tools.current);
        if (item) item.element.classList.add("active");

        if (activated) {
            this.tools.current.activate(this);
        }

        this.redraw();
    }

    relocateMap(newPath) {
        if (!newPath.startsWith("/")) {
            throw new Error("Editor.relocateMap() - directory must be absolute");
        }

        const command = new EditorCommand(this);
        const mount = Path.mount(newPath);
        const dir = Path.dir(newPath);

        command.relocate(this.map, newPath);

        for (const node of this.map.resources.descendants()) {
            if (node.attributes.has("src")) {
                const path = node.path;
                if (path) {
                    if (Path.mount(path) === mount) {
                        command.attr(node, "src", Path.relative(dir, path));
                    } else {
                        command.attr(node, "src", path);
                    }
                }
            }
        }

        this.do(command);
    }

    save() {
        if (this.saveName.startsWith("/")) {
            File.refresh(Path.mount(this.saveName), () => {
                if (File.exists(this.saveName)) {
                    File.write(this.saveName, this.map.serialize(), ok => {
                        if (ok) {
                            this.saveIndex = this.undone;
                            this.emit("change");
                        } else {
                            ui.msgbox("Save", "Failed to write file " + this.saveName);
                        }
                    });
                } else {
                    this.saveAs();
                }
            });
        } else {
            this.saveAs();
        }
    }

    saveAs() {
        const dialog = new SaveDialog("Save as...", Path.filename(this.saveName), Path.dir(this.saveName) || "/polydrive/");

        dialog.on("save", event => {
            const editor = new Editor(this.renderer, this.map.clone());
            editor.relocateMap(event.path);

            File.write(event.path, editor.map.serialize(), ok => {
                if (ok) {
                    this.relocateMap(event.path);
                    this.saveName = event.path;
                    this.saveIndex = this.undone;
                    this.emit("change");
                } else {
                    ui.msgbox("Save as...", "Failed to write file " + event.path);
                }
            });
        });

        dialog.show();
    }

    export() {
        const filename = Path.replaceExtension(Path.filename(this.saveName), ".pms");
        const path = Path.resolve(cfg("app.export-location"), filename);

        File.refresh(Path.mount(path), () => {
            if (File.exists(path)) {
                File.write(path, this.map.toPMS().toArrayBuffer(), ok => {
                    if (!ok) {
                        ui.msgbox("Export", "Failed to write file " + path);
                    }
                });
            } else {
                this.exportAs();
            }
        });
    }

    exportAs() {
        const filename = Path.replaceExtension(Path.filename(this.saveName), ".pms");
        const path = Path.resolve(cfg("app.export-location"), filename);
        const dialog = new SaveDialog("Export as...", Path.filename(path), Path.dir(path));

        dialog.on("save", event => {
            File.write(event.path, this.map.toPMS().toArrayBuffer(), ok => {
                if (!ok) {
                    ui.msgbox("Export as...", "Failed to write file " + event.path);
                }
            });
        });

        dialog.show();
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

    activate() {
        if (!this.activated) {
            this.activated = true;
            this.tools.pan.activate(this);
            this.tools.zoom.activate(this);
            this.tools.current.activate(this);
            this.statusChange();
        }
    }

    deactivate() {
        if (this.activated) {
            this.activated = false;
            this.tools.current.deactivate();
            this.tools.zoom.deactivate();
            this.tools.pan.deactivate();
        }
    }

    delete() {
        const command = new EditorCommand(this);
        for (const node of this.selection.nodes) {
            if (node !== this.map && node.parentNode !== this.map &&
                [...node.ancestors()].every(n => !this.selection.nodes.has(n))
            ) {
                command.remove(node);
            }
        }
        this.do(command);
    }

    canCopy() {
        for (const node of this.selection.nodes) {
            if (node.parentNode && (node.parentNode instanceof LayerNode)) {
                return true;
            }
        }
        return false;
    }

    cut() {
        this.copy();
        this.delete();
    }

    copy() {
        const clonedNodes = new ClonedNodesCollection();

        const clones = [...this.selection.nodes]
            .filter(node => node.parentNode && (node.parentNode instanceof LayerNode))
            .map(node => clonedNodes.clone(node));

        if (clones.length > 0) {
            clones.forEach(clone => {
                for (const clonedNode of [...clone.descendants()]) {
                    if (clonedNode instanceof ConnectionNode) {
                        const originalNode = clonedNodes.cloneToOriginal.get(clonedNode);
                        if (!this.selection.has(originalNode) ||
                            !this.selection.has(originalNode.parentNode) ||
                            !this.selection.has(originalNode.attr("waypoint"))
                        ) {
                            clonedNode.remove();
                        }
                    }
                }
            });

            clonedNodes.resolveReferences();

            Clipboard.save({
                path: this.map.path,
                nodes: clones
            });
        }
    }

    paste() {
        if (this.activeLayer && !Clipboard.empty()) {
            const data = Clipboard.load();
            data.nodes = data.nodes.filter(node => this.activeLayer.isNodeAllowed(node));

            if (data.nodes.length === 0) {
                return;
            }

            const resources = this.map.resources;
            const mount = Path.mount(this.map.path);
            const dir = Path.dir(this.map.path);

            this.selection.clear();
            const command = new EditorCommand(this);

            data.nodes.forEach(nodeEntry => {
                for (const node of nodeEntry.tree()) {
                    for (const [, attr] of node.attributes) {
                        if (attr.dataType === "node" && attr.value && (attr.value instanceof ResourceNode)) {
                            const resourceNode = attr.value;
                            const path = resourceNode.pathFrom(Path.dir(data.path)).toLowerCase();

                            for (const res of resources.children()) {
                                if (res.nodeName === resourceNode.nodeName && res.path.toLowerCase() === path) {
                                    attr.value = res;
                                    break;
                                }
                            }

                            if (attr.value === resourceNode) {
                                if (path) {
                                    if (Path.mount(path) === mount) {
                                        resourceNode.attr("src", Path.relative(dir, path));
                                    } else {
                                        resourceNode.attr("src", path);
                                    }
                                }

                                command.insert(resources, null, resourceNode);
                            }
                        }
                    }
                }

                if (nodeEntry instanceof TriangleNode) {
                    const polyTypes = this.activeLayer.polyTypes();
                    if (![...polyTypes.names()].includes(nodeEntry.attr("poly-type"))) {
                        nodeEntry.attr("poly-type", polyTypes.defaultName());
                    }
                }

                command.insert(this.activeLayer, null, nodeEntry);
            });

            this.do(command);
        }
    }

    onCommand(command) {
        this.tools.current.onCommand(command);
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
        } else {
            this.renderer.disposeNodeResources(this.map);
        }
    }

    onPropertiesNodeChange() {
        this.sidebar.properties.header.title = this.sidebar.properties.content.node.nodeName + " properties";
    }

    onMapAttrChange(event) {
        if (event.attribute === "src" || event.attribute === "color-key") {
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

    onSelectionChange() {
        const activeLayer = this.activeLayer;
        const node = iter(this.selection.nodes).first();

        if (node === this.map) {
            this.activeLayer = null;
        } else if (node instanceof LayerNode) {
            this.activeLayer = node;
        } else if (node && activeLayer) {
            this.activeLayer = node.closest("layer") || activeLayer;
        }

        if (this.activeLayer !== activeLayer) {
            this.statusChange("layer");
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
            zoom.zoom(1, this.renderer.width / 2, this.renderer.height / 2);
            zoom.deactivate();
        }
    }

    static loadFile(renderer, path, fn) {
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
                    fn(buffer ? Editor.loadPms(renderer, buffer, path) : null);
                });
            } else if (ext === ".polywonks") {
                File.readText(path, text => {
                    fn(text ? Editor.loadPolywonks(renderer, text, path) : null);
                });
            }
        });
    }

    static loadPms(renderer, buffer, path = "") {
        try {
            const pms = PMS.Map.fromArrayBuffer(buffer);
            return new Editor(renderer, MapDocument.fromPMS(pms, path));
        } catch (e) {
            return null;
        }
    }

    static loadPolywonks(renderer, text, path = "") {
        try {
            const map = MapDocument.unserialize(text, path);
            return new Editor(renderer, map);
        } catch (e) {
            return null;
        }
    }
}
