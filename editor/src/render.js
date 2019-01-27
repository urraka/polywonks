import * as Gfx from "./gfx/gfx.js";
import { Color } from "./support/color.js";
import { Matrix } from "./support/matrix.js";
import { Path } from "./support/path.js";
import { processImage, gradientCircle } from "./support/image.js";
import { dashToCamel } from "./support/format.js";
import { Rect } from "./support/rect.js";
import { SpawnTeam } from "./pms/pms.js";
import { File } from "./file.js";
import { cfg, Settings } from "./settings.js";
import { SelectTool } from "./tool.select.js";

import {
    LayerNode,
    TextureNode,
    ImageNode,
    SceneryNode,
    TriangleNode,
    VertexNode,
    SpawnNode,
    ColliderNode,
    WaypointNode,
    ConnectionNode,
} from "./map/map.js";

export class Renderer {
    constructor() {
        this.context = new Gfx.Context();
        this.context.canvas.classList.add("editor-canvas");
        this.batch = this.context.createBatch();
        this.textures = new WeakMap();
        this.colliderTexture = this.context.createTexture(512, 512, gradientCircle());
        this.colliderTexture.generateMipmaps();
        this.icons = {};
        this.iconsInfo = {};
        this.animFrameId = null;
        this.selectionNodes = null;
        this.theme = null;
        this._editor = null;
        this.onEditorRedraw = () => this.redraw();

        for (const spawnType of SpawnTeam.names()) {
            this.loadIcon("spawn-" + spawnType);
        }
    }

    get editor() {
        return this._editor;
    }

    set editor(value) {
        if (this._editor) this._editor.off("redraw", this.onEditorRedraw);
        this._editor = value;
        this._editor.on("redraw", this.onEditorRedraw);
        this.redraw();
    }

    get width() {
        return this.context.canvas.width;
    }

    get height() {
        return this.context.canvas.height;
    }

    loadThemeColors() {
        this.theme = this.theme || {};
        for (const key of Settings.list()) {
            if (key.startsWith("theme.")) {
                const propertyName = dashToCamel(key.substring("theme.".length));
                this.theme[propertyName] = cfg(key);
            }
        }
    }

    loadIcon(name) {
        const image = new Image();
        image.src = "res/" + name + ".png";
        image.addEventListener("load", () => {
            const imageData = processImage(image, { premultiply: true });
            this.icons[name] = this.context.createTexture(imageData);
            this.icons[name].setNearestFilter(true);
            this.redraw();

            this.iconsInfo[name] = {
                width: imageData.width,
                height: imageData.height,
                radius: imageData.data.length >= 3 && imageData.data[3] < 255 ? imageData.width / 2 : 0
            };
        });
    }

    disposeNodeResources(node) {
        const texture = this.textures.get(node);
        if (texture) {
            this.textures.delete(node);
            if (texture !== this.context.defaultTexture) {
                texture.dispose();
            }
        }
        for (const childNode of node.children()) {
            this.disposeNodeResources(childNode);
        }
    }

    texture(node) {
        if (!node) {
            return this.context.defaultTexture;
        }

        let texture = this.textures.get(node);

        if (!texture) {
            this.textures.set(node, texture = this.context.defaultTexture);
            const dir = Path.dir(node.owner.path);
            const src = node.attr("src");

            if (src && (dir.startsWith("/") || src.startsWith("/"))) {
                File.readImage(Path.resolve(dir, src), image => {
                    if (image) {
                        const imageData = processImage(image, {
                            premultiply: true,
                            padding: node instanceof ImageNode,
                            colorKey: node.attr("color-key"),
                            npot: node instanceof TextureNode
                        });

                        const texture = this.context.createTexture(imageData);
                        texture.setRepeat(node instanceof TextureNode);
                        this.textures.set(node, texture);
                        this.redraw();
                    }
                });
            }
        }

        return texture;
    }

    redraw() {
        if (this.animFrameId === null) {
            this.animFrameId = window.requestAnimationFrame(() => {
                this.animFrameId = null;
                this.draw();
            });
        }
    }

