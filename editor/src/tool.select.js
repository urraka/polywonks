import { Rect } from "./support/rect.js";
import { mod } from "./support/math.js";
import { Pointer } from "./support/pointer.js";
import { Tool } from "./tool.js";
import { cfg } from "./settings.js";

export class SelectTool extends Tool {
    constructor() {
        super();
        this.selection = null;
        this.cycle = 0;
        this.affectedNode = null;
        this.revertNodes = null;
        this.selecting = false;
        this.mode = "replace";
        this.rect = null;
        this.rectPosition = { x: 0, y: 0 };
        this.clickPosition = { x: 0, y: 0 };
        this.pointer = new Pointer();
        this.pointer.on("begin", e => this.onPointerBegin(e.mouseEvent));
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
        this.pointer.on("end", e => this.onPointerEnd(e.mouseEvent));
        this.onKey = this.onKey.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
    }

    onActivate() {
        this.selection = this.editor.selection;
        this.cycle = 0;
        this.affectedNode = null;
        this.revertNodes = null;
        this.command = null;
        this.selecting = false;
        this.mode = "replace";
        this.rect = null;
        this.rectPosition = { x: 0, y: 0 };
        this.clickPosition = { x: 0, y: 0 };
        this.pointer.activate(this.editor.element, 0);
        this.editor.element.addEventListener("mouseleave", this.onMouseLeave);
        document.addEventListener("keyup", this.onKey);
        document.addEventListener("keydown", this.onKey);
        this.emit("change", { status: "Select" });
    }

    onDeactivate() {
        document.removeEventListener("keyup", this.onKey);
        document.removeEventListener("keydown", this.onKey);
        this.editor.element.removeEventListener("mouseleave", this.onMouseLeave);
        this.pointer.deactivate();
        this.editor.previewNodes.clear();
        this.editor.redraw();
        this.emit("change", { status: "" });
    }

    updatePreviewNodes() {
        this.editor.previewNodes.clear();
        this.editor.reactiveNode = null;

        if (this.rect) {
            const nodes = this.rect.width > 0 && this.rect.height > 0 ?
                this.editor.map.nodesContainedByRect(...this.rect.values(), this.editor.view.scale) :
                this.editor.map.nodesIntersectingRect(...this.rect.values(), this.editor.view.scale);

            if (this.mode === "subtract") {
                this.editor.previewNodes = new Set([...nodes].filter(node => this.selection.has(node)));
            } else {
                this.editor.previewNodes = new Set(nodes);
            }
        } else {
            const { x, y } = this.editor.cursor;
            let nodes = [...this.editor.map.nodesAt(x, y, this.editor.view.scale)];

            if (this.mode === "subtract") {
                nodes = nodes.filter(node => this.selection.has(node));

                if (nodes.length > 0) {
                    this.cycle = this.cycle % nodes.length;
                    nodes = [nodes[mod(-1 - this.cycle, nodes.length)]];
                }

                this.editor.previewNodes = new Set(nodes);
                this.editor.reactiveNode = nodes.pop();
            } else {
                if (this.mode === "add") {
                    nodes = nodes.filter(node => !this.selection.has(node));
                }

                this.editor.reactiveNode = null;
                this.editor.previewNodes = new Set();

                if (nodes.length > 0) {
                    let index = nodes.indexOf(this.affectedNode);

                    if (index >= 0) {
                        nodes.splice(index--, 1);
                    }

                    if (nodes.length > 0) {
                        this.cycle = this.cycle % nodes.length;
                        this.editor.reactiveNode = nodes[mod(index - this.cycle, nodes.length)];
                        this.editor.previewNodes = new Set(nodes);
                        console.log(`cycle: ${this.cycle}, index: ${index}, length: ${nodes.length}, mod: ${mod(index - this.cycle, nodes.length)}`);
                    }
                }
            }
        }

        this.editor.redraw();
    }

    updateMode(event) {
        switch ([+event.shiftKey, +event.altKey, +event.ctrlKey, +event.metaKey].join("")) {
            case "1000": this.mode = "add"; break;
            case "0100": this.mode = "subtract"; break;
            default: this.mode = "replace";
        }

        switch (this.mode) {
            case "replace":
                this.emit("change", { status: "Select" });
                break;
            case "add":
                this.emit("change", { status: "Select (+)" });
                break;
            case "subtract":
                this.emit("change", { status: "Select (-)" });
                break;
        }
    }

    onKey(event) {
        if (event.key === "Shift" || event.key === "Alt") {
            event.preventDefault();
            const mode = this.mode;
            this.updateMode(event)
            if (this.mode !== mode) {
                this.updatePreviewNodes();
            }
        } else if (event.type === "keydown" && event.key === "Control") {
            event.preventDefault();
            this.cycle++;
            this.updatePreviewNodes();
        }
    }

    onPointerBegin(event) {
        this.clickPosition.x = event.clientX;
        this.clickPosition.y = event.clientY;

        if (this.rect) {
            return;
        }

        let changed = false;
        this.updateMode(event);
        this.updatePreviewNodes();

        if (this.mode === "replace") {
            changed = this.selection.clear();
        }

        this.affectedNode = this.editor.reactiveNode;
        this.revertNodes = this.selection.clone();
        const affected = this.affectedNode ? new Set([this.affectedNode]) : new Set();
        changed = this.selection[this.mode](affected) || changed;
        this.cycle = 0;

        if (!this.affectedNode) {
            this.revertNodes = null;
        }

        if (this.mode === "subtract") {
            this.affectedNode = null;
        }

        if (changed) {
            this.updatePreviewNodes();
        }

        this.selecting = true;
        this.rectPosition.x = this.editor.cursor.x;
        this.rectPosition.y = this.editor.cursor.y;
    }

    onPointerEnd(event) {
        this.clickPosition.x = event.clientX;
        this.clickPosition.y = event.clientY;

        this.selecting = false;
        this.command = null;

        if (this.rect) {
            this.rect.x1 = this.editor.cursor.x;
            this.rect.y1 = this.editor.cursor.y;

            const nodes = this.rect.width > 0 && this.rect.height > 0 ?
                this.editor.map.nodesContainedByRect(...this.rect.values(), this.editor.view.scale) :
                this.editor.map.nodesIntersectingRect(...this.rect.values(), this.editor.view.scale);

            this.selection[this.mode](new Set(nodes));
            this.rect = null;
            this.editor.redraw();
        }
    }

    onPointerMove(event) {
        if (this.selecting && !this.rect) {
            const threshold = cfg("editor.selection-rect-threshold");
            if (Math.abs(event.clientX - this.clickPosition.x) > threshold ||
                Math.abs(event.clientY - this.clickPosition.y) > threshold) {
                this.rect = new Rect(this.rectPosition.x, this.rectPosition.y, 0, 0);

                if (this.revertNodes) {
                    this.selection.replace(this.revertNodes);
                    this.affectedNode = null;
                    this.revertNodes = null;
                }
            }
        }

        if (this.rect) {
            this.rect.x1 = this.editor.cursor.x;
            this.rect.y1 = this.editor.cursor.y;
        }

        this.updatePreviewNodes();
    }

    onMouseLeave() {
        if (!this.rect) {
            this.editor.previewNodes.clear();
            this.editor.reactiveNode = null;
            this.editor.redraw();
        }
    }
}
