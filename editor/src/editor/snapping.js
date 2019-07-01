import * as xMath from "../common/math.js";
import { SceneryNode } from "../map/map.js";
import { cfg } from "../app/settings.js";

export class SnapSource {
    constructor(node, filter = null) {
        this.node = node;
        this.filter = filter;
    }

    nodesAt(x, y, size, scale) {
        const nodes = [...this.node.nodesIntersectingRect(x - size, y - size, 2 * size, 2 * size, scale)];
        return this.filter ? nodes.filter(this.filter) : nodes;
    }
}

export class SnapHandle {
    constructor(editor) {
        this.editor = editor;
        this.visible = true;
        this.active = false;
        this.referenceNode = null;
        this.position = { x: 0, y: 0 };
        this.snapSources = [];
        this.snapResult = null;
        this._snapToGrid = undefined;
        this._snapToObjects = undefined;
    }

    get snapToObjects() {
        if (this._snapToObjects === undefined) {
            return cfg("editor.snap-to-objects");
        } else {
            return this._snapToObjects;
        }
    }

    set snapToObjects(value) {
        this._snapToObjects = value;
    }

    get snapToGrid() {
        if (this._snapToGrid === undefined) {
            return cfg("view.grid") && cfg("editor.snap-to-grid");
        } else {
            return this._snapToGrid;
        }
    }

    set snapToGrid(value) {
        this._snapToGrid = value;
    }

    get x() {
        if (this.referenceNode) {
            return this.referenceNode.x + this.position.x;
        } else {
            return this.position.x;
        }
    }

    get y() {
        if (this.referenceNode) {
            return this.referenceNode.y + this.position.y;
        } else {
            return this.position.y;
        }
    }

    reset(x, y, referenceNode = null) {
        this.referenceNode = referenceNode;
        if (this.referenceNode) {
            this.position.x = x - this.referenceNode.x;
            this.position.y = y - this.referenceNode.y;
        } else {
            this.position.x = x;
            this.position.y = y;
        }
    }

    moveTo(x, y) {
        this.snapResult = this.snap(x, y);
        if (this.snapResult) {
            x = this.snapResult.position.x;
            y = this.snapResult.position.y;
        }
        if (this.referenceNode) {
            this.position.x = x - this.referenceNode.x;
            this.position.y = y - this.referenceNode.y;
        } else {
            this.position.x = x;
            this.position.y = y;
        }
    }

    intersectsPoint(point) {
        const d = 0.5 * cfg("editor.vertex-size") / this.editor.view.scale;
        return Math.abs(point.x - this.x) <= d || Math.abs(point.y - this.y) <= d;
    }

    snap(x, y) {
        const d = cfg("editor.snap-radius") / this.editor.view.scale;

        return this.snapNodes(x, y)
            .filter(node => node.hasPosition)
            .map(node => {
                if (node instanceof SceneryNode) {
                    return node.computeVertices().map(v => ({
                        node,
                        position: { x: v.x, y: v.y },
                        dist: xMath.distance2(x, y, v.x, v.y)
                    }));
                } else {
                    return {
                        node,
                        position: { x: node.x, y: node.y },
                        dist: xMath.distance2(x, y, node.x, node.y)
                    };
                }
            })
            .concat(this.snapGrid(x, y))
            .flat()
            .reduce((acc, cur) => (cur.dist <= d * d && (!acc || cur.dist < acc.dist)) ? cur : acc, null);
    }

    snapNodes(x, y) {
        if (this.snapToObjects) {
            const s = this.editor.view.scale;
            const d = cfg("editor.snap-radius") / s;
            return this.snapSources.map(src => src.nodesAt(x, y, d, s)).flat();
        }
        return [];
    }

    snapGrid(x, y) {
        if (this.snapToGrid) {
            const d = this.editor.grid.effectiveSize;
            const x0 = d * Math.floor(x / d);
            const y0 = d * Math.floor(y / d);

            return [
                { x: x0, y: y0 },
                { x: x0 + d, y: y0 },
                { x: x0 + d, y: y0 + d },
                { x: x0, y: y0 + d },
            ].map(p => ({
                node: null,
                position: p,
                dist: xMath.distance2(x, y, p.x, p.y)
            }));
        }
        return [];
    }
}
