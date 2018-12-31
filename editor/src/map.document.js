import * as PMS from "./pms.js";
import { cfg } from "./settings.js";
import { Enum } from "./enum.js";
import { Rect } from "./rect.js";
import { Color } from "./color.js";
import { Node } from "./map.node.js";
import { LayerNode, LayerType } from "./map.node.layer.js";
import { TriangleNode } from "./map.node.triangle.js";
import { TextureNode } from "./map.node.texture.js";
import { ImageNode } from "./map.node.image.js";
import { SceneryNode } from "./map.node.scenery.js";
import { ColliderNode } from "./map.node.collider.js";
import { SpawnNode } from "./map.node.spawn.js";
import { WaypointNode } from "./map.node.waypoint.js";
import { VertexNode } from "./map.node.vertex.js";
import { ConnectionNode } from "./map.node.connection.js";

export class MapDocument extends Node {
    constructor() {
        super("map");

        this.owner = this;
        this.path = "";
        this.iconsInfo = {};

        this.attributes.set("text", "Map");
        this.attributes.set("description", "");
        this.attributes.set("color-top", new Color(cfg("map.color-top")));
        this.attributes.set("color-bottom", new Color(cfg("map.color-bottom")));
        this.attributes.set("jet", cfg("map.jet"));
        this.attributes.set("grenades", cfg("map.grenades"));
        this.attributes.set("medikits", cfg("map.medikits"));
        this.attributes.set("weather", cfg("map.weather"));
        this.attributes.set("steps", cfg("map.steps"));
    }

