import { Node } from "./map.node.js";
import { Color } from "./color.js";
import { Rect } from "./rect.js";
import { rectContainsPoint } from "./geometry.js";
import { cfg } from "./settings.js";
import * as PMS from "./pms.js";

export class VertexNode extends Node {
    constructor() {
        super("vertex");
        this.attributes.set("text", "Vertex");
        this.attributes.set("x", 0);
        this.attributes.set("y", 0);
        this.attributes.set("u", 0);
        this.attributes.set("v", 0);
        this.attributes.set("color", new Color(255, 255, 255, 255));
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
