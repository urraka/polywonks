import * as PMS from "../pms/pms.js";
import { cfg, ExportMode } from "../app/settings.js";
import { Rect } from "../common/rect.js";
import { Color } from "../common/color.js";
import { ValueType } from "../common/type.js";
import { Path } from "../common/path.js";
import { iter } from "../common/iter.js";
import { Attribute } from "./attribute.js";
import { Node } from "./node.js";
import { ResourcesNode } from "./resources.js";
import { LayerNode, LayerType } from "./layer.js";
import { TriangleNode } from "./triangle.js";
import { TextureNode } from "./texture.js";
import { ImageNode } from "./image.js";
import { SceneryNode } from "./scenery.js";
import { PivotNode } from "./pivot.js";
import { ColliderNode } from "./collider.js";
import { SpawnNode } from "./spawn.js";
import { WaypointNode } from "./waypoint.js";
import { VertexNode } from "./vertex.js";
import { ConnectionNode } from "./connection.js";

function createDefaultLayers() {
    const resources = new ResourcesNode();
    resources.attr("text", "Resources");

    return (list => {
        const layers = {};
        list.forEach(([key, layer]) => layers[key] = layer);
        layers[Symbol.iterator] = Array.prototype[Symbol.iterator].bind(list.map(([, layer]) => layer));
        return layers;
    })([
        ["resources", resources],
        ["backgroundPolygons", new LayerNode("Background Polygons", LayerType.PolygonsBack)],
        ["backgroundScenery", new LayerNode("Background Scenery", LayerType.SceneryBack)],
        ["middleScenery", new LayerNode("Middle Scenery", LayerType.SceneryMiddle)],
        ["frontPolygons", new LayerNode("Front Polygons", LayerType.PolygonsFront)],
        ["frontScenery", new LayerNode("Front Scenery", LayerType.SceneryFront)],
        ["colliders", new LayerNode("Colliders", LayerType.Colliders)],
        ["waypoints", new LayerNode("Waypoints", LayerType.Waypoints)],
        ["spawns", new LayerNode("Spawns", LayerType.Spawns)],
    ]);
}

export class MapDocument extends Node {
    constructor() {
        super();

        this.owner = this;
        this.path = "";
        this.nextId = {};

        this.attributes.set("description", new Attribute("string", ""));
        this.attributes.set("color-top", new Attribute("color", new Color(cfg("map.color-top"))));
        this.attributes.set("color-bottom", new Attribute("color", new Color(cfg("map.color-bottom"))));
        this.attributes.set("jet", new Attribute("int16", cfg("map.jet")));
        this.attributes.set("grenades", new Attribute("uint8", cfg("map.grenades")));
        this.attributes.set("medikits", new Attribute("uint8", cfg("map.medikits")));
        this.attributes.set("weather", new Attribute(PMS.WeatherType, cfg("map.weather")));
        this.attributes.set("steps", new Attribute(PMS.StepsType, cfg("map.steps")));
    }

    get nodeName() {
        return "map";
    }

    get resources() {
        return this._resources || (this._resources = iter(this.children("resources")).first());
    }

    get waypoints() {
        return this._waypoints || (this._waypoints =
            iter(this.children("layer")).find(node => node.attr("type") === "waypoints")
        );
    }

    generateId(nodeName) {
        this.nextId[nodeName] = this.nextId[nodeName] || (this.nextId[nodeName] = 0);
        return `${nodeName}#${this.nextId[nodeName]++}`;
    }

    static default() {
        const doc = new MapDocument();
        doc.attr("text", "Untitled");
        iter(createDefaultLayers()).each(layer => doc.append(layer));
        return doc;
    }

