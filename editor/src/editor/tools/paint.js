import * as xMath from "../../common/math.js";
import { iter } from "../../common/iter.js";
import { Pointer } from "../../common/pointer.js";
import { Color } from "../../common/color.js";
import { TriangleNode, Attribute } from "../../map/map.js";
import { EditorCommand } from "../command.js";
import { Tool } from "./tool.js";

export class PaintTool extends Tool {
    constructor() {
        super();
        this.command = null;
        this.commandNodes = new Set();
        this.hoveredNodes = null;
        this.cycle = 0;
        this.startPoint = null;
        this.endPoint = null;
        this.fullTriangle = false;
        this.pointer = new Pointer();
        this.pointer.on("begin", e => this.onPointerBegin(e.mouseEvent));
        this.pointer.on("move", e => this.onPointerMove(e.mouseEvent));
        this.pointer.on("end", e => this.onPointerEnd(e.mouseEvent));
        this.attributes.set("color", new Attribute("color", new Color("#fff")));
        this.onAttrChange = () => this.endPaint();
        this.onEditorChange = () => this.updateHoveredNodes();
    }

    get status() {
        if (this.activated) {
            return this.fullTriangle ? "Paint triangles" : "Paint vertices";
        }
        return "";
    }

    get rootNode() {
        return this.editor.activeLayer || this.editor.map;
    }

    onActivate() {
        this.command = null;
        this.commandNodes.clear();
        this.hoveredNodes = [];
        this.cycle = 0;
        this.startPoint = null;
        this.endPoint = null;
        this.fullTriangle = false;
        this.on("attributechange", this.onAttrChange);
        this.editor.on("change", this.onEditorChange);
        this.pointer.activate(this.editor.element, 0);
        this.updateHoveredNodes();
        this.emit("statuschange");
    }

    onDeactivate() {
        this.off("attributechange", this.onAttrChange);
        this.editor.off("change", this.onEditorChange);
        this.pointer.deactivate();
    }

    onCommand(command) {
        if (this.activated) {
            const fullTriangle = this.fullTriangle;
            switch (command) {
                case "select.cycle": {
                    if (this.hoveredNodes.length > 0) {
                        this.cycle = (this.cycle + 1) % this.hoveredNodes.length;
                        this.editor.reactiveNode = this.hoveredNodes[this.cycle].parentNode;
                        this.editor.redraw();
                    }
                    break;
                }
                case "+select.add": {
                    this.fullTriangle = true;
                    break;
                }
                case "-select.add": {
                    this.fullTriangle = false;
                    break;
                }
            }
            if (this.fullTriangle !== fullTriangle) {
                this.emit("statuschange");
            }
        }
    }

    onPointerBegin() {
        const p = this.editor.cursor.position;
        this.startPoint = { ...p };
        this.endPoint = { ...p };
        this.paintNodes(this.affectedNodes(true));
    }

    onPointerEnd() {
        this.startPoint = null;
        this.endPoint = null;
        this.endPaint();
    }

    onPointerMove() {
        if (this.pointer.dragging) {
            this.endPoint = { ...this.editor.cursor.position };
            this.updateHoveredNodes();
            this.paintNodes(this.affectedNodes(false));
            this.startPoint = { ...this.endPoint }
        } else {
            this.updateHoveredNodes();
        }
    }

    affectedNodes(singleNode) {
        const nodes = singleNode ? this.hoveredNodes.slice(this.cycle, this.cycle + 1) : this.hoveredNodes;
        if (this.fullTriangle) {
            return [...new Set(nodes.flatMap(node => [...node.parentNode.children("vertex")]))];
        }
        return nodes;
    }

    paintNodes(nodes) {
        if (this.hoveredNodes.length > 0) {
            if (this.command && !this.editor.undo(this.command)) {
                this.endPaint();
            }
            this.command = new EditorCommand(this.editor);
            nodes.forEach(node => this.commandNodes.add(node));
            for (const node of this.commandNodes) {
                this.command.attr(node, "color", this.attr("color"));
            }
            this.editor.do(this.command);
        }
    }

    endPaint() {
        this.command = null;
        this.commandNodes.clear();
    }

    updateHoveredNodes() {
        const a = this.startPoint || this.editor.cursor;
        const b = this.endPoint || this.editor.cursor;
        this.hoveredNodes = this.verticesIntersectingSegment(a.x, a.y, b.x, b.y);
        this.cycle = 0;
        this.editor.reactiveNode = null;
        this.editor.previewNodes.clear();
        if (this.hoveredNodes.length > 0) {
            this.hoveredNodes.forEach(node => this.editor.previewNodes.add(node));
            this.hoveredNodes.forEach(node => this.editor.previewNodes.add(node.parentNode));
            this.editor.reactiveNode = this.hoveredNodes[0].parentNode;
        }
        this.editor.redraw();
    }

    verticesIntersectingSegment(ax, ay, bx, by) {
        const nodes = this.rootNode.nodesIntersectingRect(ax, ay, bx - ax, by - ay, this.editor.view.scale);
        return iter(nodes).filter(node => {
            if (node instanceof TriangleNode) {
                const coords = node.coords();
                if (coords.length === 6 && xMath.triangleIntersectsSegment(...coords, ax, ay, bx, by)) {
                    const [p, q, r] = [0, 1, 2].map(i => coords.slice(2 * i, 2 * i + 2));
                    return [[p, q], [q, r], [r, p]].every(edge => xMath.distance2(...edge.flat()) > 0);
                }
            }
            return false;
        }).map(triangle => {
            const [p, q, r] = [...triangle.children("vertex")];
            const o = xMath.triangleIncenter(...triangle.coords());
            if (o) {
                const mid = [
                    xMath.linesIntersection(p.x, p.y, o.x, o.y, q.x, q.y, r.x, r.y),
                    xMath.linesIntersection(q.x, q.y, o.x, o.y, r.x, r.y, p.x, p.y),
                    xMath.linesIntersection(r.x, r.y, o.x, o.y, p.x, p.y, q.x, q.y),
                ];
                return [p, q, r].filter((v, i) => {
                    const m = mid[(i + 1) % 3], n = mid[(i + 2) % 3];
                    return xMath.triangleIntersectsSegment(v.x, v.y, m.x, m.y, o.x, o.y, ax, ay, bx, by) ||
                        xMath.triangleIntersectsSegment(v.x, v.y, n.x, n.y, o.x, o.y, ax, ay, bx, by);
                });
            }
            return [];
        }).flat();
    }
}
