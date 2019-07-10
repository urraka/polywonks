import { iter } from "../../common/iter.js";
import { Mat2d } from "../../common/matrix.js";
import { PivotNode, LayerNode } from "../../map/map.js";
import { SnapSource } from "../snapping.js";
import { MoveTool } from "./move.js";
import { Tool } from "./tool.js";

export class MoveObjectsTool extends MoveTool {
    constructor() {
        super();
        this.moveSnapSources = null;
        this.snapFilter = this.snapFilter.bind(this);
    }

    get text() {
        return "Move";
    }

    get statusText() {
        return "Move";
    }

    onActivate() {
        this.moveSnapSources = [new SnapSource(this.editor.map, this.snapFilter)];
        super.onActivate();
    }

    snapFilter(node) {
        return !this.nodes.has(node) && (!(node instanceof PivotNode) || !this.nodes.has(node.parentNode));
    }

    filterSelection() {
        const sel = this.editor.selection.nodes;
        if (sel.size === 1 && (iter(sel).first() instanceof PivotNode)) {
            return new Set(sel);
        } else {
            const nodes = new Set();
            for (const selNode of sel) {
                if (selNode !== this.editor.map && !(selNode instanceof LayerNode)) {
                    for (const node of selNode.nodesTransformable()) {
                        nodes.add(node);
                    }
                }
            }
            return nodes;
        }
    }

    moveNodes() {
        this.handle.snapSources = this.moveSnapSources;
        super.moveNodes();
        this.handle.snapSources = this.snapSources;
    }

    moveNode(node, offset) {
        if (node instanceof PivotNode) {
            const scenery = node.parentNode;
            const sx = scenery.attr("width") >= 0 ? 1 : -1;
            const sy = scenery.attr("height") >= 0 ? 1 : -1;
            const pivotOffset = Mat2d.scale(sx, sy)
                .multiply(Mat2d.rotate(-scenery.attr("rotation")))
                .multiply(offset);
            this.command.attr(node, "offset-x", node.attr("offset-x") + pivotOffset.x);
            this.command.attr(node, "offset-y", node.attr("offset-y") + pivotOffset.y);
            this.command.attr(scenery, "x", scenery.attr("x") + offset.x);
            this.command.attr(scenery, "y", scenery.attr("y") + offset.y);
        } else {
            this.command.attr(node, "x", node.attr("x") + offset.x);
            this.command.attr(node, "y", node.attr("y") + offset.y);
        }
    }
}

Tool.register(MoveObjectsTool);
