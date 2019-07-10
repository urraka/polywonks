import * as PMS from "../../pms/pms.js";
import { WaypointNode, Attribute } from "../../map/map.js";
import { CreateTool } from "./create.js";
import { Tool } from "./tool.js";

export class WaypointTool extends CreateTool {
    constructor() {
        super();
        this.attributes.set("left", new Attribute("boolean", false));
        this.attributes.set("right", new Attribute("boolean", false));
        this.attributes.set("up", new Attribute("boolean", false));
        this.attributes.set("down", new Attribute("boolean", false));
        this.attributes.set("jet", new Attribute("boolean", false));
        this.attributes.set("path", new Attribute(PMS.PathType, PMS.PathType.Path1));
        this.attributes.set("action", new Attribute(PMS.ActionType, PMS.ActionType.None));
    }

    get text() {
        return "Waypoints";
    }

    get statusText() {
        return "Create waypoints";
    }

    createNode() {
        return new WaypointNode();
    }

    updateNode() {
        this.node.attr("x", this.handle.x);
        this.node.attr("y", this.handle.y);
        this.node.attr("left", this.attr("left"));
        this.node.attr("right", this.attr("right"));
        this.node.attr("up", this.attr("up"));
        this.node.attr("down", this.attr("down"));
        this.node.attr("jet", this.attr("jet"));
        this.node.attr("path", this.attr("path"));
        this.node.attr("action", this.attr("action"));
    }
}

Tool.register(WaypointTool);
