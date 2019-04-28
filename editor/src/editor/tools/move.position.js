import { Matrix } from "../../support/matrix.js";
import { TriangleNode, ConnectionNode, PivotNode } from "../../map/map.js";
import { MoveTool } from "./move.js";

export class MovePositionTool extends MoveTool {
    get statusText() {
        return "Move";
    }

    filterSelection() {
        const nodes = new Set();
        for (const node of this.editor.selection.nodes) {
            if (node.hasPosition && !(node instanceof PivotNode)) {
                nodes.add(node);
            } else if (node instanceof TriangleNode) {
                for (const vertex of node.children("vertex")) {
                    nodes.add(vertex);
                }
            } else if (node instanceof ConnectionNode) {
                nodes.add(node.parentNode);
                nodes.add(node.attr("waypoint"));
            } else if ((node instanceof PivotNode) && this.editor.selection.nodes.size === 1) {
                nodes.add(node);
            }
        }
        return nodes;
    }

    moveNode(node, offset) {
        if (node instanceof PivotNode) {
            const scenery = node.parentNode;
            const sx = scenery.attr("width") >= 0 ? 1 : -1;
            const sy = scenery.attr("height") >= 0 ? 1 : -1;
            const pivotOffset = Matrix.scale(sx, sy)
                .multiply(Matrix.rotate(-scenery.attr("rotation")))
                .multiply(offset);
            this.command.attr(node, "offsetX", node.attr("offsetX") + pivotOffset.x);
            this.command.attr(node, "offsetY", node.attr("offsetY") + pivotOffset.y);
            this.command.attr(scenery, "x", scenery.attr("x") + offset.x);
            this.command.attr(scenery, "y", scenery.attr("y") + offset.y);
        } else {
            this.command.attr(node, "x", node.attr("x") + offset.x);
            this.command.attr(node, "y", node.attr("y") + offset.y);
        }
    }
}
