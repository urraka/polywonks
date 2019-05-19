import { EditorFunction } from "./base.js";
import { LayerNode } from "../../map/map.js";
import { iter } from "../../support/iter.js";
import { EditorCommand } from "../command.js";

class ArrangeFunction extends EditorFunction {
    constructor(editor) {
        super(editor);
        this.editor.selection.on("change", () => this.emit("change"));
    }

    *nodes() {
        for (const node of this.editor.selection.nodes) {
            if (node.parentNode instanceof LayerNode) {
                yield node;
            }
        }
    }

    layerNodes(layer, nodes) {
        return [...iter(layer.children()).filter(node => nodes.has(node))];
    }

    sort() {
        const layers = new Set();
        const nodes = new Set(this.nodes());
        const result = new Map();
        nodes.forEach(node => layers.add(node.parentNode));
        layers.forEach(layer => result.set(layer, this.layerNodes(layer, nodes)));
        return result;
    }

    canBringNodesForward(nodes) {
        const sel = this.editor.selection.nodes;
        return !!iter(nodes).find(node => node.nextSibling !== null && !sel.has(node.nextSibling));
    }

    canSendNodesBackward(nodes) {
        const sel = this.editor.selection.nodes;
        return !!iter(nodes).find(node => node.previousSibling !== null && !sel.has(node.previusSibling));
    }
}

class BringToFrontFunction extends ArrangeFunction {
    get enabled() {
        return this.canBringNodesForward(this.nodes());
    }

    onExec() {
        const command = new EditorCommand(this.editor);
        for (const [layer, nodes] of this.sort()) {
            if (this.canBringNodesForward(nodes)) {
                let last = null;
                if (iter(nodes).last() === layer.lastChild) {
                    last = layer.lastChild;
                    while (iter(nodes).last() === layer.lastChild) {
                        last = last.previousSibling;
                        nodes.pop();
                    }
                }
                nodes.forEach(node => command.remove(node));
                nodes.forEach(node => command.insert(layer, last, node));
            }
        }
        this.editor.do(command);
    }
}

class BringForwardFunction extends ArrangeFunction {
    get enabled() {
        return this.canBringNodesForward(this.nodes());
    }

    onExec() {
        // TODO: implement
    }
}

class SendBackwardFunction extends ArrangeFunction {
    get enabled() {
        return this.canSendNodesBackward(this.nodes());
    }

    onExec() {
        // TODO: implement
    }
}

class SendToBackFunction extends ArrangeFunction {
    get enabled() {
        return this.canSendNodesBackward(this.nodes());
    }

    onExec() {
        const command = new EditorCommand(this.editor);
        for (const [layer, nodes] of this.sort()) {
            if (this.canSendNodesBackward(nodes)) {
                let first = layer.firstChild;
                while (iter(nodes).first() === first) {
                    first = first.nextSibling;
                    nodes.shift();
                }
                nodes.forEach(node => command.remove(node));
                nodes.forEach(node => command.insert(layer, first, node));
            }
        }
        this.editor.do(command);
    }
}

EditorFunction.register(BringToFrontFunction);
EditorFunction.register(BringForwardFunction);
EditorFunction.register(SendBackwardFunction);
EditorFunction.register(SendToBackFunction);
