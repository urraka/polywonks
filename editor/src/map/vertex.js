import * as PMS from "../pms/pms.js";
import { Color } from "../support/color.js";
import { rectContainsPoint } from "../support/geometry.js";
import { cfg } from "../settings.js";
import { Node } from "./node.js";
import { Attribute } from "./attribute.js";

export class VertexNode extends Node {
    constructor() {
        super();
        this.attributes.set("x", new Attribute("float", 0));
        this.attributes.set("y", new Attribute("float", 0));
        this.attributes.set("u", new Attribute("float", 0));
        this.attributes.set("v", new Attribute("float", 0));
        this.attributes.set("color", new Attribute("color", new Color(255, 255, 255, 255)));
    }

    get nodeName() {
        return "vertex";
    }

    static fromPMS(vertex) {
        const node = new VertexNode();
        node.attr("x", vertex.x);
        node.attr("y", vertex.y);
        node.attr("u", vertex.u);
        node.attr("v", vertex.v);
        node.attr("color", new Color(vertex.color));
        return node;
    }

    toPMS() {
        const vertex = new PMS.Vertex();
        vertex.x = this.attr("x");
        vertex.y = this.attr("y");
        vertex.z = 1;
        vertex.rhw = 1;
        vertex.u = this.attr("u");
        vertex.v = this.attr("v");
        vertex.color.set(this.attr("color"));
        return vertex;
    }

    intersectsPoint(x, y, scale) {
        const d = 0.5 * cfg("editor.vertex-size") / scale;
        return Math.abs(x - this.attr("x")) <= d && Math.abs(y - this.attr("y")) <= d;
    }

    intersectsRect(x, y, w, h) {
        return rectContainsPoint(x, y, w, h, this.attr("x"), this.attr("y"));
    }

    containedByRect(x, y, w, h) {
        return rectContainsPoint(x, y, w, h, this.attr("x"), this.attr("y"));
    }
}
