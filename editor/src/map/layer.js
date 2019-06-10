import * as PMS from "../pms/pms.js";
import { Enum } from "../common/enum.js";
import { Attribute } from "./attribute.js";
import { Node } from "./node.js";
import { TriangleNode } from "./triangle.js";
import { SceneryNode } from "./scenery.js";
import { WaypointNode } from "./waypoint.js";
import { ColliderNode } from "./collider.js";
import { SpawnNode } from "./spawn.js";

export const LayerType = new Enum({
    PolygonsBack: 0,
    SceneryBack: 1,
    SceneryMiddle: 2,
    PolygonsFront: 3,
    SceneryFront: 4,
    Colliders: 5,
    Waypoints: 6,
    Spawns: 7
});

export class LayerNode extends Node {
    constructor(name = "", type = LayerType.PolygonsBack) {
        super();
        this.attributes.get("text").value = name;
        this.attributes.set("type", new Attribute(LayerType, type));
        this._visible = true;
    }

    get nodeName() {
        return "layer";
    }

    get visible() {
        return this._visible;
    }

    set visible(value) {
        if (this._visible !== value) {
            this._visible = value;
            this.emit("visibilitychange");
        }
    }

    isNodeAllowed(node) {
        switch (this.attr("type")) {
            case "polygons-back":
            case "polygons-front":
                return node instanceof TriangleNode;

            case "scenery-back":
            case "scenery-middle":
            case "scenery-front":
                return node instanceof SceneryNode;

            case "colliders":
                return node instanceof ColliderNode;

            case "waypoints":
                return node instanceof WaypointNode;

            case "spawns":
                return node instanceof SpawnNode;

            default:
                throw new Error("LayerNode.isNodeAllowed(): missing layer type");
        }
    }

    polyTypes() {
        return LayerNode.polyTypes[this.attr("type")];
    }

    static get polyTypes() {
        return LayerNode._polyTypes || (LayerNode._polyTypes = (() => {
            const polyTypes = {};
            const none = PMS.PolyType.filter(() => false);

            for (const name of LayerType.names()) {
                polyTypes[name] = none;
            }

            polyTypes["polygons-back"] = PMS.PolyType.filter(v => {
                return v === PMS.PolyType.Background || v === PMS.PolyType.BackgroundTransition;
            });

            polyTypes["polygons-front"] = PMS.PolyType.filter(v => {
                return v !== PMS.PolyType.Background && v !== PMS.PolyType.BackgroundTransition;
            });

            return polyTypes;
        })());
    }

    *nodesAt(...args) {
        if (this.visible) {
            yield* super.nodesAt(...args);
        }
    }

    *nodesIntersectingRect(...args) {
        if (this.visible) {
            yield* super.nodesIntersectingRect(...args);
        }
    }

    *nodesContainedByRect(...args) {
        if (this.visible) {
            yield* super.nodesContainedByRect(...args);
        }
    }
}
