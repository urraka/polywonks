import { Node } from "./map.node.js";

export class LayerNode extends Node {
    constructor(layerName = "Layer") {
        super("layer");
        this.attributes.set("text", layerName);
    }
}
