import { MoveTool } from "./move.js";
import { VertexNode, TriangleNode } from "../../map/map.js";

export class MoveTextureTool extends MoveTool {
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

    moveNode(node, offset) {
        if (node.parentNode && (node.parentNode instanceof TriangleNode) && node.parentNode.attr("texture")) {
            const texture = node.parentNode.attr("texture");
            const w = this.editor.renderer.textureInfo(texture).width;
            const h = this.editor.renderer.textureInfo(texture).height;
            if (w) this.command.attr(node, "u", node.attr("u") - offset.x / w);
            if (h) this.command.attr(node, "v", node.attr("v") - offset.y / h);
        }
    }

    referenceNode() {
        return null;
    }
}
