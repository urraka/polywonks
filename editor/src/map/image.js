import * as PMS from "../pms/pms.js";
import { Color } from "../support/color.js";
import { Path } from "../support/path.js";
import { File } from "../file.js";
import { Node } from "./node.js";

export class ImageNode extends Node {
    constructor() {
        super("image");
        this.attributes.set("text", "Image");
        this.attributes.set("src", "");
        this.attributes.set("export-name", "");
        this.attributes.set("color-key", new Color());
    }

    static fromPMS(scenery, path) {
        const node = new ImageNode();
        node.attr("text", scenery.name);
        node.attr("src", "../scenery-gfx/" + scenery.name);
        node.attr("export-name", scenery.name);
        node.attr("color-key", new Color(0, 255, 0));

        if (Path.ext(scenery.name) !== ".png") {
            let filename = Path.replaceExtension(scenery.name, ".png");
            if (filename = File.exists(Path.resolve(Path.dir(path), "../scenery-gfx/" + filename))) {
                node.attr("src", "../scenery-gfx/" + Path.filename(filename));
            }
        }

        return node;
    }

    toPMS() {
        const scenery = new PMS.Scenery();
        scenery.name = this.attr("export-name") || this.attr("src").split("/").pop();
        return scenery;
    }
}
