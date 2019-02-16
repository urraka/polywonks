import * as PMS from "./pms/pms.js";
import * as ui from "./ui/ui.js";
import { Path } from "./support/path.js";
import { MapDocument, LayerNode, ConnectionNode, ResourceNode, ClonedNodesCollection } from "./map/map.js";
import { File } from "./file.js";
import { RenderView } from "./render.view.js";
import { cfg, Settings } from "./settings.js";
import { SelectTool } from "./tool.select.js";
import { PanTool } from "./tool.pan.js";
import { ZoomTool } from "./tool.zoom.js";
import { MapExplorer } from "./map.explorer.js";
import { Selection } from "./selection.js";
import { MapProperties } from "./map.properties.js";
import { SaveDialog } from "./dialog.save.js";
import { EditorCommand } from "./editor.command.js";
import { Clipboard } from "./clipboard.js";

export class Editor extends ui.Panel {
    constructor(renderer, map = MapDocument.default()) {
        super("editor");

        this.renderer = renderer;
        this.activated = false;
        this.openedAsDefault = false;
        this.view = new RenderView(renderer);
        this.map = map;
        this.map.iconsInfo = this.renderer.iconsInfo;
        this.selection = new Selection(this);
        this.activeLayer = null;
        this.previewNodes = new Set();
        this.reactiveNode = null;
        this.cursor = { x: 0, y: 0 };
        this.saveName = map.path;
        this.saveIndex = 0;
        this.undone = 0;
        this.commandHistory = [];
        this.currentTool = new SelectTool();
        this.panTool = new PanTool();
        this.zoomTool = new ZoomTool();

        this.sidebarPanels = new ui.MultiPanelView();
        this.sidebarPanels.element.classList.add("editor-sidebar-panels");
        this.explorer = this.sidebarPanels.addPanel("Map", new MapExplorer(this));
        this.properties = this.sidebarPanels.addPanel("Properties", new MapProperties(this));

        if (map.path === "") {
            this.saveName = "Untitled.polywonks";
        } else if (map.path.startsWith("/library/") || Path.ext(map.path).toLowerCase() === ".pms") {
            this.saveName = Path.replaceExtension(Path.filename(map.path), ".polywonks");
        }

        this.properties.content.on("nodechange", () => this.onPropertiesNodeChange());
        this.map.on("attributechange", e => this.onMapAttrChange(e));
        this.map.on("visibilitychange", e => this.onMapVisibilityChange(e));
        this.view.on("change", () => this.onViewChange());
        this.selection.on("change", () => this.onSelectionChange());
        this.currentTool.on("change", e => this.emit("toolchange", { status: e.status }));
        this.element.addEventListener("mousemove", e => this.onMouseMove(e));
        Settings.on("change", e => this.onSettingChange(e.setting));

        this.onSelectionChange();
    }

    get modified() {
        return this.saveIndex !== this.undone;
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

    undo() {
        if (this.commandHistory.length > this.undone) {
            this.commandHistory[this.undone++].undo();
            this.emit("change");
            this.redraw();
        }
    }

    redraw() {
        this.emit("redraw");
    }

    activate() {
        if (!this.activated) {
            this.activated = true;
            this.panTool.activate(this);
            this.zoomTool.activate(this);
            this.currentTool.activate(this);
            this.emit("viewchange");
        }
    }

    deactivate() {
        if (this.activated) {
            this.activated = false;
            this.currentTool.deactivate();
            this.zoomTool.deactivate();
            this.panTool.deactivate();
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

    cut() {
        this.copy();
        this.delete();
    }

    copy() {
        const clonedNodes = new ClonedNodesCollection();

        const clones = [...this.selection.nodes]
            .filter(node => node.parentNode && (node.parentNode instanceof LayerNode))
            .map(node => clonedNodes.clone(node));

        clones.forEach(clone => {
            for (const clonedNode of [...clone.descendants()]) {
                if (clonedNode instanceof ConnectionNode) {
                    const originalNode = clonedNodes.cloneToNode.get(clonedNode);
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

    paste() {
        if (this.activeLayer && !Clipboard.empty()) {
            this.selection.clear();

            const data = Clipboard.load();
            const resources = this.map.resources;
            const mount = Path.mount(this.map.path);
            const dir = Path.dir(this.map.path);
            const command = new EditorCommand(this);

            data.nodes.forEach(root => {
                for (const node of root.tree()) {
                    for (const [,attr] of node.attributes) {
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

                command.insert(this.activeLayer, null, root);
            });

            this.do(command);
        }
    }

    onCommand(command) {
        this.currentTool.onCommand(command);
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
        this.properties.header.title = this.properties.content.node.nodeName + " properties";
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
        this.emit("viewchange");
        this.redraw();
    }

    onSelectionChange() {
        for (const node of this.selection.nodes) {
            if (node instanceof LayerNode) {
                this.activeLayer = node;
            } else {
                this.activeLayer = [...node.filter(node.ancestors(), LayerNode)].shift() || null;
            }
            break;
        }

        this.emit("selectionchange");
        this.redraw();
    }

    onMouseMove(event) {
        const rect = event.target.getBoundingClientRect();
        const pos = this.view.canvasToMap(event.clientX - rect.left, event.clientY - rect.top);
        this.cursor.x = pos.x;
        this.cursor.y = pos.y;
        this.emit("cursorchange");
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
