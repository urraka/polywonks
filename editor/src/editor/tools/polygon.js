import { iter } from "../../support/iter.js";
import { Pointer } from "../../support/pointer.js";
import { VertexNode, TriangleNode, Attribute } from "../../map/map.js";
import { EditorCommand } from "../command.js";
import { SnapHandle, SnapSource } from "../snapping.js";
import { Tool } from "./tool.js";
import { Color } from "../../support/color.js";

export class PolygonTool extends Tool {
    constructor() {
        super();
        this.attributes.set("color", new Attribute("color", new Color("#fff")));
        this.attributes.set("texture", new Attribute("node", null));
        this.targetLayer = null;
        this.triangle = null;
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
            return "Create polygons";
        }
    }

    onActivate() {
        if (!this._onActivateOnce) {
            this._onActivateOnce = true;
            if (!iter(this.editor.map.resources.descendants("texture")).includes(this.attr("texture"))) {
                this.attr("texture", iter(this.editor.map.resources.descendants("texture")).first() || null);
            }
        }

        this.targetLayer = null;
        this.triangle = null;
        this.handle = new SnapHandle(this.editor);
        this.handle.snapSources = [new SnapSource(this.editor.map)];
        this.handle.moveTo(this.editor.cursor.x, this.editor.cursor.y);
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

    onNodeRemove(event) {
        if (event.node === this.attr("texture")) {
            this.attr("texture", iter(this.editor.map.resources.descendants("texture")).first() || null);
        }
    }

    onEditorStatusChange(event) {
        if (!this.triangle && ("layer" in event.status)) {
            this.updateTargetLayer();
        }

        if ("cursor" in event.status) {
            this.updateHandle();
            this.editor.redraw();
        }
    }

    updateHandle() {
        this.handle.visible = this.editor.cursor.active && !!this.targetLayer;
        this.editor.redraw();
    }

    updateTargetLayer() {
        const current = this.targetLayer;
        this.targetLayer = null;
        if (this.editor.activeLayer && this.editor.activeLayer.isNodeAllowed(new TriangleNode())) {
            this.targetLayer = this.editor.activeLayer;
        }
        if (this.targetLayer !== current) {
            this.updateHandle();
            this.emit("statuschange");
        }
    }

    onPointerBegin() {
        if (this.targetLayer) {
            if (!this.triangle) {
                this.editor.selection.clear();
                this.triangle = new TriangleNode();
                this.triangle.attr("texture", this.attr("texture"));
                this.triangle.attr("poly-type", this.targetLayer.polyTypes().defaultName());
                this.addVertex();
                this.addVertex();
                this.handle.snapSources.push(new SnapSource(this.triangle, n => !n.parentNode || n !== n.parentNode.lastChild));
            } else if (this.triangle) {
                if (iter(this.triangle.children()).count() < 3) {
                    this.addVertex();
                } else {
                    this.editor.selection.clear();
                    const command = new EditorCommand(this.editor);
                    command.insert(this.targetLayer, null, this.triangle);
                    const texture = this.triangle.attr("texture");
                    if (texture && !iter(this.editor.map.resources.descendants("texture")).includes(texture)) {
                        command.insert(this.editor.map.resources, null, texture);
                    }
                    this.editor.do(command);
                    this.triangle = null;
                    this.handle.snapSources.pop();
                    this.updateTargetLayer();
                }
            }
            this.editor.redraw();
        }
    }

    addVertex() {
        const vertex = new VertexNode();
        this.updateVertex(vertex);
        this.triangle.append(vertex);
    }

    updateVertex(vertex) {
        vertex.attr("color", this.attr("color"));
        vertex.attr("x", this.handle.x);
        vertex.attr("y", this.handle.y);
        this.updateTextureCoords(vertex);
    }

    updateTextureCoords(vertex) {
        const texture = this.triangle.attr("texture");
        let u = 0, v = 0;
        if (texture) {
            const w = texture.attr("width") || this.editor.renderer.textureInfo(texture).width;
            const h = texture.attr("height") || this.editor.renderer.textureInfo(texture).height;
            if (w) u = vertex.x / w;
            if (h) v = vertex.y / h;
        }
        vertex.attr("u", u);
        vertex.attr("v", v);
    }

    onAttrChange(event) {
        if (this.triangle) {
            switch (event.attribute) {
                case "color":
                    this.updateVertex(this.triangle.lastChild);
                    break;
                case "texture": {
                    this.triangle.attr("texture", this.attr("texture"));
                    for (const vertex of this.triangle.children()) {
                        this.updateTextureCoords(vertex);
                    }
                    break;
                }
            }
            this.editor.redraw();
        }
    }

    onPointerMove() {
        this.handle.moveTo(this.editor.cursor.x, this.editor.cursor.y);
        if (this.triangle) {
            this.updateVertex(this.triangle.lastChild);
        }
        this.editor.redraw();
    }

    onMouseDown(event) {
        if (event.button === 2) {
            this.editor.currentTool = this.editor.tools.previous;
        }
    }

    onKeyDown(event) {
        if (event.key === "Escape" && this.triangle) {
            this.reset();
            event.stopPropagation();
        }
    }
}
