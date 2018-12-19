import { Node } from "./map.node.js";
import { Color } from "./color.js";
import { Path } from "./path.js";
import { File } from "./file.js";

export class TextureNode extends Node {
    constructor() {
        super("texture");
        this.attributes.set("text", "Texture");
        this.attributes.set("src", "");
        this.attributes.set("export-name", "");
        this.attributes.set("color-key", new Color());
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
}
