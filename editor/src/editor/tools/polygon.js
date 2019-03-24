import { Tool } from "./tool.js";
import { Pointer } from "./support/pointer.js";
import { VertexNode, TriangleNode } from "./map/map.js";
import { EditorCommand } from "./editor.command.js";
import { iter } from "./support/iter.js";
import { SnapHandle, SnapSource } from "./snapping.js";

export class PolygonTool extends Tool {
    constructor() {
        super();
        this.triangle = null;
        this.handle = null;
        this.pointer = new Pointer();
        this.pointer.on("begin", e => this.onPointerBegin(e.mouseEvent));
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
        this.pointer.on("end", e => this.onPointerEnd(e.mouseEvent));
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
    }

    onActivate() {
        this.triangle = null;
        this.handle = new SnapHandle(this.editor);
        this.handle.visible = this.editor.cursor.active;
        this.handle.snapSources = [new SnapSource(this.editor.map)];
        this.handle.moveTo(this.editor.cursor.x, this.editor.cursor.y);
        this.pointer.activate(this.editor.element, 0);
        this.editor.element.addEventListener("mouseenter", this.onMouseEnter);
        this.editor.element.addEventListener("mouseleave", this.onMouseLeave);
        this.editor.element.addEventListener("mousedown", this.onMouseDown);
    }

    onDeactivate() {
        this.pointer.deactivate();
        this.editor.element.removeEventListener("mouseenter", this.onMouseEnter);
        this.editor.element.removeEventListener("mouseleave", this.onMouseLeave);
        this.editor.element.removeEventListener("mousedown", this.onMouseDown);
    }

    onPointerBegin() {
        if (this.editor.activeLayer) {
            if (!this.triangle) {
                this.editor.selection.clear();
                this.triangle = new TriangleNode();
                this.triangle.attr("texture", iter(this.editor.map.resources.children("texture")).first());
                this.addVertex();
                this.addVertex();
                this.handle.snapSources.push(new SnapSource(this.triangle, n => !n.parentNode || n !== n.parentNode.lastChild));
            } else if (this.triangle) {
                if (iter(this.triangle.children()).count() < 3) {
                    this.addVertex();
                } else {
                    this.editor.selection.clear();
                    const command = new EditorCommand(this.editor);
                    command.insert(this.editor.activeLayer, null, this.triangle);
                    this.editor.do(command);
                    this.triangle = null;
                    this.handle.snapSources.pop();
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

    onPointerEnd() {
    }

    onPointerMove() {
        this.handle.moveTo(this.editor.cursor.x, this.editor.cursor.y);
        if (this.triangle) {
            this.updateVertex(this.triangle.lastChild);
        }
        this.editor.redraw();
    }

    onMouseLeave() {
        this.handle.visible = false;
        this.editor.redraw();
    }

    onMouseEnter() {
        this.handle.visible = true;
        this.editor.redraw();
    }

    onMouseDown(event) {
        if (event.button === 2) {
            this.editor.currentTool = this.editor.tools.previous;
        }
    }
}
