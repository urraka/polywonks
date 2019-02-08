import * as PMS from "../pms/pms.js";
import { Color } from "../support/color.js";
import { Path } from "../support/path.js";
import { File } from "../file.js";
import { Node } from "./node.js";
import { Attribute } from "./attribute.js";

export class ImageNode extends Node {
    constructor() {
        super();
        this.attributes.set("src", new Attribute("string", ""));
        this.attributes.set("export-name", new Attribute("string", ""));
        this.attributes.set("color-key", new Attribute("color", new Color()));
        this.attributes.set("width", new Attribute("float", 0));
        this.attributes.set("height", new Attribute("float", 0));
    }

    get nodeName() {
        return "image";
    }

    static fromPMS(scenery, path, sceneryIndex, props) {
        props = props.filter(p => p.style - 1 === sceneryIndex);
        if (props.length === 0) return null;

        const node = new ImageNode();
        node.attr("src", "../scenery-gfx/" + scenery.name);
        node.attr("export-name", scenery.name);
        node.attr("color-key", new Color(0, 255, 0));

        const refProp = props.find(p => p.width !== 0 && p.height !== 0);
        if (refProp) {
            node.attr("width", refProp.width);
            node.attr("height", refProp.height);
        }

        if (Path.ext(scenery.name) !== ".png") {
            let filename = Path.replaceExtension(scenery.name, ".png");
            if (filename = File.exists(Path.resolve(Path.dir(path), "../scenery-gfx/" + filename))) {
                node.attr("src", "../scenery-gfx/" + Path.filename(filename));
            }
        }

        node.attr("text", Path.filename(node.attr("src")));
        return node;
    }

    toPMS() {
        const scenery = new PMS.Scenery();
        scenery.name = this.attr("export-name") || this.attr("src").split("/").pop();
        return scenery;
    }

    get path() {
        const src = this.attr("src");
        if (!src || src.startsWith("/")) return src;
        if (this.owner) return Path.resolve(Path.dir(this.owner.path), src);
        return "";
    }
}
