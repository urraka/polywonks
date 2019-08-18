import * as xMath from "../../common/math.js";
import { iter } from "../../common/iter.js";
import { Rect } from "../../common/rect.js";
import { Command } from "../../app/command.js";
import { cfg } from "../../app/settings.js";
import { Tool } from "./tool.js";

export class SelectTool extends Tool {
    constructor() {
        super();

        this.selection = null;
        this.cycle = 0;
        this.affectedNode = null;
        this.revertNodes = null;
        this._mode = "replace";
        this.rect = null;
        this.rectPosition = { x: 0, y: 0 };
        this.button = null;
        this.onCursorChange = this.onCursorChange.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onButtonDown = this.onButtonDown.bind(this);
        this.onButtonUp = this.onButtonUp.bind(this);
        this.onSelectionChange = this.onSelectionChange.bind(this);

        Command.provide(this);
    }

    get text() {
        return "Select";
    }

    get statusText() {
        switch (this.mode) {
            case "replace": return "Select";
            case "add": return "Select (+)";
            case "subtract": return "Select (-)";
        }
    }

    get selecting() {
        return this.button && this.button.pressed;
    }

    get dragging() {
        return this.button && this.button.dragging;
    }

    onActivate() {
        this.selection = this.editor.selection;
        this.cycle = 0;
        this.affectedNode = null;
        this.revertNodes = null;
        this._mode = "replace";
        this.rect = null;
        this.rectPosition = { x: 0, y: 0 };
        this.button = null;
        this.editor.cursor.on("visibilitychange", this.onCursorChange);
        this.editor.cursor.on("move", this.onPointerMove);
        this.editor.cursor.leftButton.on("buttondown", this.onButtonDown);
        this.editor.cursor.leftButton.on("buttonup", this.onButtonUp);
        this.selection.on("change", this.onSelectionChange);
        this.updatePreviewNodes();
    }

    onDeactivate() {
        this.selection.off("change", this.onSelectionChange);
        this.editor.cursor.off("visibilitychange", this.onCursorChange);
        this.editor.cursor.off("move", this.onPointerMove);
        this.editor.cursor.leftButton.off("buttondown", this.onButtonDown);
        this.editor.cursor.leftButton.off("buttonup", this.onButtonUp);
        this.editor.preview.clear();
        this.editor.reactive.clear();
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
        if (!cfg("editor.restrict-selection") || this.mode === "subtract") {
            return this.editor.map;
        } else {
            return this.editor.activeLayer || this.editor.map;
        }
    }

    cycleNodes() {
        this.cycle++;
        this.updatePreviewNodes();
    }

    updatePreviewNodes() {
        if (!this.activated) {
            return;
        }

        this.editor.preview.clear();
        this.editor.reactive.clear();

        if (!this.editor.cursor.visible) {
            return;
        }

        if (this.rect) {
            const nodes = this.rect.width > 0 && this.rect.height > 0 ?
                this.rootNode.nodesContainedByRect(...this.rect.values(), this.editor.view.scale) :
                this.rootNode.nodesIntersectingRect(...this.rect.values(), this.editor.view.scale);

            if (this.mode === "subtract") {
                this.editor.preview.replace(new Set([...nodes].filter(node => this.selection.has(node))));
            } else {
                this.editor.preview.replace(new Set(nodes));
            }
        } else {
            const { x, y } = this.editor.cursor.position;
            let nodes = [...this.rootNode.nodesAt(x, y, this.editor.view.scale)];

            if (this.mode === "subtract") {
                nodes = nodes.filter(node => this.selection.has(node));

                if (nodes.length > 0) {
                    this.cycle = this.cycle % nodes.length;
                    nodes = [nodes[xMath.mod(-1 - this.cycle, nodes.length)]];
                }

                this.editor.preview.replace(new Set(nodes));
                this.editor.reactive.replace(new Set(nodes.slice(-1)));
            } else {
                if (this.mode === "add") {
                    nodes = nodes.filter(node => !this.selection.has(node));
                }

                if (nodes.length > 0) {
                    let index = nodes.indexOf(this.affectedNode);

                    if (index >= 0) {
                        nodes.splice(index--, 1);
                    } else {
                        index = 0;
                    }

                    if (nodes.length > 0) {
                        this.cycle = this.cycle % nodes.length;
                        this.editor.reactive.replace(new Set([nodes[xMath.mod(index - this.cycle, nodes.length)]]));
                        this.editor.preview.replace(new Set(nodes));
                    }
                }
            }
        }
    }

    onSelectionChange() {
        if (this.affectedNode && !this.selection.has(this.affectedNode)) {
            this.affectedNode = null;
            this.updatePreviewNodes();
        }
    }

    onButtonDown(event) {
        if (this.rect) {
            return;
        }

        this.button = event.target;
        this.selection.off("change", this.onSelectionChange);

        let changed = false;
        this.updatePreviewNodes();

        if (this.mode === "replace") {
            changed = this.selection.clear();
        }

        this.affectedNode = iter(this.editor.reactive.nodes).first();
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

        this.rectPosition.x = this.editor.cursor.x;
        this.rectPosition.y = this.editor.cursor.y;

        this.selection.on("change", this.onSelectionChange);
    }

    onButtonUp() {
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
            this.emit("change");
        }
    }

    onPointerMove() {
        if (this.dragging && !this.rect) {
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
            this.emit("change");
        }
        this.updatePreviewNodes();
    }

    onCursorChange() {
        this.updatePreviewNodes();
    }
}

Tool.register(SelectTool);