    static fromPMS(pms, path = "") {
        const doc = new MapDocument();
        doc.path = path;
        doc.attr("text", pms.name.split(" ")[0]);
        doc.attr("description", pms.name);
        doc.attr("color-top", new Color(pms.backgroundColorTop));
        doc.attr("color-bottom", new Color(pms.backgroundColorBottom));
        doc.attr("jet", pms.jetAmount);
        doc.attr("grenades", pms.grenades);
        doc.attr("medikits", pms.medikits);
        doc.attr("weather", Enum.valueToName(PMS.WeatherType, pms.weather));
        doc.attr("steps", Enum.valueToName(PMS.StepsType, pms.steps));

        const layers = {
            resources: new LayerNode("Resources", LayerType.Resources),
            backgroundPolygons: new LayerNode("Background polygons", LayerType.PolygonsBack),
            backgroundScenery: new LayerNode("Background scenery", LayerType.SceneryBack),
            middleScenery: new LayerNode("Middle scenery", LayerType.SceneryMiddle),
            frontPolygons: new LayerNode("Front polygons", LayerType.PolygonsFront),
            frontScenery: new LayerNode("Front scenery", LayerType.SceneryFront),
            colliders: new LayerNode("Colliders", LayerType.Colliders),
            waypoints: new LayerNode("Waypoints", LayerType.Waypoints),
            spawns: new LayerNode("Spawns", LayerType.Spawns)
        };

        doc.append(layers.resources);
        doc.append(layers.backgroundPolygons);
        doc.append(layers.backgroundScenery);
        doc.append(layers.middleScenery);
        doc.append(layers.frontPolygons);
        doc.append(layers.frontScenery);
        doc.append(layers.colliders);
        doc.append(layers.waypoints);
        doc.append(layers.spawns);

        const texture = TextureNode.fromPMS(pms, path);
        layers.resources.append(texture);

        for (const polygon of pms.polygons) {
            if (polygon.type === PMS.PolyType.Background || polygon.type === PMS.PolyType.BackgroundTransition) {
                layers.backgroundPolygons.append(TriangleNode.fromPMS(polygon, texture));
            } else {
                layers.frontPolygons.append(TriangleNode.fromPMS(polygon, texture));
            }
        }

        const imageNodes = pms.scenery.map(s => ImageNode.fromPMS(s, path));
        imageNodes.forEach(node => node.appendTo(layers.resources));

        const sceneryLayers = [
            layers.backgroundScenery,
            layers.middleScenery,
            layers.frontScenery
        ];

        pms.props.filter(prop => {
            return prop.active && sceneryLayers[prop.level] && imageNodes[prop.style - 1];
        }).forEach(prop => {
            sceneryLayers[prop.level].append(SceneryNode.fromPMS(prop, imageNodes));
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
        const textures = [...this.filter(this.descendants(), TextureNode)];
        if (textures.length > 1) {
            const counters = new Map();
            for (const node of this.filter(this.descendants(), TriangleNode)) {
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
            pms.texture = texture.attr("export-name") || texture.attr("src").split("/").pop();
        }

        // find scenery images that are used
        let imageNodes = new Set();
        for (const node of this.filter(this.descendants(), SceneryNode)) {
            if (node.attr("image")) {
                imageNodes.add(node.attr("image"));
            }
        }
        imageNodes = [...imageNodes];

        pms.version = 11;
        pms.name = this.attr("description");
        pms.backgroundColorTop = new Color(this.attr("color-top"));
        pms.backgroundColorBottom = new Color(this.attr("color-bottom"));
        pms.jetAmount = this.attr("jet");
        pms.grenades = this.attr("grenades");
        pms.medikits = this.attr("medikits");
        pms.weather = Enum.nameToValue(PMS.WeatherType, this.attr("weather"));
        pms.steps = Enum.nameToValue(PMS.StepsType, this.attr("steps"));
        pms.randId = Math.trunc(Math.random() * 0xffffffff);

        pms.polygons = [...this.filter(this.descendants(), TriangleNode)].map(node => node.toPMS());
        pms.scenery = imageNodes.map(node => node.toPMS());
        pms.props = [...this.filter(this.descendants(), SceneryNode)].map(node => node.toPMS(imageNodes));
        pms.colliders = [...this.filter(this.descendants(), ColliderNode)].map(node => node.toPMS());
        pms.spawns = [...this.filter(this.descendants(), SpawnNode)].map(node => node.toPMS());

        const waypointNodes = [...this.filter(this.descendants(), WaypointNode)];
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
        const iterator = this.filter(this.descendants(), VertexNode);
        const first = iterator.next().value;
        const bounds = first ? new Rect(first.attr("x"), first.attr("y")) : new Rect();

        for (const node of iterator) {
            bounds.expandToPoint(node.attr("x"), node.attr("y"));
        }

        return bounds;
    }

    backgroundBounds() {
        const bounds = this.verticesBounds();
        const d = 25 * Math.max(PMS.sectorsDivision(bounds), Math.ceil(0.5 * 480 / 25));
        return new Rect(bounds.centerX - d, bounds.centerY - d, 2 * d, 2 * d);
    }

    serialize() {
        const nodeId = new Map();
        const nodeTypeCount = {};

        for (const node of this.tree()) {
            for (const [, value] of node.attributes) {
                if (value instanceof Node) {
                    if (!nodeId.has(value)) {
                        const name = value.nodeName;
                        nodeTypeCount[name] = nodeTypeCount[name] || 0;
                        nodeId.set(value, name + "#" + nodeTypeCount[name]);
                        nodeTypeCount[name]++;
                    }
                }
            }
        }

        const serializeNode = (node, level = 0) => {
            return `${"  ".repeat(level)}<` + node.nodeName +
                (nodeId.has(node) ? ` id="${nodeId.get(node)}"` : "") +
                [...node.attributes.entries()].reduce((accum, [key, value]) => {
                    if (value instanceof Node) {
                        return accum + " " + `${key}="${nodeId.get(value)}"`;
                    } else {
                        return accum + " " + `${key}="${value.toString()
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/"/g, "&quot;")}"`;
                    }
                }, "") +
                (!node.firstChild ? "/>" : ">\n" +
                    [...node.children()].map(node => serializeNode(node, level + 1)).join("\n") +
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
                case "texture": return new TextureNode();
                case "image": return new ImageNode();
                case "layer": return new LayerNode();
                case "triangle": return new TriangleNode();
                case "vertex": return new VertexNode();
                case "scenery": return new SceneryNode();
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
            nodesByElement.set(element, node);
            nodesById.set(element.getAttribute("id"), node);
            for (const childElement of element.children) {
                node.append(constructTree(childElement));
            }
            return node;
        };

        const readAttributes = element => {
            const node = nodesByElement.get(element);
            for (const name of element.getAttributeNames()) {
                if (node.attributes.has(name)) {
                    const value = element.getAttribute(name);
                    const defaultValue = node.attributes.get(name);

                    if (defaultValue === null) {
                        node.attributes.set(name, nodesById.get(value));
                    } else if (defaultValue instanceof Color) {
                        node.attributes.set(name, new Color(value));
                    } else if (typeof defaultValue === "boolean") {
                        node.attributes.set(name, value === "true" ? true : false);
                    } else if (typeof defaultValue === "number") {
                        node.attributes.set(name, Number(value));
                    } else {
                        node.attributes.set(name, value);
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
        return doc;
    }
}
