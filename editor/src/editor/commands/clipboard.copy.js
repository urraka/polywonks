import { ClonedNodesCollection, LayerNode, ConnectionNode } from "../../map/map.js";
import { Clipboard } from "../../app/clipboard.js";
import { EditorCommand } from "./command.js";

class CopyCommand extends EditorCommand {
    constructor(editor) {
        super(editor);
        this.editor.selection.on("change", this.emitChange);
    }

    get enabled() {
        // note: for now it only makes sense to copy direct children of layers
        for (const node of this.editor.selection.nodes) {
            if (node.parentNode && (node.parentNode instanceof LayerNode)) {
                return true;
            }
        }
        return false;
    }

    onExec() {
        const clonedNodes = new ClonedNodesCollection();

        const clones = [...this.editor.selection.nodes]
            .filter(node => node.parentNode && (node.parentNode instanceof LayerNode))
            .map(node => clonedNodes.clone(node));

        if (clones.length > 0) {
            clones.forEach(clone => {
                for (const clonedNode of [...clone.descendants()]) {
                    if (clonedNode instanceof ConnectionNode) {
                        const originalNode = clonedNodes.cloneToOriginal.get(clonedNode);
                        if (!this.editor.selection.has(originalNode) ||
                            !this.editor.selection.has(originalNode.parentNode) ||
                            !this.editor.selection.has(originalNode.attr("waypoint"))
                        ) {
                            clonedNode.remove();
                        }
                    }
                }
            });

            clonedNodes.resolveReferences();

            Clipboard.save({
                path: this.editor.map.path,
                nodes: clones
            });
        }
    }
}

EditorCommand.register(CopyCommand);
