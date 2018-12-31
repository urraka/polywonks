import { Rect } from "./rect.js";
import { cfg } from "./settings.js";
import { Event } from "./event.js";
import { Tool } from "./tool.js";

export class SelectCommand {
    constructor(select, unselect) {
        this.select = select;
        this.unselect = unselect;
    }

    do(editor) {
        this.unselect.forEach(node => editor.selectedNodes.delete(node));
        this.select.forEach(node => editor.selectedNodes.add(node));
        editor.redraw();
    }

    undo(editor) {
        this.select.forEach(node => editor.selectedNodes.delete(node));
        this.unselect.forEach(node => editor.selectedNodes.add(node));
        editor.redraw();
    }
}

export class SelectTool extends Tool {
    constructor() {
        super();
        this.affectedNode = null;
        this.selecting = false;
        this.mode = "replace";
        this.rect = null;
        this.rectPosition = { x: 0, y: 0 };
        this.clickPosition = { x: 0, y: 0 };
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onKey = this.onKey.bind(this);
    }

    onActivate(editor) {
        this.affectedNode = null;
        this.command = null;
        this.selecting = false;
        this.mode = "replace";
        this.rect = null;
        this.rectPosition = { x: 0, y: 0 };
        this.clickPosition = { x: 0, y: 0 };
        this.editor.element.addEventListener("mouseup", this.onMouseUp);
        this.editor.element.addEventListener("mousedown", this.onMouseDown);
        this.editor.element.addEventListener("mousemove", this.onMouseMove);
        document.addEventListener("keyup", this.onKey);
        document.addEventListener("keydown", this.onKey);
        this.emit(new Event("change", { status: "Select" }));
    }

    onDeactivate() {
        this.editor.element.removeEventListener("mouseup", this.onMouseUp);
        this.editor.element.removeEventListener("mousedown", this.onMouseDown);
        this.editor.element.removeEventListener("mousemove", this.onMouseMove);
        document.removeEventListener("keyup", this.onKey);
        document.removeEventListener("keydown", this.onKey);
        this.editor.previewNodes.clear();
        this.editor.redraw();
        this.emit(new Event("change", { status: "" }));
    }

    replaceSelection(selection) {
        const select = new Set([...selection].filter(node => !this.editor.selectedNodes.has(node)));
        const unselect = new Set([...this.editor.selectedNodes].filter(node => !selection.has(node)));
        if (select.size > 0 || unselect.size > 0) {
            return this.editor.do(new SelectCommand(select, unselect));
        }
    }

    addSelection(selection) {
        const select = new Set([...selection].filter(node => !this.editor.selectedNodes.has(node)));
        if (select.size > 0) {
            return this.editor.do(new SelectCommand(select, new Set()));
        }
    }

    subtractSelection(selection) {
        const unselect = new Set([...this.editor.selectedNodes].filter(node => selection.has(node)));
        if (unselect.size > 0) {
            return this.editor.do(new SelectCommand(new Set(), unselect));
        }
    }

    updatePreviewNodes() {
        this.editor.previewNodes.clear();
        this.editor.reactiveNode = null;

        if (this.rect) {
            const nodes = this.rect.width > 0 && this.rect.height > 0 ?
                this.editor.map.nodesContainedByRect(...this.rect.values(), this.editor.view.scale) :
                this.editor.map.nodesIntersectingRect(...this.rect.values(), this.editor.view.scale);

            if (this.mode === "subtract") {
                this.editor.previewNodes = new Set([...nodes].filter(node => this.editor.selectedNodes.has(node)));
            } else {
                this.editor.previewNodes = new Set(nodes);
            }
        } else {
            const { x, y } = this.editor.cursor;
            let nodes = [...this.editor.map.nodesAt(x, y, this.editor.view.scale)];

            if (this.mode === "subtract") {
                nodes = nodes.filter(node => this.editor.selectedNodes.has(node)).slice(-1);
                this.editor.previewNodes = new Set(nodes);
                this.editor.reactiveNode = nodes.pop();
            } else {
                const index = nodes.indexOf(this.affectedNode) - 1;
                this.editor.previewNodes = new Set(nodes);
                this.editor.reactiveNode = index >= 0 ? nodes[index] : nodes[nodes.length - 1];
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
                this.emit(new Event("change", { status: "Select" }));
                break;
            case "add":
                this.emit(new Event("change", { status: "Select (+)" }));
                break;
            case "subtract":
                this.emit(new Event("change", { status: "Select (-)" }));
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
        }
    }

    onMouseDown(event) {
        this.clickPosition.x = event.clientX;
        this.clickPosition.y = event.clientY;

        if (this.rect) {
            return;
        }

        if (event.button === 0) {
            let selectionChanged = false;
            this.updateMode(event);

            if (this.mode === "replace") {
                selectionChanged = !!this.replaceSelection(new Set());
            }

            this.updatePreviewNodes();
            this.affectedNode = this.editor.reactiveNode;
            this.command = this[this.mode + "Selection"](new Set(this.affectedNode ? [this.affectedNode] : []));
            selectionChanged = selectionChanged || !!this.command;

            if (!this.affectedNode) {
                this.command = null;
            }

            if (selectionChanged) {
                this.updatePreviewNodes();
            }

            this.selecting = true;
            this.rectPosition.x = this.editor.cursor.x;
            this.rectPosition.y = this.editor.cursor.y;
        }
    }

    onMouseUp(event) {
        this.clickPosition.x = event.clientX;
        this.clickPosition.y = event.clientY;

        if (event.button === 0) {
            this.selecting = false;
            this.command = null;

            if (this.rect) {
                this.rect.x1 = this.editor.cursor.x;
                this.rect.y1 = this.editor.cursor.y;

                const nodes = this.rect.width > 0 && this.rect.height > 0 ?
                    this.editor.map.nodesContainedByRect(...this.rect.values(), this.editor.view.scale) :
                    this.editor.map.nodesIntersectingRect(...this.rect.values(), this.editor.view.scale);

                this[this.mode + "Selection"](new Set(nodes));
                this.rect = null;
                this.editor.redraw();
            }
        }
    }

    onMouseMove(event) {
        if (this.selecting && !this.rect) {
            const threshold = cfg("editor.selection-rect-threshold");
            if (Math.abs(event.clientX - this.clickPosition.x) > threshold ||
                Math.abs(event.clientY - this.clickPosition.y) > threshold) {
                this.rect = new Rect(this.rectPosition.x, this.rectPosition.y, 0, 0);

                if (this.command) {
                    this.editor.undoAndForget(this.command);
                    this.affectedNode = null;
                    this.command = null;
                }
            }
        }

        if (this.rect) {
            this.rect.x1 = this.editor.cursor.x;
            this.rect.y1 = this.editor.cursor.y;
        }

        this.updatePreviewNodes();
    }
}
