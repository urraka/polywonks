import { Color } from "../support/color.js";
import { Path } from "../support/path.js";
import { File } from "../file.js";
import { Node } from "./node.js";
import { Attribute } from "./attribute.js";

export class TextureNode extends Node {
    constructor() {
        super();
        this.attributes.get("text").value = "Texture";
        this.attributes.set("src", new Attribute("string", ""));
        this.attributes.set("export-name", new Attribute("string", ""));
        this.attributes.set("color-key", new Attribute("color", new Color()));
    }

    get nodeName() {
        return "texture";
    }

    static fromPMS(pms, path) {
        const node = new TextureNode();
        node.attr("text", pms.texture);
        node.attr("src", "../textures/" + pms.texture);
        node.attr("export-name", pms.texture);
        node.attr("color-key", new Color(0, 255, 0));

        if (Path.ext(pms.texture) !== ".png") {
            let filename = Path.replaceExtension(pms.texture, ".png");
            if (filename = File.exists(Path.resolve(Path.dir(path), "../textures/" + filename))) {
                node.attr("src", "../textures/" + Path.filename(filename));
            }
        }

        return node;
    }

    get path() {
        const src = this.attr("src");
        if (!src || src.startsWith("/")) return src;
        if (this.owner) return Path.resolve(Path.dir(this.owner.path), src);
        return "";
    }
}
