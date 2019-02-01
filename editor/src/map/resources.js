import { Node } from "./node.js";

export class ResourcesNode extends Node {
    constructor() {
        super();
        this.attributes.get("text").value = "Resources";
    }

    get nodeName() {
        return "resources";
    }
}
