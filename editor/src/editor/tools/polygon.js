import { iter } from "../../common/iter.js";
import { Color } from "../../common/color.js";
import { VertexNode, TriangleNode, Attribute } from "../../map/map.js";
import { Renderer } from "../../app/render.js";
import { SnapSource } from "../snapping.js";
import { CreateTool } from "./create.js";
import { Tool } from "./tool.js";

export class PolygonTool extends CreateTool {
    constructor() {
        super();
        this.attributes.set("color", new Attribute("color", new Color("#fff")));
        this.attributes.set("texture", new Attribute("node", null));
    }

    get text() {
        return "Polygons";
    }

    get statusText() {
        return "Create polygons";
    }

    onEdit() {
        if (!this.editing) {
            this.beginEditing();
            this.addVertex();
            this.addVertex();
            this.handle.snapSources.push(new SnapSource(this.node, n => !n.parentNode || n !== n.parentNode.lastChild));
        } else if (iter(this.node.children()).count() < 3) {
            this.addVertex();
        } else {
            this.handle.snapSources.pop();
            this.endEditing();
        }
        this.emit("change");
    }

    updateNode() {
        if (this.targetLayer) {
            this.node.attr("poly-type", this.targetLayer.polyTypes().defaultName());
        }

        if (this.node.lastChild) {
            this.updateVertex(this.node.lastChild);
        }

        const texture = this.node.attr("texture");
        if (texture !== this.attr("texture")) {
            this.node.attr("texture", this.attr("texture"));
            for (const vertex of this.node.children()) {
                this.updateTextureCoords(vertex);
            }
        }
    }

    createNode() {
        return new TriangleNode();
    }

    addVertex() {
        const vertex = new VertexNode();
        this.updateVertex(vertex);
        this.node.append(vertex);
    }

    updateVertex(vertex) {
        vertex.attr("color", this.attr("color"));
        vertex.attr("x", this.handle.x);
        vertex.attr("y", this.handle.y);
        this.updateTextureCoords(vertex);
    }

    updateTextureCoords(vertex) {
        const texture = this.node.attr("texture");
        let u = 0, v = 0;
        if (texture) {
            const w = texture.attr("width") || Renderer.textureInfo(texture).width;
            const h = texture.attr("height") || Renderer.textureInfo(texture).height;
            if (w) u = vertex.x / w;
            if (h) v = vertex.y / h;
        }
        vertex.attr("u", u);
        vertex.attr("v", v);
    }

    chooseDefaultLayer() {
        const layers = iter(this.editor.map.children("layer"));
        return layers.find(layer => layer.attr("type") === "polygons-front") || super.chooseDefaultLayer();
    }
}

Tool.register(PolygonTool);
