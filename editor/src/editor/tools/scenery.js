import { iter } from "../../support/iter.js";
import { Pointer } from "../../support/pointer.js";
import { Color } from "../../support/color.js";
import { SceneryNode, Attribute, PivotNode } from "../../map/map.js";
import { SnapHandle, SnapSource } from "../snapping.js";
import { Tool } from "./tool.js";
import { EditorCommand } from "../command.js";

export class SceneryTool extends Tool {
    constructor() {
        super();
        this.attributes.set("color", new Attribute("color", new Color("#fff")));
        this.attributes.set("image", new Attribute("node", null));
        this.targetLayer = null;
        this.scenery = null;
        this.handle = null;
        this.pointer = new Pointer();
        this.pointer.on("begin", e => this.onPointerBegin(e.mouseEvent));
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
        this.onAttrChange = this.onAttrChange.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onEditorStatusChange = this.onEditorStatusChange.bind(this);
        this.onNodeRemove = this.onNodeRemove.bind(this);
    }

    get status() {
        if (!this.targetLayer) {
            return "Select a layer";
        } else {
            return "Create scenery";
        }
    }

    onActivate() {
        if (!this._onActivateOnce) {
            this._onActivateOnce = true;
            if (!iter(this.editor.map.resources.descendants("image")).includes(this.attr("image"))) {
                this.attr("image", iter(this.editor.map.resources.descendants("image")).first() || null);
            }
        }

        this.scenery = this.createScenery();
        this.handle = new SnapHandle(this.editor);
        this.handle.snapSources = [new SnapSource(this.editor.map)];
        this.handle.moveTo(this.editor.cursor.x, this.editor.cursor.y);
        this.updateScenery();
        this.updateTargetLayer();
        this.updateHandle();
        this.pointer.activate(this.editor.element, 0);
        this.on("attributechange", this.onAttrChange);
        this.editor.on("statuschange", this.onEditorStatusChange);
        this.editor.map.on("remove", this.onNodeRemove);
        this.editor.element.addEventListener("mousedown", this.onMouseDown);
        this.emit("statuschange");
    }

    onDeactivate() {
        this.pointer.deactivate();
        this.off("attributechange", this.onAttrChange);
        this.editor.off("statuschange", this.onEditorStatusChange);
        this.editor.map.off("remove", this.onNodeRemove);
        this.editor.element.removeEventListener("mousedown", this.onMouseDown);
    }

    onNodeRemove(event) {
        if (event.node === this.attr("image")) {
            this.attr("image", iter(this.editor.map.resources.descendants("image")).first() || null);
        }
    }

    onEditorStatusChange(event) {
        if ("layer" in event.status) {
            this.updateTargetLayer();
        }

        if ("cursor" in event.status) {
            this.updateHandle();
            this.editor.redraw();
        }
    }

    onAttrChange() {
        this.updateScenery();
        this.editor.redraw();
    }

    onPointerBegin() {
        if (this.targetLayer && this.handle.visible) {
            this.editor.selection.clear();
            const command = new EditorCommand(this.editor);
            command.insert(this.targetLayer, null, this.scenery);
            const image = this.scenery.attr("image");
            if (image && !iter(this.editor.map.resources.descendants("image")).includes(image)) {
                command.insert(this.editor.map.resources, null, image);
            }
            this.editor.do(command);
            this.scenery = this.createScenery();
            this.updateTargetLayer();
        }
    }

    onPointerMove() {
        this.handle.moveTo(this.editor.cursor.x, this.editor.cursor.y);
        this.updateScenery();
        this.editor.redraw();
    }

    onMouseDown(event) {
        if (event.button === 2) {
            this.editor.currentTool = this.editor.tools.previous;
        }
    }

    createScenery() {
        const scenery = new SceneryNode();
        scenery.append(new PivotNode());
        return scenery;
    }

    updateScenery() {
        const image = this.attr("image");
        if (image) {
            this.scenery.attr("image", image);
            this.scenery.attr("x", this.handle.x);
            this.scenery.attr("y", this.handle.y);
            this.scenery.attr("width", image.attr("width") || this.editor.renderer.textureInfo(image).width);
            this.scenery.attr("height", image.attr("height") || this.editor.renderer.textureInfo(image).height);
            this.scenery.attr("color", this.attr("color"));
        }
    }

    updateHandle() {
        this.handle.visible = this.editor.cursor.active && !!this.targetLayer && !!this.attr("image");
        this.editor.redraw();
    }

    updateTargetLayer() {
        const current = this.targetLayer;
        this.targetLayer = null;
        if (this.editor.activeLayer && this.editor.activeLayer.isNodeAllowed(this.scenery)) {
            this.targetLayer = this.editor.activeLayer;
        }
        if (this.targetLayer !== current) {
            this.updateHandle();
            this.emit("statuschange");
        }
    }
}
