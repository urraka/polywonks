import * as Gfx from "../gfx/gfx.js";
import { Color } from "../common/color.js";
import { processImage, gradientCircle, rectangle } from "../common/image.js";
import { dashToCamel } from "../common/format.js";
import { Path } from "../common/path.js";
import { Rect } from "../common/rect.js";
import { SpawnTeam } from "../pms/pms.js";
import { CreateTool } from "../editor/tools/create.js";
import { File } from "./file.js";
import { cfg, Settings } from "./settings.js";

import {
    TextureNode,
    ImageNode,
    SceneryNode,
    PivotNode,
    TriangleNode,
    VertexNode,
    SpawnNode,
    ColliderNode,
    WaypointNode,
    ConnectionNode,
} from "../map/map.js";

export class Renderer {
    constructor(app) {
        this.context = new Gfx.Context();
        this.batch = this.context.createBatch();
        this.textures = new Map();
        this.icons = {};
        this.animFrameId = null;
        this.theme = null;
        this.loadIcons();

        this.redraw = this.redraw.bind(this);
        this.onResourceNodeAttrChange = this.onResourceNodeAttrChange.bind(this);

        app.on("editorclose", e => this.onEditorClose(e.editor));
        app.on("activeeditorchange", e => this.onEditorChange(e.editor));
        Settings.on("change", e => this.onSettingChange(e.setting));
        window.addEventListener("resize", this.redraw);
    }

    static get iconsInfo() {
        return Renderer._iconsInfo || (Renderer._iconsInfo = {});
    }

    static iconInfo(name) {
        return Renderer.iconsInfo[name];
    }

    static get texturesInfo() {
        return Renderer._texturesInfo || (Renderer._texturesInfo = new Map());
    }

    static textureInfo(node) {
        return Renderer.texturesInfo.get(node) || { width: 0, height: 0 };
    }

    get texturesInfo() {
        return Renderer.texturesInfo;
    }

    get editor() {
        return this._editor;
    }

    onEditorChange(editor) {
        if (this.editor) {
            this.editor.view.off("change", this.redraw);
            this.editor.selection.off("change", this.redraw);
            this.editor.preview.off("change", this.redraw);
            this.editor.reactive.off("change", this.redraw);
            this.editor.toolset.off("toolstatechange", this.redraw);
            this.editor.map.off("visibilitychange", this.redraw);
            this.editor.map.off("change", this.redraw);
        }
        this._editor = editor;
        this.editor.view.on("change", this.redraw);
        this.editor.selection.on("change", this.redraw);
        this.editor.preview.on("change", this.redraw);
        this.editor.reactive.on("change", this.redraw);
        this.editor.toolset.on("toolstatechange", this.redraw);
        this.editor.map.on("visibilitychange", this.redraw);
        this.editor.map.on("change", this.redraw);
        this.redraw();
    }

    onEditorClose(editor) {
        this.disposeNodeResources(editor.map);
    }

    loadThemeColors() {
        this.theme = this.theme || {};
        for (const key of Settings.list()) {
            if (key.startsWith("theme.")) {
                const propertyName = dashToCamel(key.substring("theme.".length));
                this.theme[propertyName] = cfg(key);
            }
        }

        this.theme.selectionPalette = {
            overlay: {
                selected: {
                    fill: this.theme.selectionFill,
                    border: this.theme.selectionBorder
                },
                subtracting: {
                    fill: new Color(this.theme.selectionFill, this.theme.selectionFill.a * 0.5),
                    border: this.theme.selectionSubtractBorder
                },
                preview: {
                    fill: null,
                    border: this.theme.selectionPreviewBorder
                },
                reactive: {
                    fill: null,
                    border: this.theme.selectionReactiveBorder
                }
            },
            vertex: {
                selected: this.theme.vertexFill,
                subtracting: this.theme.selectionSubtractBorder,
                preview: new Color(this.theme.vertexFill, this.theme.vertexFill.a * 0.5),
                reactive: new Color(this.theme.vertexFill, this.theme.vertexFill.a * 0.5)
            }
        };
    }

    loadIcons() {
        this.loadColliderIcon();
        this.loadWaypointsIcon();
        this.loadVertexIcon();
        for (const spawnType of SpawnTeam.names()) {
            this.loadImageIcon("spawn-" + spawnType);
        }
    }

