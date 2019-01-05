import { Enum } from "../support/enum.js";
import { Node } from "./node.js";

export const LayerType = Object.freeze({
    Resources: -1,
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
    constructor(name = "Layer", type = LayerType.PolygonsBack) {
        super("layer");
        this.attributes.set("text", name);
        this.attributes.set("type", Enum.valueToName(LayerType, type));
    }
}
