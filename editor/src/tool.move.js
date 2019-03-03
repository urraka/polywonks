import { Pointer, MovementThreshold } from "./support/pointer.js";
import { Tool } from "./tool.js";
import { EditorCommand } from "./editor.command.js";
import { cfg } from "./settings.js";
import { TriangleNode, ConnectionNode, PivotNode } from "./map/map.js";
import { Matrix } from "./support/matrix.js";
import { iter } from "./support/iter.js";

export class MoveTool extends Tool {
    constructor() {
        super();
        this.command = null;
        this.startPoint = null;
        this.prevPoint = null;
        this.handlePoint = null;
        this.nodes = null;
        this.selectTool = null;
        this.movement = new MovementThreshold();
        this.pointer = new Pointer();
        this.pointer.on("begin", e => this.onPointerBegin(e.mouseEvent));
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
        this.pointer.on("end", e => this.onPointerEnd(e.mouseEvent));
        this.onSelectStatusChange = this.onSelectStatusChange.bind(this);
        this.onSelectionChange = this.onSelectionChange.bind(this);
    }

    get status() {
        if (this.activated) {
            if (this.selectTool.activated) {
                return this.selectTool.status;
            } else {
                return "Move";
            }
        }
        return "";
    }

    onActivate() {
        this.command = null;
        this.startPoint = null;
        this.prevPoint = null;
        this.handlePoint = null;
        this.nodes = this.filterSelection();
        this.handlePoint = this.findHandlePoint();
        this.selectTool = this.editor.tools.select;
        this.movement.reset(cfg("editor.drag-threshold"));
        this.pointer.activate(this.editor.element, 0);
        this.selectTool.activate(this.editor);
        this.selectTool.on("statuschange", this.onSelectStatusChange);
        this.editor.selection.on("change", this.onSelectionChange);
        this.emit("statuschange");
    }

    onDeactivate() {
        this.selectTool.off("statuschange", this.onSelectStatusChange);
        this.editor.selection.off("change", this.onSelectionChange);
        this.selectTool.deactivate();
        this.pointer.deactivate();
        this.emit("statuschange");
    }

    onCommand(command) {
        if (this.activated) {
            if (!this.selectTool.activated && (command === "+select.add" || command === "+select.subtract")) {
                this.selectTool.activate(this.editor);
            }

            this.selectTool.onCommand(command);

            if (this.selectTool.activated && this.selectTool.mode === "replace") {
                this.onPointerMove();
            }
        }
    }

    onSelectStatusChange() {
        this.emit("statuschange");
    }

    onSelectionChange() {
        this.nodes = this.filterSelection();
        this.handlePoint = this.findHandlePoint();
        setTimeout(() => this.onPointerMove());
    }

    findHandlePoint() {
        if (this.nodes.size === 0) {
            return null;
        } else if (!this.handlePoint) {
            const node = iter(this.nodes).first();
            if (node instanceof PivotNode) {
                return { x: node.x, y: node.y };
            } else {
                return { x: node.attr("x"), y: node.attr("y") };
            }
        }
        return this.handlePoint;
    }

    filterSelection() {
        const nodes = new Set();
        for (const node of this.editor.selection.nodes) {
            if (node.attributes.has("x") && node.attributes.has("y")) {
                nodes.add(node);
            } else if (node instanceof TriangleNode) {
                for (const vertex of node.children("vertex")) {
                    nodes.add(vertex);
                }
            } else if (node instanceof ConnectionNode) {
                nodes.add(node.parentNode);
                nodes.add(node.attr("waypoint"));
            } else if ((node instanceof PivotNode) && this.editor.selection.nodes.size === 1) {
                nodes.add(node);
            }
        }
        return nodes;
    }

    onPointerBegin(event) {
        this.movement.click(event);
        if (!this.selectTool.activated) {
            this.startPoint = {...this.editor.cursor};
            this.prevPoint = this.startPoint;
        }
    }

    onPointerEnd(event) {
        this.movement.click(event);
        this.startPoint = null;
        this.prevPoint = null;
        this.command = null;
        setTimeout(() => this.onPointerMove(event));
    }

    onPointerMove(event) {
        if (this.selectTool.activated) {
            if (!this.selectTool.selecting && this.selectTool.mode === "replace" && this.selectionIntersectsCursor()) {
                this.selectTool.deactivate();
                this.emit("statuschange");
            }
        } else if (!this.startPoint) {
            if (!this.selectionIntersectsCursor()) {
                this.selectTool.activate(this.editor);
            }
        } else if (this.command || this.movement.moved(event)) {
            if (this.command && !this.editor.undo(this.command)) {
                this.startPoint = {...this.editor.cursor};
                this.prevPoint = this.startPoint;
            }

            this.command = new EditorCommand(this.editor);

            this.handlePoint.x += this.editor.cursor.x - this.prevPoint.x;
            this.handlePoint.y += this.editor.cursor.y - this.prevPoint.y;
            this.prevPoint = {...this.editor.cursor};

            const offset = {
                x: this.editor.cursor.x - this.startPoint.x,
                y: this.editor.cursor.y - this.startPoint.y
            };

            for (const node of this.nodes) {
                if (node instanceof PivotNode) {
                    const scenery = node.parentNode;
                    const sx = scenery.attr("width") >= 0 ? 1 : -1;
                    const sy = scenery.attr("height") >= 0 ? 1 : -1;
                    const pivotOffset = Matrix.scale(sx, sy)
                        .multiply(Matrix.rotate(-scenery.attr("rotation")))
                        .multiply(offset);
                    this.command.attr(node, "offsetX", node.attr("offsetX") + pivotOffset.x);
                    this.command.attr(node, "offsetY", node.attr("offsetY") + pivotOffset.y);
                    this.command.attr(scenery, "x", scenery.attr("x") + offset.x);
                    this.command.attr(scenery, "y", scenery.attr("y") + offset.y);
                } else {
                    this.command.attr(node, "x", node.attr("x") + offset.x);
                    this.command.attr(node, "y", node.attr("y") + offset.y);
                }
            }

            this.editor.do(this.command);
        }
    }

    selectionIntersectsCursor() {
        const cursor = this.editor.cursor;
        const scale = this.editor.view.scale;
        for (const node of this.editor.selection.nodes) {
            if (node.intersectsPoint(cursor.x, cursor.y, scale)) {
                return true;
            }
        }
        return false;
    }
}