    loadColliderIcon() {
        this.icons["collider"] = this.context.createTexture(512, 512, gradientCircle());
    }

    loadWaypointsIcon() {
        const size = cfg("editor.waypoint-size");
        const fn = rectangle(1, new Color("#ffffff.3f"), new Color("#fff"));
        this.icons["waypoints"] = this.context.createTexture(size, size, fn);
        this.icons["waypoints"].setNearestFilter(true);
    }

    loadVertexIcon() {
        const size = cfg("editor.vertex-size");
        const fn = rectangle(1, new Color("#fff"), new Color("#000"));
        this.icons["vertex"] = this.context.createTexture(size, size, fn);
        this.icons["vertex"].setNearestFilter(true);
    }

    loadImageIcon(name) {
        const image = new Image();
        image.src = "res/" + name + ".png";
        image.addEventListener("load", () => {
            const imageData = processImage(image, { premultiply: true });
            this.icons[name] = this.context.createTexture(imageData);
            this.icons[name].setNearestFilter(true);
            Renderer.iconsInfo[name] = {
                width: imageData.width,
                height: imageData.height,
                radius: imageData.data.length >= 3 && imageData.data[3] < 255 ? imageData.width / 2 : 0
            };
            this.redraw();
        });
    }

    onSettingChange(setting) {
        switch (setting) {
            case "editor.vertex-size": this.loadVertexIcon(); break;
            case "editor.waypoint-size": this.loadWaypointsIcon(); break;
            case "app.library-url":
            case "app.library-index": {
                for (const node of [...this.textures.keys()]) {
                    if (Path.mount(node.path) === "library") {
                        this.disposeNodeResources(node);
                    }
                }
                break;
            }
        }
        this.redraw();
    }

    onResourceNodeAttrChange(event) {
        if (event.attribute === "src" || event.attribute === "color-key") {
            this.disposeNodeResources(event.target);
        }
    }