    updateCanvasSize() {
        const canvas = this.context.canvas;
        const overlay = this.editor.element;
        if (canvas.width !== overlay.clientWidth || canvas.height !== overlay.clientHeight) {
            canvas.width = overlay.clientWidth;
            canvas.height = overlay.clientHeight;
        }
    }

    draw() {
        if (!this.editor) {
            return;
        }

        this.selectionNodes = [];
        this.loadThemeColors();
        this.updateCanvasSize();
        this.batch.clear();

        if (cfg("view.background")) {
            this.drawBackground();
        }

        this.drawNode(this.editor.map, node => !(node instanceof WaypointNode) && !(node instanceof ConnectionNode));

        if (cfg("view.wireframe")) {
            this.drawWireframe();
        }

        if (cfg("view.grid")) {
            this.drawGrid();
        }

        this.drawNode(this.editor.map, node => (node instanceof WaypointNode) || (node instanceof ConnectionNode));
        this.drawSelection();
        this.context.clear(this.theme.background);
        this.context.draw(this.batch, this.editor.view.transform);
    }

    drawGrid() {
        const view = this.editor.view;
        const w = view.width / 2;
        const h = view.height / 2;
        const color = this.theme.gridColor;
        const divisionColor = this.theme.gridColorDivision;
        const limit = cfg("editor.grid-limit");
        const size = cfg("editor.grid-size");
        const divisions = cfg("editor.grid-divisions");
        const divisionSize = size / divisions;

        if (divisionSize * view.scale >= limit) {
            const x0 = Math.floor((view.x - w) / size) * size + divisionSize;
            for (let x = x0; x <= view.x + w + size; x += divisionSize) {
                for (let i = 0; i < divisions - 1; x += divisionSize, i++) {
                    const lineX = Math.floor(x / divisionSize) * divisionSize;
                    this.batch.add(Gfx.Lines, null, [
                        new Gfx.Vertex(lineX, view.y - h, 0, 0, divisionColor),
                        new Gfx.Vertex(lineX, view.y + h, 0, 0, divisionColor)
                    ]);
                }
            }

            const y0 = Math.floor((view.y - h) / size) * size + divisionSize;
            for (let y = y0; y <= view.y + h + size; y += divisionSize) {
                for (let i = 0; i < divisions - 1; y += divisionSize, i++) {
                    const lineY = Math.floor(y / divisionSize) * divisionSize;
                    this.batch.add(Gfx.Lines, null, [
                        new Gfx.Vertex(view.x - w, lineY, 0, 0, divisionColor),
                        new Gfx.Vertex(view.x + w, lineY, 0, 0, divisionColor)
                    ]);
                }
            }
        }

        // when zooming out grid size becomes N*size depending on the limit (min pixel size)
        const effectiveSize = size * Math.ceil(limit / (size * view.scale));

        for (let x = view.x - w; x <= view.x + w + effectiveSize; x += effectiveSize) {
            const lineX = Math.floor(x / effectiveSize) * effectiveSize;
            this.batch.add(Gfx.Lines, null, [
                new Gfx.Vertex(lineX, view.y - h, 0, 0, color),
                new Gfx.Vertex(lineX, view.y + h, 0, 0, color)
            ]);
        }

        for (let y = view.y - h; y <= view.y + h + effectiveSize; y += effectiveSize) {
            const lineY = Math.floor(y / effectiveSize) * effectiveSize;
            this.batch.add(Gfx.Lines, null, [
                new Gfx.Vertex(view.x - w, lineY, 0, 0, color),
                new Gfx.Vertex(view.x + w, lineY, 0, 0, color)
            ]);
        }
    }

