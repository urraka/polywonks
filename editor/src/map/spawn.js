import * as PMS from "../pms/pms.js";
import * as xMath from "../common/math.js";
import { Rect } from "../common/rect.js";
import { Renderer } from "../app/render.js";
import { Node } from "./node.js";
import { Attribute } from "./attribute.js";

export class SpawnNode extends Node {
    constructor() {
        super();
        this.attributes.set("x", new Attribute("float", 0));
        this.attributes.set("y", new Attribute("float", 0));
        this.attributes.set("type", new Attribute(PMS.SpawnTeam, PMS.SpawnTeam.General));
    }

    get nodeName() { return "spawn"; }
    get hasPosition() { return true; }
    get isTransformable() { return true; }
    get x() { return this.attr("x"); }
    get y() { return this.attr("y"); }

    static fromPMS(spawn) {
        const node = new SpawnNode();
        node.attr("x", spawn.x);
        node.attr("y", spawn.y);
        node.attr("type", spawn.team);
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
        const info = Renderer.iconInfo("spawn-" + this.attr("type"));

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
        const info = Renderer.iconInfo("spawn-" + this.attr("type"));

        if (info) {
            if (info.radius) {
                return xMath.rectIntersectsCircle(x, y, w, h, this.attr("x"), this.attr("y"), info.radius / scale);
            } else {
                const rect = new Rect(0, 0, info.width / scale, info.height / scale);
                rect.centerX = this.attr("x");
                rect.centerY = this.attr("y");
                return xMath.rectIntersectsRect(x, y, w, h, ...rect.values());
            }
        }

        return false;
    }

    containedByRect(x, y, w, h, scale) {
        const info = Renderer.iconInfo("spawn-" + this.attr("type"));

        if (info) {
            const rect = new Rect(0, 0, info.width / scale, info.height / scale);
            rect.centerX = this.attr("x");
            rect.centerY = this.attr("y");
            return xMath.rectContainsRect(x, y, w, h, ...rect.values());
        }

        return false;
    }
}
