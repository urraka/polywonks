import * as ui from "../../ui/ui.js";
import { iter } from "../../common/iter.js";
import { ResourceNode } from "../../map/map.js";
import { EditCommand } from "../edit.js";
import { EditorCommand } from "./command.js";

class DeleteCommand extends EditorCommand {
    constructor(editor) {
        super(editor);
        this.editor.selection.on("change", this.emitChange);
    }

    get enabled() {
        for (const node of this.editor.selection.nodes) {
            if (this.isNodeDeletable(node)) {
                return true;
            }
        }
        return false;
    }

    isNodeDeletable(node) {
        return node !== this.editor.map && node.parentNode !== this.editor.map &&
            [...node.ancestors()].every(n => !this.editor.selection.nodes.has(n));
    }

    isResourceUsedByNode(resNode, node) {
        const attrs = iter(node.attributes.values());
        return !!attrs.find(attr => attr.value === resNode);
    }

    nodesUsingResource(resNode) {
        return iter(this.editor.map.tree()).filter(node => this.isResourceUsedByNode(resNode, node));
    }

    deleteNodes(nodes, linkedNodes) {
        const command = new EditCommand(this.editor);
        for (const node of nodes) {
            command.remove(node);
        }
        for (const node of linkedNodes) {
            if (node.attributes.has("image")) {
                command.remove(node);
            } else if (node.attributes.has("texture")) {
                command.attr(node, "texture", null);
            }
        }
        this.editor.history.do(command);
    }

    onExec() {
        const nodes = [...this.editor.selection.nodes].filter(node => this.isNodeDeletable(node));
        const linkedNodes = nodes.filter(node => node instanceof ResourceNode).flatMap(resNode => {
            return [...this.nodesUsingResource(resNode)].filter(node => {
                return !this.editor.selection.nodes.has(node) && this.isNodeDeletable(node);
            });
        });

        if (linkedNodes.length > 0) {
            const message = "Some of the selected resources are still being used. " +
                "Objects using such resources may be deleted in turn. Continue?";

            ui.confirm("Delete", message, "no", result => {
                if (result === "yes") {
                    this.deleteNodes(nodes, linkedNodes);
                }
            });
        } else {
            this.deleteNodes(nodes, linkedNodes);
        }
    }
}

EditorCommand.register(DeleteCommand);
