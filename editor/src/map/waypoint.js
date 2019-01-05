import * as PMS from "../pms/pms.js";
import * as Geometry from "../support/geometry.js";
import { Enum } from "../support/enum.js";
import { Rect } from "../support/rect.js";
import { cfg } from "../settings.js";
import { Node } from "./node.js";
import { ConnectionNode } from "./connection.js";

export class WaypointNode extends Node {
    constructor() {
        super("waypoint");
        this.attributes.set("text", "Waypoint");
        this.attributes.set("x", 0);
        this.attributes.set("y", 0);
        this.attributes.set("left", false);
        this.attributes.set("right", false);
        this.attributes.set("up", false);
        this.attributes.set("down", false);
        this.attributes.set("jet", false);
        this.attributes.set("path", "path-1");
        this.attributes.set("action", "none");
    }

    fromPMS(waypoint, waypointNodes) {
        this.attr("x", waypoint.x);
        this.attr("y", waypoint.y);
        this.attr("left", waypoint.left);
        this.attr("right", waypoint.right);
        this.attr("up", waypoint.up);
        this.attr("down", waypoint.down);
        this.attr("jet", waypoint.jet);
        this.attr("path", Enum.valueToName(PMS.PathType, waypoint.path));
        this.attr("action", Enum.valueToName(PMS.ActionType, waypoint.action));

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
        waypoint.path = Enum.nameToValue(PMS.PathType, this.attr("path"));
        waypoint.action = Enum.nameToValue(PMS.ActionType, this.attr("action"));
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
        return Geometry.rectIntersectsRect(x, y, w, h, ...rect.values());
    }

    containedByRect(x, y, w, h, scale) {
        const d = cfg("editor.waypoint-size") / scale;
        const rect = new Rect(0, 0, d, d);
        rect.centerX = this.attr("x");
        rect.centerY = this.attr("y");
        return Geometry.rectContainsRect(x, y, w, h, ...rect.values());
    }
}
