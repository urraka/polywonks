import * as PMS from "../pms/pms.js";
import * as Geometry from "../support/geometry.js";
import { Rect } from "../support/rect.js";
import { Node } from "./node.js";
import { Attribute } from "./attribute.js";

export class SpawnNode extends Node {
    constructor() {
        super("spawn");
        this.attributes.get("text").value = "Spawn";
        this.attributes.set("x", new Attribute("float", 0));
        this.attributes.set("y", new Attribute("float", 0));
        this.attributes.set("type", new Attribute(PMS.SpawnTeam, PMS.SpawnTeam.General));
    }

    static fromPMS(spawn) {
        const node = new SpawnNode();
        node.attr("x", spawn.x);
        node.attr("y", spawn.y);
        node.attr("type", PMS.SpawnTeam.name(spawn.team));
        return node;
    }

    toPMS() {
        const spawn = new PMS.Spawn();
        spawn.active = true;
        spawn.x = this.attr("x");
        spawn.y = this.attr("y");
        spawn.team = PMS.SpawnTeam.value(this.attr("type"));
        return spawn;
    }

    intersectsPoint(x, y, scale) {
        const info = this.owner.iconsInfo["spawn-" + this.attr("type")];

        if (info) {
            if (info.radius) {
                const d = Math.pow(info.radius / scale, 2);
                const dx = x - this.attr("x");
                const dy = y - this.attr("y");
                return (dx * dx) + (dy * dy) <= d;
            } else {
                const dx = 0.5 * info.width / scale;
                const dy = 0.5 * info.height / scale;
                return Math.abs(x - this.attr("x")) <= dx && Math.abs(y - this.attr("y")) <= dy;
            }
        }

        return false;
    }

    intersectsRect(x, y, w, h, scale) {
        const info = this.owner.iconsInfo["spawn-" + this.attr("type")];

        if (info) {
            if (info.radius) {
                return Geometry.rectIntersectsCircle(x, y, w, h, this.attr("x"), this.attr("y"), info.radius / scale);
            } else {
                const rect = new Rect(0, 0, info.width / scale, info.height / scale);
                rect.centerX = this.attr("x");
                rect.centerY = this.attr("y");
                return Geometry.rectIntersectsRect(x, y, w, h, ...rect.values());
            }
        }

        return false;
    }

    containedByRect(x, y, w, h, scale) {
        const info = this.owner.iconsInfo["spawn-" + this.attr("type")];

        if (info) {
            const rect = new Rect(0, 0, info.width / scale, info.height / scale);
            rect.centerX = this.attr("x");
            rect.centerY = this.attr("y");
            return Geometry.rectContainsRect(x, y, w, h, ...rect.values());
        }

        return false;
    }
}
