import * as PMS from "./pms.js";
import * as Geometry from "./geometry.js";
import { Node } from "./map.node.js";
import { Enum } from "./enum.js";
import { Rect } from "./rect.js";

export class SpawnNode extends Node {
    constructor() {
        super("spawn");
        this.attributes.set("text", "Spawn");
        this.attributes.set("x", 0);
        this.attributes.set("y", 0);
        this.attributes.set("type", "general");
    }

    static fromPMS(spawn) {
        const node = new SpawnNode();
        node.attr("x", spawn.x);
        node.attr("y", spawn.y);
        node.attr("type", Enum.valueToName(PMS.SpawnTeam, spawn.team));
        return node;
    }

    toPMS() {
        const spawn = new PMS.Spawn();
        spawn.active = true;
        spawn.x = this.attr("x");
        spawn.y = this.attr("y");
        spawn.team = Enum.nameToValue(PMS.SpawnTeam, this.attr("type"));
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