    drawBackground() {
        const bounds = this.editor.map.backgroundBounds();
        const colorTop = new Color(this.editor.map.attr("color-top"), 255);
        const colorBottom = new Color(this.editor.map.attr("color-bottom"), 255);
        const view = this.editor.view;

        bounds.x0 = view.x - view.width / 2;
        bounds.x1 = view.x + view.width / 2;

        if (bounds.y0 > view.y - view.height / 2) {
            this.batch.addQuad(null, [
                new Gfx.Vertex(bounds.x0, view.y - view.height / 2, 0, 0, colorTop),
                new Gfx.Vertex(bounds.x1, view.y - view.height / 2, 0, 0, colorTop),
                new Gfx.Vertex(bounds.x1, bounds.y0, 0, 0, colorTop),
                new Gfx.Vertex(bounds.x0, bounds.y0, 0, 0, colorTop)
            ]);
        }

        if (bounds.y1 < view.y + view.height / 2) {
            this.batch.addQuad(null, [
                new Gfx.Vertex(bounds.x0, bounds.y1, 0, 0, colorBottom),
                new Gfx.Vertex(bounds.x1, bounds.y1, 0, 0, colorBottom),
                new Gfx.Vertex(bounds.x1, view.y + view.height / 2, 0, 0, colorBottom),
                new Gfx.Vertex(bounds.x0, view.y + view.height / 2, 0, 0, colorBottom)
            ]);
        }

        this.batch.addQuad(null, [
            new Gfx.Vertex(bounds.x0, bounds.y0, 0, 0, colorTop),
            new Gfx.Vertex(bounds.x1, bounds.y0, 0, 0, colorTop),
            new Gfx.Vertex(bounds.x1, bounds.y1, 0, 0, colorBottom),
            new Gfx.Vertex(bounds.x0, bounds.y1, 0, 0, colorBottom)
        ]);
    }

    rectVertices(cx, cy, w, h, color) {
        const rect = new Rect(0, 0, w, h);
        rect.centerX = cx;
        rect.centerY = cy;
        return [
            new Gfx.Vertex(rect.x0, rect.y0, 0, 0, color),
            new Gfx.Vertex(rect.x1, rect.y0, 0, 0, color),
            new Gfx.Vertex(rect.x1, rect.y1, 0, 0, color),
            new Gfx.Vertex(rect.x0, rect.y1, 0, 0, color)
        ];
    }

    nodeVertices(node, color) {
        switch (node.constructor) {
            case TriangleNode: {
                const vertices = Array.from(node.children()).map(v => {
                    return new Gfx.Vertex(v.attr("x"), v.attr("y"), v.attr("u"), v.attr("v"), color || v.attr("color"));
                });
                return vertices.length === 3 ? vertices : null;
            }

            case SceneryNode: {
                const vertices = node.computeVertices(this.texture(node.attr("image")));
                if (color) vertices.forEach(v => v.color.set(color));
                return vertices;
            }

            case SpawnNode: {
                const info = this.iconsInfo["spawn-" + node.attr("type")];
                if (!info) return null;
                const s = this.editor.view.scale;
                const { x, y } = this.editor.view.mapToPixelGrid(node.attr("x"), node.attr("y"));
                return this.rectVertices(x, y, info.width / s, info.height / s, color);
            }

            case ColliderNode: {
                const size = 2 * node.attr("radius");
                return this.rectVertices(node.attr("x"), node.attr("y"), size, size, color);
            }

            case WaypointNode: {
                const size = cfg("editor.waypoint-size") / this.editor.view.scale;
                const { x, y } = this.editor.view.mapToPixelGrid(node.attr("x"), node.attr("y"));
                return this.rectVertices(x, y, size, size, color);
            }

            case ConnectionNode: {
                const a = node.parentNode;
                const b = node.attr("waypoint");
                return [
                    new Gfx.Vertex(a.attr("x"), a.attr("y"), 0, 0, color),
                    new Gfx.Vertex(b.attr("x"), b.attr("y"), 0, 0, color)
                ];
            }

            default: return null;
        }
    }

