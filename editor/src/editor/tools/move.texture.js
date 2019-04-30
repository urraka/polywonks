import { iter } from "../../support/iter.js";
import { Mat3x3 } from "../../support/matrix.js";
import { VertexNode, TriangleNode } from "../../map/map.js";
import { MoveTool } from "./move.js";

export class MoveTextureTool extends MoveTool {
    constructor() {
        super();
        this.transforms = null;
    }

    get statusText() {
        return "Move texture";
    }

    filterSelection() {
        const nodes = new Set();
        for (const node of this.editor.selection.nodes) {
            if (node instanceof VertexNode) {
                nodes.add(node);
            } else if (node instanceof TriangleNode) {
                for (const vertex of node.children("vertex")) {
                    nodes.add(vertex);
                }
            }
        }
        return nodes;
    }

    moveNodes() {
        this.transforms = new Map();
        super.moveNodes();
        this.transforms = null;
    }

    moveNode(node, offset) {
        if (node.parentNode && (node.parentNode instanceof TriangleNode) && node.parentNode.attr("texture")) {
            const coords = this.computeUV(node, offset);
            this.command.attr(node, "u", coords.u);
            this.command.attr(node, "v", coords.v);
        }
    }

    computeUV(node, offset) {
        let transform = this.transforms.get(node.parentNode);
        if (transform === undefined) {
            transform = this.computeTransform(node.parentNode, offset);
            this.transforms.set(node.parentNode, transform);
        }

        return transform ? {
            u: transform.multiplyVectorX(node),
            v: transform.multiplyVectorY(node),
        } : node;
    }

    computeTransform(triangle, offset) {
        const [a, b, c] = iter(triangle.children("vertex")).map(vertex => (
            this.nodes.has(vertex) ? {
                x: vertex.x + offset.x,
                y: vertex.y + offset.y,
                u: vertex.u,
                v: vertex.v,
            } : vertex
        ));

        const m = new Mat3x3();
        m[0] = a.x; m[3] = b.x; m[6] = c.x;
        m[1] = a.y; m[4] = b.y; m[7] = c.y;
        m[2] = 1;   m[5] = 1;   m[8] = 1;

        const n = new Mat3x3();
        n[0] = a.u; n[3] = b.u; n[6] = c.u;
        n[1] = a.v; n[4] = b.v; n[7] = c.v;
        n[2] = 1;   n[5] = 1;   n[8] = 1;

        const mInv = m.inverse();
        return mInv ? n.multiply(mInv) : null;
    }

    referenceNode() {
        return null;
    }
}
