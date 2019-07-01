import * as PMS from "../pms/pms.js";
import * as xMath from "../common/math.js";
import { Rect } from "../common/rect.js";
import { cfg } from "../app/settings.js";
import { Node } from "./node.js";
import { Attribute } from "./attribute.js";

export class ColliderNode extends Node {
    constructor() {
        super();
        this.attributes.set("x", new Attribute("float", 0));
        this.attributes.set("y", new Attribute("float", 0));
        this.attributes.set("radius", new Attribute("float", cfg("map.collider-radius")));
    }

    get nodeName() { return "collider"; }
    get isTransformable() { return true; }
    get hasPosition() { return true; }
    get x() { return this.attr("x"); }
    get y() { return this.attr("y"); }

    static fromPMS(collider) {
        const node = new ColliderNode();
        node.attr("x", collider.x);
        node.attr("y", collider.y);
        node.attr("radius", collider.radius / 2); // pms radius is actually a diameter
        return node;
    }

    toPMS() {
        const collider = new PMS.Collider;
        collider.active = true;
        collider.x = this.attr("x");
        collider.y = this.attr("y");
        collider.radius = this.attr("radius") * 2;
        return collider;
    }

    intersectsPoint(x, y) {
        const d = this.attr("radius");
        const dx = x - this.attr("x");
        const dy = y - this.attr("y");
        return (dx * dx) + (dy * dy) <= (d * d);
    }

    intersectsRect(x, y, w, h) {
        return xMath.rectIntersectsCircle(x, y, w, h, this.attr("x"), this.attr("y"), this.attr("radius"));
    }

    containedByRect(x, y, w, h) {
        const d = 2 * this.attr("radius");
        const rect = new Rect(0, 0, d, d);
        rect.centerX = this.attr("x");
        rect.centerY = this.attr("y");
        return xMath.rectContainsRect(x, y, w, h, ...rect.values());
    }
}
