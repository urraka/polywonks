import { Pointer, MovementThreshold } from "./support/pointer.js";
import { Tool } from "./tool.js";
import { EditorCommand } from "./editor.command.js";
import { cfg } from "./settings.js";
import { TriangleNode, ConnectionNode, WaypointNode, PivotNode } from "./map/map.js";
import { Matrix } from "./support/matrix.js";

export class MoveTool extends Tool {
    constructor() {
        super();
        this.command = null;
        this.startPoint = null;
        this.nodes = null;
        this.selectTool = null;
        this.movement = new MovementThreshold();
        this.pointer = new Pointer();
        this.pointer.on("begin", e => this.onPointerBegin(e.mouseEvent));
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
        this.pointer.on("end", e => this.onPointerEnd(e.mouseEvent));
        this.onSelectStatusChange = this.onSelectStatusChange.bind(this);
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
        this.nodes = null;
        this.selectTool = this.editor.tools.select;
        this.movement.reset(cfg("editor.drag-threshold"));
        this.pointer.activate(this.editor.element, 0);
        this.selectTool.activate(this.editor);
        this.selectTool.on("statuschange", this.onSelectStatusChange);
        this.emit("statuschange");
    }

    onDeactivate() {
        this.selectTool.off("statuschange", this.onSelectStatusChange);
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
        this.onPointerMove();
    }

    onPointerBegin(event) {
        this.movement.click(event);

        if (!this.selectTool.activated) {
            this.startPoint = {...this.editor.cursor};
            this.nodes = new Set();

            for (const node of this.editor.selection.nodes) {
                if (node.attributes.has("x") && node.attributes.has("y")) {
                    this.nodes.add(node);
                } else if (node instanceof TriangleNode) {
                    for (const vertex of node.children("vertex")) {
                        this.nodes.add(vertex);
                    }
                } else if (node instanceof ConnectionNode) {
                    this.nodes.add(node.parentNode);
                    this.nodes.add(node.attr("waypoint"));
                } else if ((node instanceof PivotNode) && this.editor.selection.nodes.size === 1) {
                    this.nodes.add(node);
                }
            }
        }
    }

    onPointerEnd(event) {
        this.movement.click(event);
        this.startPoint = null;
        this.command = null;
        this.nodes = null;
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
            }

            this.command = new EditorCommand(this.editor);

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
