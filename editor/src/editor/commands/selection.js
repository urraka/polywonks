import { iter } from "../../common/iter.js";
import { VertexNode, TriangleNode } from "../../map/map.js";
import { EditorCommand } from "./command.js";

class SelectionVertSwitchCommand extends EditorCommand {
    constructor(editor) {
        super(editor);
        this.editor.selection.on("change", this.emitChange);
    }

    get enabled() {
        return !!iter(this.nodes()).first();
    }

    *nodes() {
        for (const node of this.editor.selection.nodes) {
            if ((node instanceof VertexNode) || (node instanceof TriangleNode)) {
                yield node;
            }
        }
    }

    onExec() {
        const sel = new Set();
        const firstType = iter(this.nodes()).first().constructor;
        if (firstType === VertexNode) {
            for (const node of this.nodes()) {
                if (node instanceof VertexNode) {
                    sel.add(node.parentNode);
                } else {
                    sel.add(node);
                }
            }
        } else {
            for (const node of this.nodes()) {
                if (node instanceof TriangleNode) {
                    for (const vertex of node.children("vertex")) {
                        sel.add(vertex);
                    }
                } else {
                    sel.add(node);
                }
            }
        }
        this.editor.selection.replace(sel);
    }
}

EditorCommand.register(SelectionVertSwitchCommand);
