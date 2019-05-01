import { cfg } from "../../settings.js";
import { iter } from "../../support/iter.js";
import { Pointer, MovementThreshold } from "../../support/pointer.js";
import { PivotNode, VertexNode, WaypointNode, SpawnNode, ColliderNode } from "../../map/map.js";
import { EditorCommand } from "../command.js";
import { Tool } from "./tool.js";
import { SnapHandle, SnapSource } from "../snapping.js";

export class MoveTool extends Tool {
    constructor() {
        super();
        this.nodes = null;
        this.command = null;
        this.handleStart = null;
        this.handleOffset = null;
        this.dragging = false;
        this.snapSources = null;
        this.handle = null;
        this.selectTool = null;
        this.movement = new MovementThreshold();
        this.pointer = new Pointer();
        this.pointer.on("begin", e => this.onPointerBegin(e.mouseEvent));
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
        this.pointer.on("end", e => this.onPointerEnd(e.mouseEvent));
        this.onSelectStatusChange = this.onSelectStatusChange.bind(this);
        this.onSelectionChange = this.onSelectionChange.bind(this);
        this.onEditorChange = this.onEditorChange.bind(this);
    }

    get status() {
        if (this.activated) {
            if (this.selectTool.activated) {
                return this.selectTool.status;
            } else {
                return this.statusText;
            }
        }
        return "";
    }

    onActivate() {
        this.nodes = this.filterSelection();
        this.command = null;
        this.handleStart = null;
        this.handleOffset = null;
        this.dragging = false;
        this.snapSources = [new SnapSource(this.editor.map)];
        this.handle = this.createHandle();
        this.selectTool = this.editor.tools.select;
        this.movement.reset(cfg("editor.drag-threshold"));
        this.pointer.activate(this.editor.element, 0);
        this.selectTool.activate(this.editor);
        this.selectTool.on("statuschange", this.onSelectStatusChange);
        this.editor.selection.on("change", this.onSelectionChange);
        this.editor.on("change", this.onEditorChange);
        this.emit("statuschange");
    }

    onDeactivate() {
        this.selectTool.off("statuschange", this.onSelectStatusChange);
        this.editor.selection.off("change", this.onSelectionChange);
        this.editor.off("change", this.onEditorChange);
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
        this.handle = this.createHandle(this.handle.visible ? this.handle : null);
        setTimeout(() => this.onPointerMove());
    }

    onEditorChange() {
        setTimeout(() => this.onPointerMove());
    }

    createHandle(position = null) {
        const handle = new SnapHandle(this.editor);
        handle.snapSources = this.snapSources;
        handle.visible = false;
        if (this.nodes.size > 0) {
            const refNode = iter(this.nodes).first();
            if (position) {
                handle.reset(position.x, position.y, refNode);
            } else {
                handle.reset(refNode.x, refNode.y, refNode);
            }
            handle.visible = true;
        }
        return handle;
    }

    filterSelection() {
        throw new Error("Must implement");
    }

    onPointerBegin(event) {
        this.movement.click(event);
        if (!this.selectTool.activated) {
            this.handleStart = {
                x: this.handle.x,
                y: this.handle.y,
            };
            this.handleOffset = {
                x: this.handle.x - this.editor.cursor.x,
                y: this.handle.y - this.editor.cursor.y,
            };
        }
    }

    onPointerEnd(event) {
        this.movement.click(event);
        this.handleStart = null;
        this.handleOffset = null;
        this.dragging = false;
        this.command = null;
        this.handle.snapResult = null;
        setTimeout(() => this.onPointerMove(event));
    }

    onPointerMove(event) {
        if (this.pointer.dragging && !this.selectTool.activated) {
            this.dragging = this.dragging || this.movement.moved(event);
            if (this.dragging) {
                if (this.handle.active) {
                    this.moveHandle();
                } else {
                    this.moveNodes();
                }
            }
        } else {
            const selWasActive = this.selectTool.activated;
            const handleWasActive = this.handle.active;
            const cursorNodes = this.cursorNodes();

            if (this.handle.visible) {
                const types = [PivotNode, VertexNode, WaypointNode, SpawnNode, ColliderNode];
                this.handle.active = this.handle.intersectsPoint(this.editor.cursor.position) &&
                    !cursorNodes.some(n => types.includes(n.constructor));
            }

            if (this.selectTool.activated) {
                if (!this.selectTool.selecting && this.selectTool.mode === "replace" && (cursorNodes.length > 0 || this.handle.active)) {
                    this.selectTool.deactivate();
                }
            } else {
                if (cursorNodes.length === 0 && !this.handle.active) {
                    this.selectTool.activate(this.editor);
                }
            }

            if (this.selectTool.activated !== selWasActive || this.handle.active !== handleWasActive) {
                this.emit("statuschange");
            }
        }

        this.editor.redraw();
    }

    moveHandle() {
        const cursor = this.editor.cursor;
        const offset = this.handleOffset;
        this.handle.moveTo(cursor.x + offset.x, cursor.y + offset.y);
    }

    moveNodes() {
        this.editor.off("change", this.onEditorChange);

        if (this.command && !this.editor.undo(this.command)) {
            this.pointer.cancel();
        } else {
            this.command = new EditorCommand(this.editor);

            const offset = {
                x: this.editor.cursor.x - (this.handleStart.x - this.handleOffset.x),
                y: this.editor.cursor.y - (this.handleStart.y - this.handleOffset.y),
            };

            const p = { x: this.handle.x, y: this.handle.y };
            this.handle.moveTo(this.handleStart.x + offset.x, this.handleStart.y + offset.y);
            offset.x = this.handle.x - this.handleStart.x;
            offset.y = this.handle.y - this.handleStart.y;

            if (this.handle.referenceNode) {
                this.handle.reset(p.x, p.y, this.handle.referenceNode);
            }

            if (offset.x !== 0 || offset.y !== 0) {
                for (const node of this.nodes) {
                    this.moveNode(node, offset);
                }
            }

            this.command = this.editor.do(this.command);
        }

        this.editor.on("change", this.onEditorChange);
    }

    moveNode(node, offset) {
        throw new Error("Must implement");
    }

    cursorNodes() {
        const sel = this.editor.selection.nodes;
        const scale = this.editor.view.scale;
        const { x, y } = this.editor.cursor.position;
        return [...iter(this.editor.map.nodesAt(x, y, scale)).filter(node => sel.has(node))];
    }
}
