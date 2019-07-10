import * as PMS from "../../pms/pms.js";
import { SpawnNode, Attribute } from "../../map/map.js";
import { CreateTool } from "./create.js";
import { Tool } from "./tool.js";

export class SpawnTool extends CreateTool {
    constructor() {
        super();
        this.attributes.set("type", new Attribute(PMS.SpawnTeam, PMS.SpawnTeam.General));
    }

    get text() {
        return "Spawns";
    }

    get statusText() {
        return "Create spawns";
    }

    createNode() {
        return new SpawnNode();
    }

    updateNode() {
        this.node.attr("x", this.handle.x);
        this.node.attr("y", this.handle.y);
        this.node.attr("type", this.attr("type"));
    }
}

Tool.register(SpawnTool);
