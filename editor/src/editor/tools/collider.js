import { cfg } from "../../app/settings.js";
import { ColliderNode, Attribute } from "../../map/map.js";
import { CreateTool } from "./create.js";
import { Tool } from "./tool.js";

export class ColliderTool extends CreateTool {
    constructor() {
        super();
        this.attributes.set("radius", new Attribute("float", cfg("map.collider-radius")));
    }

    get text() {
        return "Colliders";
    }

    get statusText() {
        return "Create colliders";
    }

    createNode() {
        return new ColliderNode();
    }

    updateNode() {
        this.node.attr("x", this.handle.x);
        this.node.attr("y", this.handle.y);
        this.node.attr("radius", this.attr("radius"));
    }
}

Tool.register(ColliderTool);