    drawNode(node, filter) {
        if (!node.visible) {
            return;
        }

        if (filter(node) && (this.editor.selection.has(node) || this.editor.previewNodes.has(node))) {
            this.selectionNodes.push(node);
        }

        switch (node.constructor) {
            case TriangleNode: {
                const vertices = this.nodeVertices(node);
                if (vertices) {
                    if (cfg("view.polygons") === "texture") {
                        this.batch.add(Gfx.Triangles, this.texture(node.attr("texture")), vertices);
                    } else if (cfg("view.polygons") === "plain") {
                        this.batch.add(Gfx.Triangles, this.context.whiteTexture, vertices);
                    }
                }
                break;
            }

            case SceneryNode: {
                this.batch.addQuad(this.texture(node.attr("image")), this.nodeVertices(node, null));
                break;
            }

            case ColliderNode: {
                const r = node.attr("radius");
                const sprite = new Gfx.Sprite(this.colliderTexture, 2 * r, 2 * r, 0, 1, 0, 1);
                const transform = Matrix.translate(node.attr("x") - r, node.attr("y") - r);
                this.batch.addSprite(sprite, new Color(255, 0, 0), transform);
                break;
            }

            case SpawnNode: {
                this.drawIcon("spawn-" + node.attr("type"), node.attr("x"), node.attr("y"));
                break;
            }

            case WaypointNode: {
                const size = cfg("editor.waypoint-size") / this.editor.view.scale;
                const p = this.editor.view.mapToPixelGrid(node.attr("x"), node.attr("y"));
                const rect = new Rect(0, 0, size, size);
                rect.centerX = p.x;
                rect.centerY = p.y;

                const fill = new Color(this.theme.waypointColor);
                fill.a = fill.a * 0.25;

                this.drawRect(rect, fill, this.theme.waypointColor);
                break;
            }

            case ConnectionNode: {
                const a = node.parentNode;
                const b = node.attr("waypoint");
                const color = this.theme.waypointColor;

                this.batch.add(Gfx.Lines, null, [
                    new Gfx.Vertex(a.attr("x"), a.attr("y"), 0, 0, color),
                    new Gfx.Vertex(b.attr("x"), b.attr("y"), 0, 0, color)
                ]);

                break;
            }
        }

        for (const childNode of node.children()) {
            if ((childNode instanceof LayerNode) || filter(childNode)) {
                this.drawNode(childNode, filter);
            }
        }
    }

    drawWireframe() {
        for (const node of this.editor.map.descendants()) {
            if (node instanceof TriangleNode) {
                const vertices = this.nodeVertices(node);
                vertices.forEach(v => v.color.a = 255);
                this.drawLineLoop(vertices);
            }
        }
    }

    drawIcon(name, x, y, color = new Color(255, 255, 255)) {
        const texture = this.icons[name];

        if (texture) {
            ({ x, y } = this.editor.view.mapToPixelGrid(x, y));
            const [w, h, s] = [texture.width, texture.height, this.editor.view.scale];
            const sprite = new Gfx.Sprite(texture, w, h, 0, 1, 0, 1);
            const transform = Matrix.transform(x, y, w / 2, h / 2, 1 / s, 1 / s, 0);
            this.batch.addSprite(sprite, color, transform);
        }
    }

