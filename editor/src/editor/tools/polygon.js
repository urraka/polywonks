import { iter } from "../../support/iter.js";
import { Color } from "../../support/color.js";
import { VertexNode, TriangleNode, Attribute } from "../../map/map.js";
import { EditorCommand } from "../command.js";
import { SnapSource } from "../snapping.js";
import { CreateTool } from "./create.js";

export class PolygonTool extends CreateTool {
    constructor() {
        super();
        this.attributes.set("color", new Attribute("color", new Color("#fff")));
        this.attributes.set("texture", new Attribute("node", null));
    }

    get status() {
        if (!this.targetLayer) {
            return "Select a layer";
        } else {
            return "Create polygons";
        }
    }

    onPointerBegin() {
        if (this.targetLayer) {
            if (!this.editing) {
                this.beginEditing();
                this.editor.selection.clear();
                this.node.attr("texture", this.attr("texture"));
                this.node.attr("poly-type", this.targetLayer.polyTypes().defaultName());
                this.addVertex();
                this.addVertex();
                this.handle.snapSources.push(new SnapSource(this.node, n => !n.parentNode || n !== n.parentNode.lastChild));
            } else if (iter(this.node.children()).count() < 3) {
                this.addVertex();
            } else {
                this.editor.selection.clear();
                const command = new EditorCommand(this.editor);
                command.insert(this.targetLayer, null, this.node);
                const texture = this.node.attr("texture");
                if (texture && !iter(this.editor.map.resources.descendants("texture")).includes(texture)) {
                    command.insert(this.editor.map.resources, null, texture);
                }
                this.editor.do(command);
                this.handle.snapSources.pop();
                this.endEditing();
            }
            this.editor.redraw();
        }
    }

    onPointerMove() {
        this.handle.moveTo(this.editor.cursor.x, this.editor.cursor.y);
        if (this.editing) {
            this.updateVertex(this.node.lastChild);
        }
        this.editor.redraw();
    }

    onAttrChange(event) {
        if (this.editing) {
            switch (event.attribute) {
                case "color":
                    this.updateVertex(this.node.lastChild);
                    break;
                case "texture": {
                    this.node.attr("texture", this.attr("texture"));
                    for (const vertex of this.node.children()) {
                        this.updateTextureCoords(vertex);
                    }
                    break;
                }
            }
            this.editor.redraw();
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
            const w = texture.attr("width") || this.editor.renderer.textureInfo(texture).width;
            const h = texture.attr("height") || this.editor.renderer.textureInfo(texture).height;
            if (w) u = vertex.x / w;
            if (h) v = vertex.y / h;
        }
        vertex.attr("u", u);
        vertex.attr("v", v);
    }
}
