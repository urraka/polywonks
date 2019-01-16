import * as PMS from "./pms/pms.js";
import * as ui from "./ui/ui.js";
import { Path } from "./support/path.js";
import { Event } from "./support/event.js";
import { MapDocument } from "./map/map.js";
import { File } from "./file.js";
import { RenderView } from "./render.view.js";
import { cfg } from "./settings.js";
import { SelectTool } from "./tool.select.js";
import { PanTool } from "./tool.pan.js";
import { ZoomTool } from "./tool.zoom.js";
import { MapExplorer } from "./map.explorer.js";
import { Selection } from "./selection.js";
import { MapProperties } from "./map.properties.js";
import { SaveDialog } from "./dialog.save.js";

export class Editor extends ui.Panel {
    constructor(renderer, map = MapDocument.default()) {
        super("editor");

        this.renderer = renderer;
        this.openedAsDefault = false;
        this.view = new RenderView(renderer);
        this.map = map;
        this.map.iconsInfo = this.renderer.iconsInfo;
        this.selection = new Selection(this);
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
        this.explorer = new MapExplorer(this);
        this.properties = new MapProperties(this);

        if (Path.ext(map.path).toLowerCase() === ".pms") {
            this.saveName = this.saveName.slice(0, -4) + ".polywonks";
        } else if (map.path === "") {
            this.saveName = "Untitled.polywonks";
        }

        this.map.on("attributechange", e => this.onMapAttrChange(e));
        this.view.on("change", () => this.onViewChange());
        this.selection.on("change", () => this.onSelectionChange());
        this.currentTool.on("change", e => this.emit(new Event("toolchange", { status: e.status })));
        this.element.addEventListener("mousemove", e => this.onMouseMove(e));

        setTimeout(() => this.onSelectionChange());
    }

    get modified() {
        return this.saveIndex !== this.undone;
    }

    save() {
        if (this.saveName.startsWith("/")) {
            const mount = this.saveName.substring(1).split("/").shift();
            File.refresh(mount, () => {
                if (File.exists(this.saveName)) {
                    File.write(this.saveName, this.map.serialize(), ok => {
                        if (ok) {
                            this.saveIndex = this.undone;
                            this.emit(new Event("change"));
                        } else {
                            this.onDeactivate();
                            ui.msgbox("Save", "Failed to write file " + this.saveName, () => this.onActivate());
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

        this.onDeactivate();
        dialog.on("close", () => this.onActivate());

        dialog.on("save", event => {
            File.write(event.path, this.map.serialize(), ok => {
                if (ok) {
                    this.saveName = event.path;
                    this.saveIndex = this.undone;
                    this.emit(new Event("change"));
                } else {
                    this.onDeactivate();
                    ui.msgbox("Save as...", "Failed to write file " + event.path, () => this.onActivate());
                }
            });
        });

        dialog.show();
    }

    export() {
        const filename = Path.replaceExtension(Path.filename(this.saveName), ".pms");
        const path = Path.resolve(cfg("app.export-location"), filename);
        const mount = path.substring(1).split("/").shift();

        File.refresh(mount, () => {
            if (File.exists(path)) {
                File.write(path, this.map.toPMS().toArrayBuffer(), ok => {
                    if (!ok) {
                        this.onDeactivate();
                        ui.msgbox("Export", "Failed to write file " + path, () => this.onActivate());
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

        this.onDeactivate();
        dialog.on("close", () => this.onActivate());

        dialog.on("save", event => {
            File.write(event.path, this.map.toPMS().toArrayBuffer(), ok => {
                if (!ok) {
                    this.onDeactivate();
                    ui.msgbox("Export as...", "Failed to write file " + event.path, () => this.onActivate());
                }
            });
        });

        dialog.show();
    }

    do(command) {
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
        this.emit(new Event("change"));
        return command;
    }

    redo() {
        if (this.undone > 0) {
            this.commandHistory[--this.undone].do();
            this.emit(new Event("change"));
        }
    }

    undo() {
        if (this.commandHistory.length > this.undone) {
            this.commandHistory[this.undone++].undo();
            this.emit(new Event("change"));
        }
    }

    redraw() {
        this.renderer.redraw(this);
    }

    onActivate() {
        this.panTool.activate(this);
        this.zoomTool.activate(this);
        this.currentTool.activate(this);
        this.emit(new Event("viewchange"));
        this.redraw();
    }

    onDeactivate() {
        this.currentTool.deactivate();
        this.zoomTool.deactivate();
        this.panTool.deactivate();
    }

    onClose(event) {
        if (this.modified) {
            event.preventDefault();
            this.onDeactivate();
            const message = `Save changes to ${Path.filename(this.saveName)}?`;
            ui.confirm("Closing", message, "yes", result => {
                this.onActivate();
                if (result === "no") {
                    this.saveIndex = this.undone;
                    event.panel.close();
                }
            });
        } else {
            this.renderer.disposeMapResources(this.map);
        }
    }

    onMapAttrChange() {
        this.redraw();
    }

    onViewChange() {
        this.emit(new Event("viewchange"));
        this.redraw();
    }

    onSelectionChange() {
        this.emit(new Event("selectionchange"));
        this.redraw();
    }

    onMouseMove(event) {
        const rect = event.target.getBoundingClientRect();
        const pos = this.view.canvasToMap(event.clientX - rect.left, event.clientY - rect.top);
        this.cursor.x = pos.x;
        this.cursor.y = pos.y;
        this.emit(new Event("cursorchange"));
    }

    static loadFile(renderer, path, fn) {
        const ext = Path.ext(path).toLowerCase();

        if (!path.startsWith("/")) {
            throw new Error("Editor.loadFile() - path is not absolute.");
        }

        if (ext !== ".pms" && ext !== ".polywonks") {
            throw new Error("Editor.loadFile() - file must be either .pms or .polywonks.");
        }

        File.refresh(path.substring(1).split("/").shift(), () => {
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
        const pms = PMS.Map.fromArrayBuffer(buffer);
        return new Editor(renderer, MapDocument.fromPMS(pms, path));
    }

    static loadPolywonks(renderer, text, path = "") {
        const map = MapDocument.unserialize(text, path);
        return new Editor(renderer, map);
    }
}
