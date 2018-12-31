import * as PMS from "./pms.js";
import * as ui from "./ui.js";
import { RenderView } from "./render.view.js";
import { MapDocument } from "./map.document.js";
import { File } from "./file.js";
import { cfg } from "./settings.js";
import { SelectTool } from "./tool.select.js";
import { Path } from "./path.js";
import { Event } from "./event.js";

export class Editor extends ui.Panel {
    constructor(renderer, map = new MapDocument()) {
        super("editor");

        this.renderer = renderer;
        this.openedAsDefault = false;
        this.view = new RenderView(renderer);
        this.map = map;
        this.map.iconsInfo = this.renderer.iconsInfo;
        this.selectedNodes = new Set();
        this.previewNodes = new Set();
        this.reactiveNode = null;
        this.modified = false;
        this.cursor = { x: 0, y: 0 };
        this.undone = 0;
        this.commandHistory = [];
        this.lastMouseMove = null;
        this.currentTool = new SelectTool();

        this.view.on("change", e => this.onViewChange(e));
        this.currentTool.on("change", e => this.emit(new Event("toolchange", { status: e.status })));
        this.element.addEventListener("mousemove", e => this.onMouseMove(e));
        this.element.addEventListener("mousedown", e => this.onMouseDown(e));
        this.element.addEventListener("wheel", e => this.onMouseWheel(e));
    }

    do(command) {
        this.commandHistory.splice(0, this.undone, command);
        this.undone = 0;

        const limit = cfg("editor.undo-limit");
        if (limit > 0 && this.commandHistory.length > limit) {
            this.commandHistory = this.commandHistory.slice(0, limit);
        }

        command.do(this);
        return command;
    }

    redo() {
        if (this.undone > 0) {
            this.commandHistory[--this.undone].do(this);
        }
    }

    undo() {
        if (this.commandHistory.length > this.undone) {
            this.commandHistory[this.undone++].undo(this);
        }
    }

    undoAndForget(command) {
        const index = this.commandHistory.indexOf(command);
        if (index >= 0) {
            this.commandHistory.splice(index, 1);
            if (this.undone > index) {
                this.undone--;
            }
        }
        command.undo(this);
    }

    redraw() {
        this.renderer.redraw(this);
    }

    onActivate() {
        this.currentTool.activate(this);
        this.emit(new Event("viewchange"));
        this.redraw();
    }

    onDeactivate() {
        this.currentTool.deactivate();
    }

    onClose(event) {
        if (this.modified) {
            event.preventDefault();
            // TODO: show confirm message and continue to close the tab somehow
        } else {
            this.renderer.disposeMapResources(this.map);
        }
    }

    onViewChange(event) {
        this.emit(new Event("viewchange"));
        this.redraw();
    }

    onMouseMove(event) {
        this.lastMouseMove = event;
        const rect = event.target.getBoundingClientRect();
        const pos = this.view.canvasToMap(event.clientX - rect.left, event.clientY - rect.top);
        this.cursor.x = pos.x;
        this.cursor.y = pos.y;
        this.emit(new Event("cursorchange"));
    }

    onMouseDown(event) {
        if (event.button === 1) {
            this.pan(event);
        }
    }

    onMouseWheel(event) {
        const factor = cfg("editor.zoom-factor");
        if (event.deltaY < 0) {
            // when zooming in hook the cursor to the map coordinates
            this.zoom(factor, event.offsetX, event.offsetY);
        } else {
            // when zooming out hook the canvas center instead
            this.zoom(1 / factor, this.renderer.width / 2, this.renderer.height / 2);
        }
    }

    zoom(factor, x, y) {
        const z0 = cfg("editor.zoom-min");
        const z1 = cfg("editor.zoom-max");
        const s = this.view.scale;
        const dx = x - this.renderer.width / 2;
        const dy = y - this.renderer.height / 2;
        this.view.scale = Math.max(z0, Math.min(z1, this.view.scale * factor));
        this.view.x -= dx / this.view.scale - dx / s;
        this.view.y -= dy / this.view.scale - dy / s;
        this.redraw();

        if (this.lastMouseMove) {
            this.element.dispatchEvent(this.lastMouseMove);
        }
    }

    pan(event) {
        let x = event.clientX;
        let y = event.clientY;

        const mousemove = (event) => {
            this.view.x += (x - event.clientX) / this.view.scale;
            this.view.y += (y - event.clientY) / this.view.scale;
            x = event.clientX;
            y = event.clientY;
            this.redraw();
        };

        const mouseup = (event) => {
            if (event.button === 1) {
                window.removeEventListener("mousemove", mousemove, true);
                window.removeEventListener("mouseup", mouseup, true);
            }
        };

        window.addEventListener("mousemove", mousemove, true);
        window.addEventListener("mouseup", mouseup, true);
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
