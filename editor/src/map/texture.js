import * as xMath from "../common/math.js";
import { Color } from "../common/color.js";
import { Path } from "../common/path.js";
import { File } from "../app/file.js";
import { ResourceNode } from "./resource.js";
import { Attribute } from "./attribute.js";

export class TextureNode extends ResourceNode {
    constructor() {
        super();
        this.attributes.set("src", new Attribute("string", ""));
        this.attributes.set("export-name", new Attribute("string", ""));
        this.attributes.set("color-key", new Attribute("color", new Color()));
        this.attributes.set("width", new Attribute("float", 0));
        this.attributes.set("height", new Attribute("float", 0));
    }

    get nodeName() {
        return "texture";
    }

    static fromPMS(pms, path, polygons) {
        const node = new TextureNode();
        const dimensions = TextureNode.dimensionsFromPolygons(polygons);

        node.attr("src", "../textures/" + pms.texture);
        node.attr("export-name", pms.texture);
        node.attr("color-key", new Color(0, 255, 0));
        node.attr("width", dimensions.width);
        node.attr("height", dimensions.height);

        if (Path.ext(pms.texture) !== ".png") {
            let filename = Path.replaceExtension(pms.texture, ".png");
            if (filename = File.exists(Path.resolve(Path.dir(path), "../textures/" + filename))) {
                node.attr("src", "../textures/" + Path.filename(filename));
            }
        }

        node.attr("text", Path.filename(node.attr("src")));

        return node;
    }

    static dimensionsFromPolygons(polygons) {
        const dimensions = {
            width: new Map(),
            height: new Map()
        };

        const area = (a, b, c) => Math.abs(xMath.signedTriangleArea(a.x, a.y, b.x, b.y, c.x, c.y));

        const sizeFn = {
            width: (a, b) => Math.abs(b.u - a.u) > 0 ? (b.x - a.x) / (b.u - a.u) : 0,
            height: (a, b) => Math.abs(b.v - a.v) > 0 ? (b.y - a.y) / (b.v - a.v) : 0,
        }

        const incSize = (dim, a, b) => {
            const t = Math.round(sizeFn[dim](a, b));
            dimensions[dim].set(t, (dimensions[dim].get(t) || 0) + 1);
        };

        const inc = (a, b) => {
            incSize("width", a, b);
            incSize("height", a, b);
        };

        for (const poly of polygons) {
            const [a, b, c] = poly.vertices;
            if (poly.vertices.some(v => v.color.a > 0) && area(a, b, c) > 0) {
                inc(a, b), inc(b, c), inc(c, a);
            }
        }

        const mostUsed = (acc, entry) => entry[1] > acc[1] ? entry : acc;

        return {
            width: [...dimensions.width.entries()].reduce(mostUsed, [0, 0])[0],
            height: [...dimensions.height.entries()].reduce(mostUsed, [0, 0])[0]
        };
    }
}
