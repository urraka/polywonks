import { iter } from "../../support/iter.js";
import { Pointer } from "../../support/pointer.js";
import { VertexNode, TriangleNode, LayerNode } from "../../map/map.js";
import { EditorCommand } from "../command.js";
import { SnapHandle, SnapSource } from "../snapping.js";
import { Tool } from "./tool.js";

export class PolygonTool extends Tool {
    constructor() {
        super();
        this.targetLayer = null;
        this.triangle = null;
        this.handle = null;
        this.pointer = new Pointer();
        this.pointer.on("begin", e => this.onPointerBegin(e.mouseEvent));
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onEditorStatusChange = this.onEditorStatusChange.bind(this);
    }

    get status() {
        if (!this.targetLayer) {
            return "Select a layer";
        } else {
            return "Create polygons";
        }
    }

    onActivate() {
        this.targetLayer = null;
        this.triangle = null;
        this.handle = new SnapHandle(this.editor);
        this.handle.snapSources = [new SnapSource(this.editor.map)];
        this.handle.moveTo(this.editor.cursor.x, this.editor.cursor.y);
        this.updateTargetLayer();
        this.updateHandle();
        this.pointer.activate(this.editor.element, 0);
        this.editor.on("statuschange", this.onEditorStatusChange);
        this.editor.element.addEventListener("mousedown", this.onMouseDown);
        document.addEventListener("keydown", this.onKeyDown);
        this.emit("statuschange");
    }

    onDeactivate() {
        this.pointer.deactivate();
        this.editor.off("statuschange", this.onEditorStatusChange);
        this.editor.element.removeEventListener("mousedown", this.onMouseDown);
        document.removeEventListener("keydown", this.onKeyDown);
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
                this.triangle.attr("texture", iter(this.editor.map.resources.children("texture")).first());
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
        const texture = this.triangle.attr("texture");
        vertex.attr("x", this.handle.x);
        vertex.attr("y", this.handle.y);
        if (texture) {
            const w = texture.attr("width") || this.editor.renderer.textureInfo(texture).width;
            const h = texture.attr("height") || this.editor.renderer.textureInfo(texture).height;
            if (w) vertex.attr("u", vertex.x / w);
            if (h) vertex.attr("v", vertex.y / h);
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
