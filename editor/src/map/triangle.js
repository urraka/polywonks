import * as PMS from "../pms/pms.js";
import * as xMath from "../common/math.js";
import { iter } from "../common/iter.js";
import { cfg } from "../app/settings.js";
import { Node } from "./node.js";
import { VertexNode } from "./vertex.js";
import { Attribute } from "./attribute.js";

export class TriangleNode extends Node {
    constructor() {
        super();
        this.attributes.set("poly-type", new Attribute(PMS.PolyType, PMS.PolyType.Normal));
        this.attributes.set("bounciness", new Attribute("float", 0));
        this.attributes.set("texture", new Attribute("node", null));
    }

    get nodeName() {
        return "triangle";
    }

    static fromPMS(polygon, textureNode) {
        const node = new TriangleNode();
        node.attr("poly-type", polygon.type);
        node.attr("bounciness", Math.round(100 * Math.max(0, Math.hypot(polygon.normals[2].x, polygon.normals[2].y) - 1)));
        node.attr("texture", textureNode);
        polygon.vertices.forEach(v => node.append(VertexNode.fromPMS(v)));
        return node;
    }

    toPMS() {
        const polygon = new PMS.Polygon();
        polygon.type = PMS.PolyType.value(this.attr("poly-type"));

        polygon.vertices = iter(this.children("vertex")).map(node => {
            return node.toPMS();
        });

        if (polygon.vertices.length !== 3) {
            throw new Error("Triangle must have 3 vertices");
        }

        const edges = [[0, 1, 2], [1, 2, 0], [2, 0, 1]].map(g => g.map(i => polygon.vertices[i]));
        let bounciness = polygon.type === PMS.PolyType.Bouncy ? this.attr("bounciness") : 0;
        bounciness = Math.max(0, bounciness) / 100;

        polygon.normals = edges.map(([a, b, c]) => {
            const ab = { x: b.x - a.x, y: b.y - a.y };
            const ac = { x: c.x - a.x, y: c.y - a.y };
            const n = { x: ab.y, y: -ab.x };
            const dot = n.x * ac.x + n.y * ac.y;
            if (dot < 0) n.x = -n.x, n.y = -n.y;
            const length = (Math.hypot(n.x, n.y) || 1) / (1 + bounciness);
            return new PMS.Vec3(n.x / length, n.y / length, 1);
        });

        return polygon;
    }

    intersectsPoint(x, y, scale) {
        const coords = this.coords();
        if (coords.length === 6) {
            let d = cfg("editor.vertex-size") / scale;
            const A = xMath.signedTriangleArea(...coords);
            if (Math.abs(A * (scale * scale)) < (d * d)) {
                d = 0.25 * d * d;
                return xMath.pointToSegmentDistance2(x, y, coords[0], coords[1], coords[2], coords[3]) <= d ||
                    xMath.pointToSegmentDistance2(x, y, coords[0], coords[1], coords[4], coords[5]) <= d ||
                    xMath.pointToSegmentDistance2(x, y, coords[2], coords[3], coords[4], coords[5]) <= d;
            } else {
                return xMath.triangleContainsPoint(...coords, x, y, A);
            }
        }
    }

    intersectsRect(x, y, w, h) {
        const coords = this.coords();
        return coords.length === 6 && xMath.rectIntersectsTriangle(x, y, w, h, ...coords);
    }

    containedByRect(x, y, w, h) {
        const coords = this.coords();
        return coords.length === 6 && xMath.rectContainsTriangle(x, y, w, h, ...coords);
    }

    coords() {
        const coords = [];
        for (const vertex of this.children("vertex")) {
            coords.push(vertex.x, vertex.y);
        }
        return coords;
    }
}
