import { Path } from "../../common/path.js";
import { Clipboard } from "../../app/clipboard.js";
import { ResourceNode, TriangleNode } from "../../map/map.js";
import { EditCommand } from "../edit.js";
import { EditorCommand } from "./command.js";

class PasteCommand extends EditorCommand {
    constructor(editor) {
        super(editor);
        this.editor.on("activelayerchange", this.emitChange);
        Clipboard.on("change", this.emitChange);
    }

    dispose() {
        Clipboard.off("change", this.emitChange);
    }

    get enabled() {
        return this.editor.activeLayer && !Clipboard.empty();
    }

    onExec() {
        const data = Clipboard.load();
        data.nodes = data.nodes.filter(node => this.editor.activeLayer.isNodeAllowed(node));

        if (data.nodes.length === 0) {
            return;
        }

        const resources = this.editor.map.resources;
        const mount = Path.mount(this.editor.map.path);
        const dir = Path.dir(this.editor.map.path);

        this.editor.selection.clear();
        const command = new EditCommand(this.editor);

        data.nodes.forEach(nodeEntry => {
            for (const node of nodeEntry.tree()) {
                for (const [, attr] of node.attributes) {
                    if (attr.dataType === "node" && attr.value && (attr.value instanceof ResourceNode)) {
                        const resourceNode = attr.value;
                        const path = resourceNode.pathFrom(Path.dir(data.path)).toLowerCase();

                        for (const res of resources.children()) {
                            if (res.nodeName === resourceNode.nodeName && res.path.toLowerCase() === path) {
                                attr.value = res;
                                break;
                            }
                        }

                        if (attr.value === resourceNode) {
                            if (path) {
                                if (Path.mount(path) === mount) {
                                    resourceNode.attr("src", Path.relative(dir, path));
                                } else {
                                    resourceNode.attr("src", path);
                                }
                            }

                            command.insert(resources, null, resourceNode);
                        }
                    }
                }
            }

            if (nodeEntry instanceof TriangleNode) {
                const polyTypes = this.editor.activeLayer.polyTypes();
                if (![...polyTypes.names()].includes(nodeEntry.attr("poly-type"))) {
                    nodeEntry.attr("poly-type", polyTypes.defaultName());
                }
            }

            command.insert(this.editor.activeLayer, null, nodeEntry);
        });

        this.editor.history.do(command);
    }
}

EditorCommand.register(PasteCommand);
