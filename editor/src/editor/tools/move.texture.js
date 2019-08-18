import { iter } from "../../common/iter.js";
import { Mat3x3 } from "../../common/matrix.js";
import { VertexNode, TriangleNode } from "../../map/map.js";
import { MoveTool } from "./move.js";
import { Tool } from "./tool.js";

export class MoveTextureTool extends MoveTool {
    constructor() {
        super();
        this.transforms = null;
    }

    get text() {
        return "Move Texture";
    }

    get statusText() {
        return "Move texture";
    }

    onButtonUp(event) {
        if (event.target === this.button && this.button.dragging && !this.handle.active) {
            const node = this.handle.referenceNode;
            this.handle.reset(this.handleStart.x, this.handleStart.y, node);
        }
        super.onButtonUp(event);
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
        const refNode = this.handle.referenceNode;
        this.handle.reset(this.handle.x, this.handle.y);
        this.transforms = new Map();
        super.moveNodes();
        this.transforms = null;
        this.handle.reset(this.handle.x, this.handle.y, refNode);
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

        return Mat3x3.triangleToTriangleTransform(
            a.x, a.y, b.x, b.y, c.x, c.y,
            a.u, a.v, b.u, b.v, c.u, c.v,
        );
    }
}

Tool.register(MoveTextureTool);