    drawSelection() {
        const fill = this.theme.selectionFill;
        const selectedBorder = this.theme.selectionBorder;
        const previewBorder = this.theme.selectionPreviewBorder;
        const reactiveBorder = this.theme.selectionReactiveBorder;
        const subtractBorder = this.theme.selectionSubtractBorder;
        const subtractFill = new Color(fill, fill.a * 0.5);

        const editor = this.editor;
        const selectTool = (editor.currentTool instanceof SelectTool) && editor.currentTool;
        const subtracting = selectTool && selectTool.mode === "subtract";
        const subtractingNode = node => subtracting && editor.previewNodes.has(node);

        for (const node of this.selectionNodes) {
            const vertices = this.nodeVertices(node, fill);

            if (vertices) {
                const verticesFill = vertices.length === 3 ? vertices :
                    vertices.length === 4 ? [0, 1, 2, 2, 3, 0].map(i => vertices[i]) : null;

                if (editor.selection.has(node)) {
                    if (!subtractingNode(node)) {
                        if (verticesFill) this.batch.add(Gfx.Triangles, null, verticesFill);
                        this.drawLineLoop(vertices, selectedBorder);
                    } else {
                        vertices.forEach(v => v.color.set(subtractFill));
                        if (verticesFill) this.batch.add(Gfx.Triangles, null, verticesFill);
                        this.drawLineLoop(vertices, subtractBorder);
                    }
                } else if (!subtracting) {
                    if (node === editor.reactiveNode) {
                        this.drawLineLoop(vertices, reactiveBorder);
                    } else {
                        this.drawLineLoop(vertices, previewBorder);
                    }
                }
            }
        }

        const vertexSize = cfg("editor.vertex-size");
        const vertexFillDim = new Color(this.theme.vertexFill, this.theme.vertexFill.a * 0.5);
        const vertexBorderDim = new Color(this.theme.vertexBorder, this.theme.vertexBorder.a * 0.5);

        for (const node of this.selectionNodes) {
            if (node instanceof VertexNode) {
                let s = this.editor.view.scale;
                let p = this.editor.view.mapToPixelGrid(node.attr("x"), node.attr("y"));
                const rect = new Rect(0, 0, vertexSize / s, vertexSize / s);
                rect.centerX = p.x;
                rect.centerY = p.y;

                if (editor.selection.has(node)) {
                    if (!subtractingNode(node)) {
                        const prev = node.previousSibling || (node.parentNode && node.parentNode.lastChild);
                        const next = node.nextSibling || (node.parentNode && node.parentNode.firstChild);

                        if (prev && prev !== node) {
                            const dx = prev.attr("x") - node.attr("x");
                            const dy = prev.attr("y") - node.attr("y");
                            const length = Math.hypot(dx, dy);
                            const targetX = node.attr("x") + (length > 0 ? Math.min(length, 2 * vertexSize) * (dx / length) : 0);
                            const targetY = node.attr("y") + (length > 0 ? Math.min(length, 2 * vertexSize) * (dy / length) : 0);
                            this.batch.add(Gfx.Lines, null, [
                                new Gfx.Vertex(node.attr("x"), node.attr("y"), 0, 0, this.theme.vertexBorder),
                                new Gfx.Vertex(targetX, targetY, 0, 0, new Color(this.theme.vertexBorder, 0))
                            ]);
                        }

                        if (next && next !== node && next !== prev) {
                            const dx = next.attr("x") - node.attr("x");
                            const dy = next.attr("y") - node.attr("y");
                            const length = Math.hypot(dx, dy);
                            const targetX = node.attr("x") + (length > 0 ? Math.min(length, 2 * vertexSize) * (dx / length) : 0);
                            const targetY = node.attr("y") + (length > 0 ? Math.min(length, 2 * vertexSize) * (dy / length) : 0);
                            this.batch.add(Gfx.Lines, null, [
                                new Gfx.Vertex(node.attr("x"), node.attr("y"), 0, 0, this.theme.vertexBorder),
                                new Gfx.Vertex(targetX, targetY, 0, 0, new Color(this.theme.vertexBorder, 0))
                            ]);
                        }

                        this.drawRect(rect, this.theme.vertexFill, this.theme.vertexBorder);
                    } else {
                        this.drawRect(rect, subtractBorder, this.theme.vertexBorder);
                    }
                } else if (!subtracting) {
                    this.drawRect(rect, vertexFillDim, vertexBorderDim);
                }
            }
        }

        if (selectTool && selectTool.rect) {
            const p1 = this.editor.view.mapToPixelGrid(selectTool.rect.x0, selectTool.rect.y0);
            const p2 = this.editor.view.mapToPixelGrid(selectTool.rect.x1, selectTool.rect.y1);
            const rc = new Rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
            this.drawRect(rc, this.theme.selectionRectFill, this.theme.selectionRectBorder);
        }
    }

    drawRect(rect, fill, border) {
        const color = fill || border;

        const vertices = [
            new Gfx.Vertex(rect.x0, rect.y0, 0, 0, color),
            new Gfx.Vertex(rect.x1, rect.y0, 0, 0, color),
            new Gfx.Vertex(rect.x1, rect.y1, 0, 0, color),
            new Gfx.Vertex(rect.x0, rect.y1, 0, 0, color)
        ];

        if (fill) this.batch.addQuad(null, vertices);
        if (border) this.drawLineLoop(vertices, border);
    }

    drawLineLoop(vertices, color) {
        if (color) {
            vertices.forEach(v => v.color.set(color));
        }
        for (let i = vertices.length - 1, j = 0; j < vertices.length - +(vertices.length < 3); i = j++) {
            this.batch.add(Gfx.Lines, null, [vertices[i], vertices[j]]);
        }
    }
}
