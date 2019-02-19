import { rectContainsPoint } from "../support/geometry.js";
import { Node } from "./node.js";
import { Attribute } from "./attribute.js";
import { cfg } from "../settings.js";

export class PivotNode extends Node {
    constructor() {
        super();
        this.attributes.set("offsetX", new Attribute("float", 0));
        this.attributes.set("offsetY", new Attribute("float", 0));
    }

    get nodeName() {
        return "pivot";
    }

    get x() {
        return this.parentNode.attr("x");
    }

    get y() {
        return this.parentNode.attr("y");
    }

    intersectsPoint(x, y, scale) {
        const d = 0.5 * cfg("editor.vertex-size") / scale;
        return Math.abs(x - this.x) <= d && Math.abs(y - this.y) <= d;
    }

    intersectsRect(x, y, w, h) {
        return rectContainsPoint(x, y, w, h, this.x, this.y);
    }

    containedByRect(x, y, w, h) {
        return rectContainsPoint(x, y, w, h, this.x, this.y);
    }
}