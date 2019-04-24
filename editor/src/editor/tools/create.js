import { iter } from "../../support/iter.js";
import { Pointer } from "../../support/pointer.js";
import { SnapHandle, SnapSource } from "../snapping.js";
import { EditorCommand } from "../command.js";
import { Tool } from "./tool.js";

export class CreateTool extends Tool {
    constructor() {
        super();
        this.editing = false;
        this.targetLayer = null;
        this.node = null;
        this.handle = null;
        this.pointer = new Pointer();
        this.pointer.on("begin", e => this.onPointerBegin(e.mouseEvent));
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
        this.onAttrChange = this.onAttrChange.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onEditorStatusChange = this.onEditorStatusChange.bind(this);
        this.onNodeRemove = this.onNodeRemove.bind(this);
    }

    get status() {
        if (!this.targetLayer) {
            return "Select a layer";
        } else {
            return this.statusText;
        }
    }

    updateNode() { throw new Error("Must implement"); }
    createNode() { throw new Error("Must implement"); }

    onActivate() {
        if (!this._onActivateOnce) {
            this._onActivateOnce = true;
            for (const [key] of this.attributes) {
                if (key === "image" || key === "texture") {
                    this.setDefaultAttribute(key);
                }
            }
        }

        this.editing = false;
        this.targetLayer = null;
        this.handle = new SnapHandle(this.editor);
        this.handle.snapSources = [new SnapSource(this.editor.map)];
        this.handle.moveTo(this.editor.cursor.x, this.editor.cursor.y);
        this.node = this.createNode();
        this.updateNode();
        this.updateTargetLayer();
        this.updateHandle();

        this.pointer.activate(this.editor.element, 0);
        this.on("attributechange", this.onAttrChange);
        this.editor.on("statuschange", this.onEditorStatusChange);
        this.editor.map.on("remove", this.onNodeRemove);
        this.editor.element.addEventListener("mousedown", this.onMouseDown);
        document.addEventListener("keydown", this.onKeyDown);
        this.emit("statuschange");
    }

    onDeactivate() {
        this.pointer.deactivate();
        this.off("attributechange", this.onAttrChange);
        this.editor.off("statuschange", this.onEditorStatusChange);
        this.editor.map.off("remove", this.onNodeRemove);
        this.editor.element.removeEventListener("mousedown", this.onMouseDown);
        document.removeEventListener("keydown", this.onKeyDown);
    }

    onEditorStatusChange(event) {
        if (!this.editing && ("layer" in event.status)) {
            this.updateTargetLayer();
        }

        if ("cursor" in event.status) {
            this.updateHandle();
            this.editor.redraw();
        }
    }

    onNodeRemove(event) {
        for (const [key] of this.attributes) {
            if (key === "image" || key === "texture") {
                if (event.node === this.attr(key)) {
                    this.setDefaultAttribute(key);
                }
            }
        }
    }

    onAttrChange() {
        this.updateNode();
        this.editor.redraw();
    }

    onPointerBegin() {
        if (this.handle.visible) {
            this.beginEditing();
            this.endEditing();
        }
    }

    onPointerMove() {
        this.handle.moveTo(this.editor.cursor.x, this.editor.cursor.y);
        this.updateNode();
        this.editor.redraw();
    }

    onMouseDown(event) {
        if (event.button === 2) {
            this.editor.currentTool = this.editor.tools.select;
        }
    }

    onKeyDown(event) {
        if (event.key === "Escape") {
            this.reset();
            event.stopPropagation();
        }
    }

    setDefaultAttribute(key) {
        switch (key) {
            case "image":
            case "texture": {
                const res = this.editor.map.resources;
                if (!iter(res.descendants(key)).includes(this.attr(key))) {
                    this.attr(key, iter(res.descendants(key)).first() || null);
                }
                break;
            }
        }
    }

    beginEditing() {
        this.editing = true;
        this.editor.selection.clear();
    }

    endEditing() {
        this.editing = false;
        this.editor.selection.clear();
        const command = new EditorCommand(this.editor);
        this.insertNode(command);
        this.editor.do(command);
        this.updateTargetLayer();
        this.node = this.createNode();
        this.updateNode();
    }

    insertNode(command) {
        command.insert(this.targetLayer, null, this.node);
    }

    updateHandle() {
        this.handle.visible = this.editor.cursor.active && !!this.targetLayer;
        this.editor.redraw();
    }

    updateTargetLayer() {
        const current = this.targetLayer;
        this.targetLayer = null;
        if (this.editor.activeLayer && this.editor.activeLayer.isNodeAllowed(this.node)) {
            this.targetLayer = this.editor.activeLayer;
        }
        if (this.targetLayer !== current) {
            this.updateHandle();
            this.emit("statuschange");
        }
    }
}
