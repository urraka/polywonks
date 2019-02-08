import * as PMS from "../pms/pms.js";
import * as Geometry from "../support/geometry.js";
import { Color } from "../support/color.js";
import { Matrix } from "../support/matrix.js";
import { Sprite } from "../gfx/gfx.js";
import { Node } from "./node.js";
import { LayerType, LayerNode } from "./layer.js";
import { Attribute } from "./attribute.js";
import { ExportMode } from "../settings.js";
import { PivotNode } from "./pivot.js";

export class SceneryNode extends Node {
    constructor() {
        super();
        this.attributes.set("image", new Attribute("node", null));
        this.attributes.set("x", new Attribute("float", 0));
        this.attributes.set("y", new Attribute("float", 0));
        this.attributes.set("width", new Attribute("float", 0));
        this.attributes.set("height", new Attribute("float", 0));
        this.attributes.set("rotation", new Attribute("angle", 0));
        this.attributes.set("color", new Attribute("color", new Color(255, 255, 255)));
    }

    get nodeName() {
        return "scenery";
    }

    get pivotX() {
        if (this.firstChild) {
            const value = this.firstChild.attr("offsetX");
            return this.attr("width") >= 0 ? value : -value;
        }
        return 0;
    }

    get pivotY() {
        if (this.firstChild) {
            const value = this.firstChild.attr("offsetY");
            return this.attr("height") >= 0 ? value : -value;
        }
        return 0;
    }

    static fromPMS(prop, imageNodes, version) {
        let offset = { x: 0, y: 0 };

        if (version === ExportMode.Soldat171) {
            offset = Matrix.translate(0, 1)
                .multiply(Matrix.rotate(prop.rotation))
                .multiply(Matrix.translate(0, -1))
                .multiply({ x: 0, y: 0 });
        }

        const node = new SceneryNode();
        node.append(new PivotNode());
        node.attr("image", imageNodes[prop.style - 1]);
        node.attr("x", prop.x + offset.x);
        node.attr("y", prop.y + offset.y);
        node.attr("width", prop.width * prop.scaleX);
        node.attr("height", prop.height * prop.scaleY);
        node.attr("rotation", prop.rotation);
        node.attr("color", new Color(prop.color, prop.alpha));
        return node;
    }

    toPMS(imageNodes, version) {
        const topleft = Matrix.transform(
                this.attr("x"),
                this.attr("y"),
                this.pivotX,
                this.pivotY,
                1, 1,
                this.attr("rotation")
            ).multiply({ x: 0, y: 0 });

        let offset = { x: 0, y: 0 };

        if (version === ExportMode.Soldat171) {
            offset = Matrix.translate(0, 1)
                .multiply(Matrix.rotate(this.attr("rotation")))
                .multiply(Matrix.translate(0, -1))
                .multiply({ x: 0, y: 0 });
        }

        const layerTypes = [
            LayerType.SceneryBack,
            LayerType.SceneryMiddle,
            LayerType.SceneryFront
        ];

        const layer = [...this.filter(this.ancestors(), LayerNode)][0];
        const layerType = layer ? LayerType.value(layer.attr("type")) : -1;
        const image = this.attr("image");
        const imageIndex = imageNodes.indexOf(image);

        const prop = new PMS.Prop();
        prop.active = true;
        prop.style = imageIndex + 1;
        prop.width = image ? image.attr("width") : this.attr("width");
        prop.height = image ? image.attr("height") : this.attr("height");
        prop.x = topleft.x - offset.x;
        prop.y = topleft.y - offset.y;
        prop.rotation = this.attr("rotation");
        prop.scaleX = image ? this.attr("width") / image.attr("width") : 1;
        prop.scaleY = image ? this.attr("height") / image.attr("height") : 1;
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
            this.pivotX,
            this.pivotY,
            1, 1,
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
