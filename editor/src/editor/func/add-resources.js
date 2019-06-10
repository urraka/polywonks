import { Path } from "../../common/path.js";
import { ImageNode, TextureNode } from "../../map/map.js";
import { File } from "../../file.js";
import { EditorCommand } from "../command.js";
import { EditorFunction } from "./base.js";

class AddResourcesFunction extends EditorFunction {
    onLoaded(type, resources) {
        const command = new EditorCommand(this.editor);
        const mount = Path.mount(this.editor.map.path);
        const dir = Path.dir(this.editor.map.path);
        for (const res of resources) {
            const node = type === "image" ? new ImageNode() : new TextureNode();
            if (Path.mount(res.path) === mount) {
                node.attr("src", Path.relative(dir, res.path));
            } else {
                node.attr("src", res.path);
            }
            node.attr("text", Path.filename(res.path));
            node.attr("export-name", Path.filename(res.path));
            node.attr("width", res.image.width);
            node.attr("height", res.image.height);
            command.insert(this.editor.map.resources, null, node);
        }
        this.editor.do(command);
    }

    onExec({ type, paths }) {
        const resources = [];
        for (const path of paths) {
            File.readImage(path, image => {
                resources.push({ image, path });
                if (resources.length === paths.length) {
                    this.onLoaded(type, resources.filter(res => !!res.image));
                }
            });
        }
    }
}

EditorFunction.register(AddResourcesFunction);
