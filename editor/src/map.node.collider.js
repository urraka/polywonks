import * as PMS from "./pms.js";
import * as Geometry from "./geometry.js";
import { Node } from "./map.node.js";
import { cfg } from "./settings.js";
import { Rect } from "./rect.js";

export class ColliderNode extends Node {
    constructor() {
        super("collider");
        this.attributes.set("text", "Collider");
        this.attributes.set("x", 0);
        this.attributes.set("y", 0);
        this.attributes.set("radius", cfg("map.collider-radius"));
    }

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
        return Geometry.rectIntersectsCircle(x, y, w, h, this.attr("x"), this.attr("y"), this.attr("radius"));
    }

    containedByRect(x, y, w, h) {
        const d = 2 * this.attr("radius");
        const rect = new Rect(0, 0, d, d);
        rect.centerX = this.attr("x");
        rect.centerY = this.attr("y");
        return Geometry.rectContainsRect(x, y, w, h, ...rect.values());
    }
}
