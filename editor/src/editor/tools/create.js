import { iter } from "../../support/iter.js";
import { Pointer } from "../../support/pointer.js";
import { SnapHandle, SnapSource } from "../snapping.js";
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

    onAttrChange() {}
    onPointerBegin() {}
    onPointerMove() {}
    createNode() { throw new Error("Must implement"); }

    onActivate() {
        if (!this._onActivateOnce) {
            this._onActivateOnce = true;
            for (const [key] of this.attributes) {
                if (key === "image" || key === "texture") {
                    const res = this.editor.map.resources;
                    if (!iter(res.descendants(key)).includes(this.attr(key))) {
                        this.attr(key, iter(res.descendants(key)).first() || null);
                    }
                }
            }
        }

        this.editing = false;
        this.targetLayer = null;
        this.handle = new SnapHandle(this.editor);
        this.handle.snapSources = [new SnapSource(this.editor.map)];
        this.handle.moveTo(this.editor.cursor.x, this.editor.cursor.y);
        this.node = this.createNode();
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
                    const res = this.editor.map.resources;
                    this.attr(key, iter(res.descendants(key)).first() || null);
                }
            }
        }
    }

    onMouseDown(event) {
        if (event.button === 2) {
            this.editor.currentTool = this.editor.tools.select;
        }
    }

    onKeyDown(event) {
        if (event.key === "Escape" && this.triangle) {
            this.reset();
            event.stopPropagation();
        }
    }

    beginEditing() {
        this.editing = true;
    }

    endEditing() {
        this.editing = false;
        this.updateTargetLayer();
        this.node = this.createNode();
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
