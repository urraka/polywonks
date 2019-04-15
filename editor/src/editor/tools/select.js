import { cfg } from "../../settings.js";
import { Rect } from "../../support/rect.js";
import { mod } from "../../support/math.js";
import { Pointer, MovementThreshold } from "../../support/pointer.js";
import { Tool } from "./tool.js";

export class SelectTool extends Tool {
    constructor() {
        super();
        this.selection = null;
        this.cycle = 0;
        this.affectedNode = null;
        this.revertNodes = null;
        this.selecting = false;
        this._mode = "replace";
        this.rect = null;
        this.rectPosition = { x: 0, y: 0 };
        this.movement = new MovementThreshold();
        this.pointer = new Pointer();
        this.pointer.on("begin", e => this.onPointerBegin(e.mouseEvent));
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
        this.pointer.on("end", e => this.onPointerEnd(e.mouseEvent));
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onSelectionChange = this.onSelectionChange.bind(this);
    }

    onActivate() {
        this.selection = this.editor.selection;
        this.cycle = 0;
        this.affectedNode = null;
        this.revertNodes = null;
        this.selecting = false;
        this._mode = "replace";
        this.rect = null;
        this.rectPosition = { x: 0, y: 0 };
        this.movement.reset(cfg("editor.drag-threshold"));
        this.pointer.activate(this.editor.element, 0);
        this.editor.element.addEventListener("mouseenter", this.onMouseEnter);
        this.editor.element.addEventListener("mouseleave", this.onMouseLeave);
        this.selection.on("change", this.onSelectionChange);
        this.emit("statuschange");
    }

    onDeactivate() {
        this.selection.off("change", this.onSelectionChange);
        this.editor.element.removeEventListener("mouseenter", this.onMouseEnter);
        this.editor.element.removeEventListener("mouseleave", this.onMouseLeave);
        this.pointer.deactivate();
        this.editor.previewNodes.clear();
        this.editor.redraw();
        this.emit("statuschange");
    }

    get status() {
        return this.activated ? {
            "replace": "Select",
            "add": "Select (+)",
            "subtract": "Select (-)",
        }[this.mode] : "";
    }

    get mode() {
        return this._mode;
    }

    set mode(value) {
        if (this._mode !== value) {
            this._mode = value;
            this.emit("statuschange");
            this.updatePreviewNodes();
        }
    }

    get rootNode() {
        return this.editor.activeLayer || this.editor.map;
    }

    onCommand(command) {
        if (this.activated) {
            switch (command) {
                case "+select.add": this.mode = "add"; break;
                case "+select.subtract": this.mode = "subtract"; break;
                case "-select.add": this.mode = "replace"; break;
                case "-select.subtract": this.mode = "replace"; break;
                case "select.cycle": {
                    this.cycle++;
                    this.updatePreviewNodes();
                    break;
                }
            }
        }
    }

    updatePreviewNodes() {
        this.editor.previewNodes.clear();
        this.editor.reactiveNode = null;

        if (this.rect) {
            const nodes = this.rect.width > 0 && this.rect.height > 0 ?
                this.rootNode.nodesContainedByRect(...this.rect.values(), this.editor.view.scale) :
                this.rootNode.nodesIntersectingRect(...this.rect.values(), this.editor.view.scale);

            if (this.mode === "subtract") {
                this.editor.previewNodes = new Set([...nodes].filter(node => this.selection.has(node)));
            } else {
                this.editor.previewNodes = new Set(nodes);
            }
        } else {
            const { x, y } = this.editor.cursor.position;
            let nodes = [...this.rootNode.nodesAt(x, y, this.editor.view.scale)];

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
                    } else {
                        index = 0;
                    }

                    if (nodes.length > 0) {
                        this.cycle = this.cycle % nodes.length;
                        this.editor.reactiveNode = nodes[mod(index - this.cycle, nodes.length)];
                        this.editor.previewNodes = new Set(nodes);
                    }
                }
            }
        }

        this.editor.redraw();
    }

    onSelectionChange() {
        if (this.affectedNode && !this.selection.has(this.affectedNode)) {
            this.affectedNode = null;
            this.updatePreviewNodes();
        }
    }

    onPointerBegin(event) {
        this.movement.click(event);

        if (this.rect) {
            return;
        }

        this.selection.off("change", this.onSelectionChange);

        let changed = false;
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

        this.selection.on("change", this.onSelectionChange);
    }

    onPointerEnd(event) {
        this.movement.click(event);
        this.selecting = false;

        if (this.rect) {
            this.rect.x1 = this.editor.cursor.x;
            this.rect.y1 = this.editor.cursor.y;

            const nodes = this.rect.width > 0 && this.rect.height > 0 ?
                this.rootNode.nodesContainedByRect(...this.rect.values(), this.editor.view.scale) :
                this.rootNode.nodesIntersectingRect(...this.rect.values(), this.editor.view.scale);

            this.selection.off("change", this.onSelectionChange);
            this.selection[this.mode](new Set(nodes));
            this.selection.on("change", this.onSelectionChange);
            this.rect = null;
            this.editor.redraw();
        }
    }

    onPointerMove(event) {
        if (this.selecting && !this.rect && this.movement.moved(event)) {
            this.rect = new Rect(this.rectPosition.x, this.rectPosition.y, 0, 0);

            if (this.revertNodes) {
                this.selection.replace(this.revertNodes);
                this.affectedNode = null;
                this.revertNodes = null;
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

    onMouseEnter() {
        this.updatePreviewNodes();
    }
}