import * as Geometry from "../support/geometry.js";
import { cfg } from "../settings.js";
import { Node } from "./node.js";
import { Attribute } from "./attribute.js";

export class ConnectionNode extends Node {
    constructor(waypoint = null) {
        super();
        this.attributes.get("text").value = "Connection";
        this.attributes.set("waypoint", new Attribute("node", waypoint));
    }

    get nodeName() {
        return "connection";
    }

    intersectsPoint(x, y, scale) {
        const d = 0.5 * cfg("editor.vertex-size") / scale;
        const a = this.parentNode;
        const b = this.attr("waypoint");
        return Geometry.pointToSegmentDistance2(x, y, a.attr("x"), a.attr("y"), b.attr("x"), b.attr("y")) <= (d * d);
    }

    intersectsRect(x, y, w, h) {
        const a = this.parentNode;
        const b = this.attr("waypoint");
        return Geometry.rectIntersectsSegment(x, y, w, h, a.attr("x"), a.attr("y"), b.attr("x"), b.attr("y"));
    }

    containedByRect(x, y, w, h) {
        const a = this.parentNode;
        const b = this.attr("waypoint");
        return Geometry.rectContainsPoint(x, y, w, h, a.attr("x"), a.attr("y")) &&
            Geometry.rectContainsPoint(x, y, w, h, b.attr("x"), b.attr("y"));
    }
}
