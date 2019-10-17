import { iter } from "../../common/iter.js";
import { Command } from "../../app/command.js";
import { PivotNode, VertexNode, WaypointNode, SpawnNode, ColliderNode } from "../../map/map.js";
import { EditCommand } from "../edit.js";
import { SnapHandle, SnapSource } from "../snapping.js";
import { Tool } from "./tool.js";

export class MoveTool extends Tool {
    constructor() {
        super();
        this.nodes = null;
        this.command = null;
        this.handleStart = null;
        this.handleOffset = null;
        this.snapSources = null;
        this.handle = null;
        this.button = null;
        this.onButtonDown = this.onButtonDown.bind(this);
        this.onButtonUp = this.onButtonUp.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onSelectStatusChange = this.onSelectStatusChange.bind(this);
        this.onSelectionChange = this.onSelectionChange.bind(this);
        this.onMapChange = this.onMapChange.bind(this);

        Command.provide(this);
    }

    get status() {
        if (this.activated) {
            return this.selectTool.status || this.statusText;
        }
        return "";
    }

    get cursorImage() {
        if (this.activated && !this.selectTool.activated) {
            return "move";
        }
        return super.cursorImage;
    }

    get selectTool() {
        return this.editor.toolset.select;
    }

    onActivate() {
        this.nodes = this.filterSelection();
        this.command = null;
        this.handleStart = null;
        this.handleOffset = null;
        this.snapSources = [new SnapSource(this.editor.map)];
        this.handle = this.createHandle();
        this.button = null;
        this.editor.cursor.on("move", this.onPointerMove);
        this.editor.cursor.leftButton.on("buttondown", this.onButtonDown);
        this.editor.cursor.leftButton.on("buttonup", this.onButtonUp);
        this.editor.cursor.rightButton.on("buttondown", this.onButtonDown);
        this.editor.cursor.rightButton.on("buttonup", this.onButtonUp);
        this.selectTool.activate(this.editor);
        this.selectTool.on("statuschange", this.onSelectStatusChange);
        this.editor.selection.on("change", this.onSelectionChange);
        this.editor.map.on("change", this.onMapChange);

        if (this.editor.cursor.visible) {
            this.onPointerMove();
        }
    }

    onDeactivate() {
        this.selectTool.off("statuschange", this.onSelectStatusChange);
        this.editor.selection.off("change", this.onSelectionChange);
        this.editor.map.off("change", this.onMapChange);
        this.selectTool.deactivate();
        this.editor.cursor.off("move", this.onPointerMove);
        this.editor.cursor.leftButton.off("buttondown", this.onButtonDown);
        this.editor.cursor.leftButton.off("buttonup", this.onButtonUp);
        this.editor.cursor.rightButton.off("buttondown", this.onButtonDown);
        this.editor.cursor.rightButton.off("buttonup", this.onButtonUp);
    }

    onSelectStatusChange() {
        this.emit("statuschange");
    }

    onSelectionChange() {
        this.nodes = this.filterSelection();
        this.handle = this.createHandle(this.handle.visible ? this.handle : null);
        setTimeout(() => this.onPointerMove());
    }

    onMapChange() {
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

    onButtonDown(event) {
        if (!this.button) {
            this.button = event.target;
            if (this.button === this.editor.cursor.rightButton) {
                this.selectTool.deactivate();
            }
        }
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

    onButtonUp(event) {
        if (event.target === this.button) {
            this.handleStart = null;
            this.handleOffset = null;
            this.command = null;
            this.handle.snapResult = null;
            this.button = null;
            setTimeout(() => this.onPointerMove());
        }
    }

    onPointerMove() {
        if (!this.activated) {
            return;
        }

        if (this.button && this.button.pressed && !this.selectTool.activated) {
            if (this.button.dragging) {
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

        this.emit("change");
    }

    moveHandle() {
        const cursor = this.editor.cursor;
        const offset = this.handleOffset;
        this.handle.moveTo(cursor.x + offset.x, cursor.y + offset.y);
    }

    moveNodes() {
        this.editor.map.off("change", this.onMapChange);

        if (this.command && !this.editor.history.undo(this.command)) {
            this.button.release();
        } else {
            this.command = new EditCommand(this.editor);

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

            this.command = this.editor.history.do(this.command);
        }

        this.editor.map.on("change", this.onMapChange);
    }

    moveNode(_node, _offset) {
        throw new Error("Must implement");
    }

    cursorNodes() {
        const sel = this.editor.selection.nodes;
        const scale = this.editor.view.scale;
        const { x, y } = this.editor.cursor.position;
        return [...iter(this.editor.map.nodesAt(x, y, scale)).filter(node => sel.has(node))];
    }
}
