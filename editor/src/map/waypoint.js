import * as PMS from "../pms/pms.js";
import * as xMath from "../common/math.js";
import { Rect } from "../common/rect.js";
import { cfg } from "../app/settings.js";
import { Node } from "./node.js";
import { ConnectionNode } from "./connection.js";
import { Attribute } from "./attribute.js";

export class WaypointNode extends Node {
    constructor() {
        super();
        this.attributes.set("x", new Attribute("float", 0));
        this.attributes.set("y", new Attribute("float", 0));
        this.attributes.set("left", new Attribute("boolean", false));
        this.attributes.set("right", new Attribute("boolean", false));
        this.attributes.set("up", new Attribute("boolean", false));
        this.attributes.set("down", new Attribute("boolean", false));
        this.attributes.set("jet", new Attribute("boolean", false));
        this.attributes.set("path", new Attribute(PMS.PathType, PMS.PathType.Path1));
        this.attributes.set("action", new Attribute(PMS.ActionType, PMS.ActionType.None));
    }

    get nodeName() { return "waypoint"; }
    get hasPosition() { return true; }
    get isTransformable() { return true; }
    get x() { return this.attr("x"); }
    get y() { return this.attr("y"); }

    *nodesTransformable() {
        yield this;
    }

    fromPMS(waypoint, waypointNodes) {
        this.attr("x", waypoint.x);
        this.attr("y", waypoint.y);
        this.attr("left", waypoint.left);
        this.attr("right", waypoint.right);
        this.attr("up", waypoint.up);
        this.attr("down", waypoint.down);
        this.attr("jet", waypoint.jet);
        this.attr("path", waypoint.path);
        this.attr("action", waypoint.action);

        for (const connection of waypoint.connections) {
            const waypointNode = waypointNodes[connection - 1];
            if (waypointNode && waypointNode !== this) {
                this.append(new ConnectionNode(waypointNode));
            }
        }
    }

    toPMS(waypointNodes) {
        const waypoint = new PMS.Waypoint();
        waypoint.active = true;
        waypoint.id = waypointNodes.indexOf(this) + 1;
        waypoint.x = this.attr("x");
        waypoint.y = this.attr("y");
        waypoint.left = this.attr("left");
        waypoint.right = this.attr("right");
        waypoint.up = this.attr("up");
        waypoint.down = this.attr("down");
        waypoint.jet = this.attr("jet");
        waypoint.path = PMS.PathType.value(this.attr("path"));
        waypoint.action = PMS.ActionType.value(this.attr("action"));
        waypoint.connections = [...this.children()].map(node => waypointNodes.indexOf(node.attr("waypoint")) + 1);
        return waypoint;
    }

    intersectsPoint(x, y, scale) {
        const d = 0.5 * cfg("editor.waypoint-size") / scale;
        return Math.abs(x - this.attr("x")) <= d && Math.abs(y - this.attr("y")) <= d;
    }

    intersectsRect(x, y, w, h, scale) {
        const d = cfg("editor.waypoint-size") / scale;
        const rect = new Rect(0, 0, d, d);
        rect.centerX = this.attr("x");
        rect.centerY = this.attr("y");
        return xMath.rectIntersectsRect(x, y, w, h, ...rect.values());
    }

    containedByRect(x, y, w, h, scale) {
        const d = cfg("editor.waypoint-size") / scale;
        const rect = new Rect(0, 0, d, d);
        rect.centerX = this.attr("x");
        rect.centerY = this.attr("y");
        return xMath.rectContainsRect(x, y, w, h, ...rect.values());
    }
}
