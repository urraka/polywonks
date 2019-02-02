import { Node } from "./node.js";

export class ResourcesNode extends Node {
    constructor() {
        super();
    }

    get nodeName() {
        return "resources";
    }
}