    static fromPMS(pms, path = "") {
        const doc = new MapDocument();
        doc.path = path;
        doc.attr("text", Path.replaceExtension(Path.filename(path), "") || pms.name || "Map");
        doc.attr("description", pms.name);
        doc.attr("color-top", new Color(pms.backgroundColorTop));
        doc.attr("color-bottom", new Color(pms.backgroundColorBottom));
        doc.attr("jet", pms.jetAmount);
        doc.attr("grenades", pms.grenades);
        doc.attr("medikits", pms.medikits);
        doc.attr("weather", pms.weather);
        doc.attr("steps", pms.steps);

        const layers = createDefaultLayers();
        iter(layers).each(layer => doc.append(layer));

        const texture = TextureNode.fromPMS(pms, path, pms.polygons);
        layers.resources.append(texture);

        for (const polygon of pms.polygons) {
            if (polygon.type === PMS.PolyType.Background || polygon.type === PMS.PolyType.BackgroundTransition) {
                layers.backgroundPolygons.append(TriangleNode.fromPMS(polygon, texture));
            } else {
                layers.frontPolygons.append(TriangleNode.fromPMS(polygon, texture));
            }
        }

        const imageNodes = pms.scenery.map((s, i) => ImageNode.fromPMS(s, path, i, pms.props));
        imageNodes.forEach(node => node && node.appendTo(layers.resources));

        const sceneryLayers = [
            layers.backgroundScenery,
            layers.middleScenery,
            layers.frontScenery
        ];

        pms.props.filter(prop => {
            return prop.active && sceneryLayers[prop.level] && imageNodes[prop.style - 1];
        }).forEach(prop => {
            sceneryLayers[prop.level].append(SceneryNode.fromPMS(prop, imageNodes, pms.version));
        });

        const colliders = pms.colliders.map(collider => ColliderNode.fromPMS(collider));
        colliders.forEach(node => node.appendTo(layers.colliders));

        const spawns = pms.spawns.map(spawn => SpawnNode.fromPMS(spawn));
        spawns.forEach(node => node.appendTo(layers.spawns));

        const waypoints = pms.waypoints.map(() => new WaypointNode());
        waypoints.forEach((node, i) => node.fromPMS(pms.waypoints[i], waypoints));
        waypoints.forEach(node => node.appendTo(layers.waypoints));

        return doc;
    }

    toPMS() {
        const pms = new PMS.Map();

        // find the most used texture and export pms with that
        const textures = [...this.resources.children("texture")];
        if (textures.length > 1) {
            const counters = new Map();
            for (const node of this.descendants("triangle")) {
                const texture = node.attr("texture");
                if (texture) {
                    const n = (counters.get(texture) || 0) + 1;
                    counters.set(texture, n);
                }
            }
            textures.sort((a, b) => (counters.get(a) || 0) - (counters.get(b) || 0));
        }
        if (textures.length > 0) {
            const texture = textures.pop();
            pms.texture = texture.attr("export-name") || Path.filename(texture.attr("src"));
        }

        // find scenery images that are used
        let imageNodes = new Set();
        for (const node of this.descendants("scenery")) {
            if (node.attr("image")) {
                imageNodes.add(node.attr("image"));
            }
        }
        imageNodes = [...imageNodes];

        pms.version = ExportMode.value(cfg("app.export-mode"));
        pms.name = this.attr("description");
        pms.backgroundColorTop = new Color(this.attr("color-top"));
        pms.backgroundColorBottom = new Color(this.attr("color-bottom"));
        pms.jetAmount = this.attr("jet");
        pms.grenades = this.attr("grenades");
        pms.medikits = this.attr("medikits");
        pms.weather = PMS.WeatherType.value(this.attr("weather"));
        pms.steps = PMS.StepsType.value(this.attr("steps"));

        if (pms.version === ExportMode.Soldat171) {
            pms.randId = -0x80000000 + Math.trunc(Math.random() * 0x80000000);
        } else {
            pms.randId = Math.trunc(Math.random() * 0x80000000);
        }

        pms.polygons = iter(this.descendants("triangle")).map(node => node.toPMS());
        pms.scenery = imageNodes.map(node => node.toPMS());
        pms.props = iter(this.descendants("scenery")).map(node => node.toPMS(imageNodes, pms.version));
        pms.colliders = iter(this.descendants("collider")).map(node => node.toPMS());
        pms.spawns = iter(this.descendants("spawn")).map(node => node.toPMS());

        const waypointNodes = [...this.descendants("waypoint")];
        pms.waypoints = waypointNodes.map(node => node.toPMS(waypointNodes));

        // All positions have to be centered before calculating sectors.

        const bounds = this.verticesBounds();
        const cx = bounds.centerX;
        const cy = bounds.centerY;

        const applyOffset = (object => (object.x -= cx, object.y -= cy));
        pms.polygons.forEach(poly => poly.vertices.forEach(applyOffset));
        pms.props.forEach(applyOffset);
        pms.colliders.forEach(applyOffset);
        pms.spawns.forEach(applyOffset);
        pms.waypoints.forEach(applyOffset);

        pms.numSectors = 25;
        pms.sectorsDivision = PMS.sectorsDivision(bounds);
        pms.sectors = PMS.generateSectors(pms);

        return pms;
    }

