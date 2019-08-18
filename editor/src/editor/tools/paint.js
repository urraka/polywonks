import * as xMath from "../../common/math.js";
import { iter } from "../../common/iter.js";
import { Color } from "../../common/color.js";
import { TriangleNode, Attribute } from "../../map/map.js";
import { Command } from "../../app/command.js";
import { EditCommand } from "../edit.js";
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
        this.button = null;
        this.attributes.set("color", new Attribute("color", new Color("#fff")));
        this.onAttrChange = () => this.endPaint();
        this.onMapChange = () => this.updateHoveredNodes();
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onButtonDown = this.onButtonDown.bind(this);
        this.onButtonUp = this.onButtonUp.bind(this);

        Command.provide(this);
    }

    get text() {
        return "Paint";
    }

    get statusText() {
        return this.fullTriangle ? "Paint triangles" : "Paint vertices";
    }

    get rootNode() {
        return this.editor.activeLayer || this.editor.map;
    }

    get fullTriangle() {
        return !!this._fullTriangle;
    }

    set fullTriangle(value) {
        if (this.fullTriangle !== !!value) {
            this._fullTriangle = value;
            this.emit("statuschange");
        }
    }

    onActivate() {
        this.command = null;
        this.commandNodes.clear();
        this.hoveredNodes = [];
        this.cycle = 0;
        this.startPoint = null;
        this.endPoint = null;
        this.fullTriangle = false;
        this.button = null;
        this.on("attributechange", this.onAttrChange);
        this.editor.map.on("change", this.onMapChange);
        this.editor.cursor.on("move", this.onPointerMove);
        this.editor.cursor.leftButton.on("buttondown", this.onButtonDown);
        this.editor.cursor.leftButton.on("buttonup", this.onButtonUp);
        this.updateHoveredNodes();
    }

    onDeactivate() {
        this.off("attributechange", this.onAttrChange);
        this.editor.map.off("change", this.onMapChange);
        this.editor.cursor.off("move", this.onPointerMove);
        this.editor.cursor.leftButton.off("buttondown", this.onButtonDown);
        this.editor.cursor.leftButton.off("buttonup", this.onButtonUp);
    }

    onButtonDown(event) {
        const p = this.editor.cursor.position;
        this.button = event.target;
        this.startPoint = { ...p };
        this.endPoint = { ...p };
        this.paintNodes(this.affectedNodes(true));
    }

    onButtonUp() {
        this.startPoint = null;
        this.endPoint = null;
        this.endPaint();
    }

    onPointerMove() {
        if (this.button && this.button.dragging) {
            this.endPoint = { ...this.editor.cursor.position };
            this.updateHoveredNodes();
            this.paintNodes(this.affectedNodes(false));
            this.startPoint = { ...this.endPoint }
        } else {
            this.updateHoveredNodes();
        }
    }

    cycleNodes() {
        if (this.hoveredNodes.length > 0) {
            this.cycle = (this.cycle + 1) % this.hoveredNodes.length;
            this.editor.reactive.replace(new Set([this.hoveredNodes[this.cycle].parentNode]));
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
            if (this.command && !this.editor.history.undo(this.command)) {
                this.endPaint();
            }
            this.command = new EditCommand(this.editor);
            nodes.forEach(node => this.commandNodes.add(node));
            for (const node of this.commandNodes) {
                this.command.attr(node, "color", this.attr("color"));
            }
            this.editor.history.do(this.command);
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
        if (this.hoveredNodes.length > 0) {
            this.editor.preview.replace(new Set(this.hoveredNodes.concat(this.hoveredNodes.map(node => node.parentNode))));
            this.editor.reactive.replace(new Set([this.hoveredNodes[0].parentNode]));
        } else {
            this.editor.preview.clear();
            this.editor.reactive.clear();
        }
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

Tool.register(PaintTool);
