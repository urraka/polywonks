import { Path } from "../../common/path.js";
import { HistoryCommand } from "../history.command.js";
import { EditorFunction } from "./base.js";

class RelocateFunction extends EditorFunction {
    onExec({ path }) {
        if (!path.startsWith("/")) {
            throw new Error("RelocateFunction: directory must be absolute");
        }

        const command = new HistoryCommand(this.editor);
        const mount = Path.mount(path);
        const dir = Path.dir(path);

        command.relocate(this.editor.map, path);

        for (const node of this.editor.map.resources.descendants()) {
            if (node.attributes.has("src")) {
                const srcPath = node.path;
                if (srcPath) {
                    if (Path.mount(srcPath) === mount) {
                        command.attr(node, "src", Path.relative(dir, srcPath));
                    } else {
                        command.attr(node, "src", srcPath);
                    }
                }
            }
        }

        this.editor.history.do(command);
    }
}

EditorFunction.register(RelocateFunction);