    verticesBounds() {
        const first = iter(this.descendants("vertex")).first();
        const bounds = first ? new Rect(first.attr("x"), first.attr("y")) : new Rect();

        for (const node of this.descendants("vertex")) {
            bounds.expandToPoint(node.attr("x"), node.attr("y"));
        }

        return bounds;
    }

    backgroundBounds() {
        const bounds = this.verticesBounds();
        const d = 25 * Math.max(PMS.sectorsDivision(bounds), Math.ceil(0.5 * 480 / 25));
        return new Rect(bounds.centerX - d, bounds.centerY - d, 2 * d, 2 * d);
    }

    clone() {
        return MapDocument.unserialize(this.serialize(), this.path);
    }

    serialize() {
        const serializeNode = (node, level = 0) => {
            return `${"  ".repeat(level)}<` + node.nodeName +
                (node.id !== null ? ` id="${node.id}"` : "") +
                [...node.attributes.entries()].reduce((accum, [key, { dataType, value }]) => {
                    if (dataType === "node" && value !== null) {
                        return accum + " " + `${key}="${value.id}"`;
                    } else {
                        return accum + " " + `${key}="${ValueType.toString(dataType, value)
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/"/g, "&quot;")}"`;
                    }
                }, "") +
                (!node.firstChild ? "/>" : ">\n" +
                    iter(node.children()).map(node => serializeNode(node, level + 1)).join("\n") +
                    `\n${"  ".repeat(level)}</${node.nodeName}>`);
        };

        return serializeNode(this);
    }

    static unserialize(data, path = "") {
        const xml = new DOMParser().parseFromString(data, "application/xml");

        if (xml.documentElement.tagName !== "map") {
            return null;
        }

        const constructNode = element => {
            switch (element.tagName) {
                case "map": return new MapDocument();
                case "resources": return new ResourcesNode();
                case "texture": return new TextureNode();
                case "image": return new ImageNode();
                case "layer": return new LayerNode();
                case "triangle": return new TriangleNode();
                case "vertex": return new VertexNode();
                case "scenery": return new SceneryNode();
                case "pivot": return new PivotNode();
                case "collider": return new ColliderNode();
                case "spawn": return new SpawnNode();
                case "waypoint": return new WaypointNode();
                case "connection": return new ConnectionNode();
            }
        };

        const nodesById = new Map();
        const nodesByElement = new Map();

        const constructTree = element => {
            const node = constructNode(element);
            const id = element.getAttribute("id") || null;
            nodesByElement.set(element, node);
            nodesById.set(id, node);
            for (const childElement of element.children) {
                node.append(constructTree(childElement));
            }
            node.id = id;
            return node;
        };

        const readAttributes = element => {
            const node = nodesByElement.get(element);
            for (const name of element.getAttributeNames()) {
                if (node.attributes.has(name)) {
                    const strval = element.getAttribute(name);
                    const attr = node.attributes.get(name);
                    if (attr.dataType === "node") {
                        if (strval) {
                            attr.value = nodesById.get(strval);
                        }
                    } else {
                        attr.value = ValueType.fromString(attr.dataType, strval);
                    }
                }
            }
            for (const childElement of element.children) {
                readAttributes(childElement);
            }
        };

        const doc = constructTree(xml.documentElement);
        readAttributes(xml.documentElement);
        doc.path = path;
        doc.nextId = {};

        // sort out ids

        let match = null;
        const reByName = {};
        const missingIdQueue = [];

        for (const node of doc.descendants()) {
            const re = reByName[node.nodeName] || (reByName[node.nodeName] = new RegExp(`^${node.nodeName}#(\\d+)$`));
            if (node.id && (match = re.exec(node.id))) {
                doc.nextId[node.nodeName] = doc.nextId[node.nodeName] || (doc.nextId[node.nodeName] = 0);
                doc.nextId[node.nodeName] = Math.max(doc.nextId[node.nodeName], match[1] + 1);
            } else {
                node.id = null;
                missingIdQueue.push(node);
            }
        }

        for (const node of missingIdQueue) {
            node.id = doc.generateId(node.nodeName);
        }

        return doc;
    }
}