    disposeNodeResources(node) {
        const texture = this.textures.get(node);
        if (texture) {
            node.off("attributechange", this.onResourceNodeAttrChange);
            this.textures.delete(node);
            this.texturesInfo.delete(node);
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
            node.on("attributechange", this.onResourceNodeAttrChange);
            this.textures.set(node, texture = this.context.defaultTexture);
            this.texturesInfo.set(node, { width: 0, height: 0 });

            const path = node.path;

            if (path) {
                File.readImage(path, image => {
                    if (image && path === node.path) {
                        const imageData = processImage(image, {
                            premultiply: true,
                            padding: node instanceof ImageNode,
                            colorKey: node.attr("color-key"),
                            npot: node instanceof TextureNode
                        });

                        const texture = this.context.createTexture(imageData);
                        texture.setRepeat(node instanceof TextureNode);
                        this.textures.set(node, texture);
                        this.texturesInfo.set(node, { width: image.width, height: image.height });
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
        if (canvas.width !== this.editor.width || canvas.height !== this.editor.height) {
            canvas.width = this.editor.width;
            canvas.height = this.editor.height;
        }
    }

    draw() {
        if (this.editor) {
            const renderLayers = {
                map: [],
                icons: [],
                waypoints: [],
                selectionOverlay: [],
                selectionVertices: [],
                previewOutlines: [],
                previewVertices: [],
            };

            this.batch.clear();
            this.loadThemeColors();
            this.updateCanvasSize();
            this.sortNodes(this.editor.map, renderLayers);
            this.drawBackground();
            this.drawNodes(renderLayers.map);
            this.drawWireframe(renderLayers.map);
            this.drawNodes(renderLayers.icons);
            this.drawGrid();
            this.drawNodes(renderLayers.waypoints);
            this.drawSelection(renderLayers.selectionOverlay);
            this.drawSelection(renderLayers.selectionVertices);
            this.drawPreview(renderLayers.previewOutlines);
            this.drawPreview(renderLayers.previewVertices);
            this.drawSelectionRect();
            this.drawTools();
            this.drawGuides();
            this.context.clear(this.theme.background);
            this.context.draw(this.batch, this.editor.view.transform);
        }
    }

    isVertex(node) {
        return (node instanceof VertexNode) || (node instanceof PivotNode);
    }

    sortNodes(parentNode, renderLayers) {
        for (const node of parentNode.children()) {
            if (node.visible) {
                switch (node.constructor) {
                    case TriangleNode:
                    case SceneryNode: renderLayers.map.push(node); break;
                    case SpawnNode:
                    case ColliderNode: renderLayers.icons.push(node); break;
                    case WaypointNode:
                    case ConnectionNode: renderLayers.waypoints.push(node); break;
                }

                if (this.editor.selection.has(node)) {
                    if (this.isVertex(node)) {
                        renderLayers.selectionVertices.push(node);
                    } else {
                        renderLayers.selectionOverlay.push(node);
                        if ((node instanceof SceneryNode) && node.firstChild && !this.editor.selection.has(node.firstChild)) {
                            renderLayers.selectionVertices.push(node.firstChild);
                        }
                    }
                } else if (this.editor.preview.nodes.has(node) || (this.isVertex(node) && cfg("view.vertices"))) {
                    if (this.isVertex(node)) {
                        if (!(node instanceof PivotNode) || !this.editor.selection.has(node.parentNode)) {
                            renderLayers.previewVertices.push(node);
                        }
                    } else {
                        renderLayers.previewOutlines.push(node);
                    }
                }

                this.sortNodes(node, renderLayers);
            }
        }
    }

    drawGrid() {
        const view = this.editor.view;
        const x0 = view.x - view.width / 2;
        const x1 = view.x + view.width / 2;
        const y0 = view.y - view.height / 2;
        const y1 = view.y + view.height / 2;
        const px = 0.5 / view.scale;

        const fn = {
            x: (t, color) => [new Gfx.Vertex(t + px, y0, 0, 0, color), new Gfx.Vertex(t + px, y1, 0, 0, color)],
            y: (t, color) => [new Gfx.Vertex(x0, t + px, 0, 0, color), new Gfx.Vertex(x1, t + px, 0, 0, color)],
        };

        for (const line of this.editor.grid.lines()) {
            this.batch.add(Gfx.Lines, null, fn[line.axis](line.offset, line.color));
        }
    }

    drawBackground() {
        if (cfg("view.background")) {
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
    }

    rectVertices(x, y, w, h, color = new Color(255, 255, 255)) {
        const rect = new Rect(x, y, w, h);
        return [
            new Gfx.Vertex(rect.x0, rect.y0, 0, 0, color),
            new Gfx.Vertex(rect.x1, rect.y0, 1, 0, color),
            new Gfx.Vertex(rect.x1, rect.y1, 1, 1, color),
            new Gfx.Vertex(rect.x0, rect.y1, 0, 1, color)
        ];
    }

    pixelRectVertices(cx, cy, w, h, color) {
        const s = this.editor.view.scale;
        const dx = Math.floor(0.5 * w) / s;
        const dy = Math.floor(0.5 * h) / s;
        const p = this.editor.view.mapToPixelGrid(cx, cy);
        return this.rectVertices(p.x - dx, p.y - dy, w / s, h / s, color);
    }

    nodeVertices(node, color) {
        switch (node.constructor) {
            case TriangleNode: {
                const vertices = Array.from(node.children()).map(v => {
                    return new Gfx.Vertex(v.attr("x"), v.attr("y"), v.attr("u"), v.attr("v"), color || v.attr("color"));
                });
                return vertices;
            }

            case SceneryNode: {
                const vertices = node.computeVertices(this.texture(node.attr("image")));
                if (color) vertices.forEach(v => v.color.set(color));
                return vertices;
            }

            case SpawnNode: {
                const info = Renderer.iconInfo("spawn-" + node.attr("type"));
                return info && this.pixelRectVertices(node.attr("x"), node.attr("y"), info.width, info.height, color);
            }

            case ColliderNode: {
                const size = 2 * node.attr("radius") * this.editor.view.scale;
                return this.pixelRectVertices(node.attr("x"), node.attr("y"), size, size, color);
            }

            case WaypointNode: {
                const size = cfg("editor.waypoint-size");
                return this.pixelRectVertices(node.attr("x"), node.attr("y"), size, size, color);
            }

            case ConnectionNode: {
                if (node.parentNode) {
                    const a = node.parentNode;
                    const b = node.attr("waypoint");
                    const halfPixel = 0.5 / this.editor.view.scale;
                    const vertices = [
                        new Gfx.Vertex(a.attr("x"), a.attr("y"), 0, 0, color),
                        new Gfx.Vertex(b.attr("x"), b.attr("y"), 0, 0, color)
                    ];
                    vertices.forEach(v => {
                        const p = this.editor.view.mapToPixelGrid(v.x, v.y);
                        v.x = p.x + halfPixel;
                        v.y = p.y + halfPixel;
                    });
                    return vertices;
                }
            }

            default: return null;
        }
    }

    nodeSelVertices(node, color) {
        const vertices = this.nodeVertices(node, color);

        if (vertices) {
            const px = 1 / this.editor.view.scale;

            switch (node.constructor) {
                case ColliderNode:
                    [0, 3].forEach(i => vertices[i].x -= px);
                    [0, 1].forEach(i => vertices[i].y -= px);
                    vertices.forEach(v => Object.assign(v, this.editor.view.mapToPixelGrid(v.x, v.y)));
                    break;

                case SpawnNode:
                case WaypointNode: {
                    [1, 2].forEach(i => vertices[i].x -= px);
                    [2, 3].forEach(i => vertices[i].y -= px);
                    break;
                }

                case TriangleNode:
                case SceneryNode:
                    vertices.forEach(v => Object.assign(v, this.editor.view.mapToPixelGrid(v.x, v.y)));
                    break;
            }

            if (vertices.length > 2) {
                vertices.forEach(v => {
                    v.x += 0.5 * px;
                    v.y += 0.5 * px;
                });
            }
        }

        return vertices;
    }

    drawNodes(nodes) {
        for (const node of nodes) {
            this.drawNode(node);
        }
    }

    drawNode(node) {
        switch (node.constructor) {
            case TriangleNode: {
                const vertices = this.nodeVertices(node);
                if (vertices.length === 3) {
                    if (cfg("view.polygons") === "texture") {
                        this.batch.add(Gfx.Triangles, this.texture(node.attr("texture")), vertices);
                    } else if (cfg("view.polygons") === "plain") {
                        this.batch.add(Gfx.Triangles, this.context.whiteTexture, vertices);
                    }
                }
                break;
            }

            case SceneryNode:
                this.drawSprite(node, this.texture(node.attr("image")), null);
                break;

            case ColliderNode:
                this.batch.addQuad(this.icons["collider"], this.nodeVertices(node, new Color(255, 0, 0)));
                break;

            case SpawnNode:
                this.drawSprite(node, this.icons["spawn-" + node.attr("type")], new Color(255, 255, 255));
                break;

            case WaypointNode:
                this.drawSprite(node, this.icons["waypoints"], this.theme.waypointColor);
                break;

            case ConnectionNode: {
                const vertices = this.nodeVertices(node, this.theme.waypointColor);
                if (vertices) this.batch.add(Gfx.Lines, null, vertices);
                break;
            }
        }
    }

    drawSprite(node, texture, color) {
        const vertices = this.nodeVertices(node, color);
        if (texture && vertices) this.batch.addQuad(texture, vertices);
    }

    drawWireframe(nodes) {
        if (cfg("view.wireframe")) {
            for (const node of nodes) {
                this.drawNodeWireframe(node);
            }
        }
    }

    drawNodeWireframe(node) {
        const vertices = this.nodeSelVertices(node);
        if (vertices) {
            vertices.forEach(v => v.color.a = 255);
            this.drawLineLoop(vertices, null);
        }
    }

    drawPreview(nodes) {
        this.drawSelection(nodes, true);
    }

    drawSelection(nodes, preview = false) {
        for (const node of nodes) {
            this.drawNodeSelection(node, preview);
        }
    }

    drawNodeSelection(node, preview) {
        let color;

        if (this.isVertex(node)) {
            if (color = this.chooseSelectionColor(node, this.theme.selectionPalette.vertex, preview)) {
                if ((node instanceof VertexNode) && this.editor.selection.has(node)) {
                    const prev = node.previousSibling || (node.parentNode && node.parentNode.lastChild);
                    const next = node.nextSibling || (node.parentNode && node.parentNode.firstChild);
                    if (prev && prev !== node) this.drawVertexLine(node, prev);
                    if (next && next !== node && next !== prev) this.drawVertexLine(node, next);
                }

                this.drawVertex(node.x, node.y, color);
            }
        } else {
            if (color = this.chooseSelectionColor(node, this.theme.selectionPalette.overlay, preview)) {
                const idx = [0, 1, 2, 2, 3, 0];
                const vtx = this.nodeSelVertices(node, color.fill || color.border, true);
                const vtxFill = vtx && (vtx.length === 3 ? vtx : vtx.length === 4 ? idx.map(i => vtx[i]) : null);
                if (vtxFill && color.fill) this.batch.add(Gfx.Triangles, null, vtxFill);
                if (vtx && color.border) this.drawLineLoop(vtx, color.border);
            }
        }
    }

    subtractingEnabled() {
        const sel = this.editor.toolset.select;
        return sel.activated && sel.mode === "subtract";
    }

    subtractingNode(node) {
        return this.subtractingEnabled() && this.editor.preview.nodes.has(node);
    }

    chooseSelectionColor(node, palette, preview) {
        if (preview) {
            if (!this.subtractingEnabled()) {
                if (this.editor.reactive.nodes.has(node)) {
                    return palette.reactive;
                } else {
                    return palette.preview;
                }
            }
        } else if (this.subtractingNode(node)) {
            return palette.subtracting;
        } else {
            return palette.selected;
        }
    }

    drawSelectionRect() {
        const sel = this.editor.toolset.select;
        if (sel.activated && sel.rect) {
            const p1 = this.editor.view.mapToPixelGrid(sel.rect.x0, sel.rect.y0);
            const p2 = this.editor.view.mapToPixelGrid(sel.rect.x1, sel.rect.y1);
            const rc = new Rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
            const halfPixel = 0.5 / this.editor.view.scale;
            rc.x += halfPixel;
            rc.y += halfPixel;
            this.drawRect(rc, this.theme.selectionRectFill, this.theme.selectionRectBorder);
        }
    }

    drawVertex(x, y, color) {
        const size = cfg("editor.vertex-size");
        const vertices = this.pixelRectVertices(x, y, size, size, color);
        this.batch.addQuad(this.icons["vertex"], vertices);
    }

    drawVertexLine(a, b) {
        const dx = b.attr("x") - a.attr("x");
        const dy = b.attr("y") - a.attr("y");
        const length = Math.hypot(dx, dy);
        const size = cfg("editor.vertex-size");
        const targetX = a.attr("x") + (length > 0 ? Math.min(length, 2 * size) * (dx / length) : 0);
        const targetY = a.attr("y") + (length > 0 ? Math.min(length, 2 * size) * (dy / length) : 0);
        this.batch.add(Gfx.Lines, null, [
            new Gfx.Vertex(a.attr("x"), a.attr("y"), 0, 0, this.theme.vertexBorder),
            new Gfx.Vertex(targetX, targetY, 0, 0, new Color(this.theme.vertexBorder, 0))
        ]);
    }

    drawTools() {
        const tool = this.editor.toolset.currentTool;
        if (tool.activated && (tool instanceof CreateTool) && tool.handle.visible) {
            this.drawNode(tool.node);
            this.drawNodeWireframe(tool.node);
        }
    }

    drawGuides() {
        const view = this.editor.view;
        const tool = this.editor.toolset.currentTool;

        if (tool.activated && tool.handle && tool.handle.visible) {
            const color = tool.handle.snapResult ? this.theme.guidesSnap :
                tool.handle.active ? this.theme.guidesActive : this.theme.guides;

            const a = view.canvasToMap(0, 0);
            const b = { x: a.x + view.width, y: a.y + view.height }
            const p = this.editor.view.mapToPixelGrid(tool.handle.x, tool.handle.y);
            const halfPixel = 0.5 / this.editor.view.scale;
            p.x += halfPixel;
            p.y += halfPixel;

            this.batch.add(Gfx.Lines, null, [
                new Gfx.Vertex(p.x, a.y, 0, 0, color),
                new Gfx.Vertex(p.x, b.y, 0, 0, color),
                new Gfx.Vertex(a.x, p.y, 0, 0, color),
                new Gfx.Vertex(b.x, p.y, 0, 0, color),
            ]);
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
            vertices.forEach(vertex => vertex.color.set(color));
        }

        if (vertices.length === 2) {
            this.batch.add(Gfx.Lines, null, vertices);
        } else {
            for (let n = vertices.length, i = n - 1, j = 0; j < n; i = j++) {
                this.batch.add(Gfx.Lines, null, [vertices[i], vertices[j]]);
            }
        }
    }
}
