import { Pointer, MovementThreshold } from "./support/pointer.js";
import { Tool } from "./tool.js";
import { EditorCommand } from "./editor.command.js";
import { cfg } from "./settings.js";
import { TriangleNode, ConnectionNode, PivotNode, VertexNode } from "./map/map.js";
import { Matrix } from "./support/matrix.js";
import { iter } from "./support/iter.js";

export class MoveTool extends Tool {
    constructor() {
        super();
        this.nodes = null;
        this.command = null;
        this.startPoint = null;
        this.dragging = false;
        this.handleNode = null;
        this.handleOffset = { x: 0, y: 0 };
        this.handleActive = false;
        this.selectTool = null;
        this.movement = new MovementThreshold();
        this.pointer = new Pointer();
        this.pointer.on("begin", e => this.onPointerBegin(e.mouseEvent));
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
        this.pointer.on("end", e => this.onPointerEnd(e.mouseEvent));
        this.onSelectStatusChange = this.onSelectStatusChange.bind(this);
        this.onSelectionChange = this.onSelectionChange.bind(this);
    }

    get handlePosition() {
        return this.handleNode && {
            x: this.handleNode.x + this.handleOffset.x,
            y: this.handleNode.y + this.handleOffset.y
        };
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
        this.nodes = this.filterSelection();
        this.command = null;
        this.startPoint = null;
        this.dragging = false;
        this.handleNode = this.findHandleNode();
        this.handleOffset = { x: 0, y: 0 };
        this.handleActive = false;
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
        this.handleNode = this.findHandleNode();
        this.handleOffset = { x: 0, y: 0 };
        setTimeout(() => this.onPointerMove());
    }

    findHandleNode() {
        if (this.nodes.size === 0) {
            return null;
        } else if (!this.handleNode) {
            return iter(this.nodes).first();
        }
        return this.handleNode;
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
        }
    }

    onPointerEnd(event) {
        this.movement.click(event);
        this.startPoint = null;
        this.dragging = false;
        this.command = null;
        setTimeout(() => this.onPointerMove(event));
    }

    onPointerMove(event) {
        if (this.startPoint) {
            if (!this.dragging && this.movement.moved(event)) {
                this.dragging = true;
            }

            if (this.dragging) {
                if (this.handleActive) {
                    this.handleOffset.x += this.editor.cursor.x - this.startPoint.x;
                    this.handleOffset.y += this.editor.cursor.y - this.startPoint.y;
                    this.startPoint = {...this.editor.cursor};
                    this.editor.redraw();
                } else {
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
        } else {
            const selWasActive = this.selectTool.activated;
            const handleWasActive = this.handleActive;
            const cursorNodes = this.cursorNodes();

            if (this.handleNode) {
                const types = [PivotNode, VertexNode];
                this.handleActive = this.cursorIntersectsHandle() && !cursorNodes.some(n => types.includes(n.constructor));
            }

            if (this.selectTool.activated) {
                if (!this.selectTool.selecting && this.selectTool.mode === "replace" && (cursorNodes.length > 0 || this.handleActive)) {
                    this.selectTool.deactivate();
                }
            } else {
                if (cursorNodes.length === 0 && !this.handleActive) {
                    this.selectTool.activate(this.editor);
                }
            }

            if (this.selectTool.activated !== selWasActive || this.handleActive !== handleWasActive) {
                this.emit("statuschange");
                this.editor.redraw();
            }
        }
    }

    cursorIntersectsHandle() {
        const pos = this.handlePosition;
        const cur = this.editor.cursor;
        const d = 0.5 * cfg("editor.vertex-size") / this.editor.view.scale;
        return Math.abs(cur.x - pos.x) <= d || Math.abs(cur.y - pos.y) <= d;
    }

    cursorNodes() {
        const sel = this.editor.selection.nodes;
        const scale = this.editor.view.scale;
        const { x, y } = this.editor.cursor;
        return [...iter(this.editor.map.nodesAt(x, y, scale)).filter(node => sel.has(node))];
    }
}
