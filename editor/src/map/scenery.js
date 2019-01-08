import * as PMS from "../pms/pms.js";
import * as Geometry from "../support/geometry.js";
import { Color } from "../support/color.js";
import { Matrix } from "../support/matrix.js";
import { Sprite } from "../gfx/gfx.js";
import { Node } from "./node.js";
import { LayerType, LayerNode } from "./layer.js";
import { Attribute } from "./attribute.js";

export class SceneryNode extends Node {
    constructor() {
        super("scenery");
        this.attributes.get("text").value = "Scenery";
        this.attributes.set("image", new Attribute("node", null));
        this.attributes.set("x", new Attribute("float", 0));
        this.attributes.set("y", new Attribute("float", 0));
        this.attributes.set("width", new Attribute("float", 0));
        this.attributes.set("height", new Attribute("float", 0));
        this.attributes.set("centerX", new Attribute("float", 0));
        this.attributes.set("centerY", new Attribute("float", 0));
        this.attributes.set("scaleX", new Attribute("float", 0));
        this.attributes.set("scaleY", new Attribute("float", 0));
        this.attributes.set("rotation", new Attribute("float", 0));
        this.attributes.set("color", new Attribute("color", new Color(255, 255, 255)));
    }

    static fromPMS(prop, imageNodes) {
        // It is very unfortunate but soldat does rotation of scenery with
        // an offset of 1 unit on Y axis. Polyworks doesn't know about it
        // so rotated scenery has been off by about 1px all along.
        const offset = Matrix.translate(0, 1)
            .multiply(Matrix.rotate(-prop.rotation))
            .multiply(Matrix.translate(0, -1))
            .multiply({ x: 0, y: 0 });

        const node = new SceneryNode();
        node.attr("image", imageNodes[prop.style - 1]);
        node.attr("x", prop.x + offset.x);
        node.attr("y", prop.y + offset.y);
        node.attr("width", prop.width);
        node.attr("height", prop.height);
        node.attr("scaleX", prop.scaleX);
        node.attr("scaleY", prop.scaleY);
        node.attr("rotation", -prop.rotation);
        node.attr("color", new Color(prop.color, prop.alpha));
        return node;
    }

    toPMS(imageNodes) {
        const transform = Matrix.transform(
            this.attr("x"),
            this.attr("y"),
            this.attr("centerX"),
            this.attr("centerY"),
            this.attr("scaleX"),
            this.attr("scaleY"),
            this.attr("rotation")
        );

        const topleft = transform.multiply({ x: 0, y: 0 });

        const offset = Matrix.translate(0, 1)
            .multiply(Matrix.rotate(this.attr("rotation")))
            .multiply(Matrix.translate(0, -1))
            .multiply({ x: 0, y: 0 });

        const layerTypes = [
            LayerType.SceneryBack,
            LayerType.SceneryMiddle,
            LayerType.SceneryFront
        ];

        const layer = [...this.filter(this.ancestors(), LayerNode)][0];
        const layerType = layer ? LayerType.value(layer.attr("type")) : -1;

        const prop = new PMS.Prop();
        prop.active = true;
        prop.style = imageNodes.indexOf(this.attr("image")) + 1;
        prop.width = this.attr("width");
        prop.height = this.attr("height");
        prop.x = topleft.x - offset.x;
        prop.y = topleft.y - offset.y;
        prop.rotation = -this.attr("rotation");
        prop.scaleX = this.attr("scaleX");
        prop.scaleY = this.attr("scaleY");
        prop.alpha = this.attr("color").a;
        prop.color = this.attr("color");
        prop.level = layerTypes.indexOf(layerType);
        return prop;
    }

    computeVertices(texture = null) {
        let dx = 0, dy = 0;

        if (texture) {
            dx = 1 / texture.width;
            dy = 1 / texture.height;
        }

        const sprite = new Sprite(
            texture,
            this.attr("width"),
            this.attr("height"),
            dx, 1 - dx, dy, 1 - dy
        );

        const transform = Matrix.transform(
            this.attr("x"),
            this.attr("y"),
            this.attr("centerX"),
            this.attr("centerY"),
            this.attr("scaleX"),
            this.attr("scaleY"),
            this.attr("rotation")
        );

        return sprite.computeVertices(this.attr("color"), transform);
    }

    intersectsPoint(x, y) {
        const vertices = this.computeVertices();
        const triangle = [
            [0, 1, 2].reduce((accum, i) => (accum.push(vertices[i].x, vertices[i].y), accum), []),
            [2, 3, 0].reduce((accum, i) => (accum.push(vertices[i].x, vertices[i].y), accum), [])
        ];
        return Geometry.triangleContainsPoint(...triangle[0], x, y) ||
            Geometry.triangleContainsPoint(...triangle[1], x, y);
    }

    intersectsRect(x, y, w, h) {
        const vertices = this.computeVertices();
        const triangle = [
            [0, 1, 2].reduce((accum, i) => (accum.push(vertices[i].x, vertices[i].y), accum), []),
            [2, 3, 0].reduce((accum, i) => (accum.push(vertices[i].x, vertices[i].y), accum), [])
        ];
        return Geometry.rectIntersectsTriangle(x, y, w, h, ...triangle[0]) ||
            Geometry.rectIntersectsTriangle(x, y, w, h, ...triangle[1]);
    }

    containedByRect(x, y, w, h) {
        const vertices = this.computeVertices();
        return vertices.every(v => Geometry.rectContainsPoint(x, y, w, h, v.x, v.y));
    }
}
