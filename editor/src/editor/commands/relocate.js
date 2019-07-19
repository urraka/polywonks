import { Path } from "../../common/path.js";
import { EditCommand } from "../edit.js";
import { EditorCommand } from "./command.js";

class RelocateCommand extends EditorCommand {
    onExec({ path }) {
        if (!path.startsWith("/")) {
            throw new Error("RelocateCommand: directory must be absolute");
        }

        const command = new EditCommand(this.editor);
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

EditorCommand.register(RelocateCommand);
