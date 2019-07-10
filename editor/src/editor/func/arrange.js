import { EditorFunction } from "./base.js";
import { LayerNode } from "../../map/map.js";
import { iter } from "../../common/iter.js";
import { HistoryCommand } from "../history.command.js";

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

    filterNodesToFirst(layer, nodes) {
        let first = layer.firstChild;
        while (iter(nodes).first() === first) {
            first = first.nextSibling;
            nodes.shift();
        }
        return first;
    }

    filterNodesToLast(layer, nodes) {
        let last = null;
        if (iter(nodes).last() === layer.lastChild) {
            last = layer.lastChild;
            nodes.pop();
            while (iter(nodes).last() === last.previousSibling) {
                last = last.previousSibling;
                nodes.pop();
            }
        }
        return last;
    }

    canBringNodesForward(nodes) {
        const sel = this.editor.selection.nodes;
        return !!iter(nodes).find(node => node.nextSibling !== null && !sel.has(node.nextSibling));
    }

    canSendNodesBackward(nodes) {
        const sel = this.editor.selection.nodes;
        return !!iter(nodes).find(node => node.previousSibling !== null && !sel.has(node.previousSibling));
    }
}

class BringToFrontFunction extends ArrangeFunction {
    get enabled() {
        return this.canBringNodesForward(this.nodes());
    }

    onExec() {
        const command = new HistoryCommand(this.editor);
        for (const [layer, nodes] of this.sort()) {
            if (this.canBringNodesForward(nodes)) {
                const last = this.filterNodesToLast(layer, nodes);
                nodes.forEach(node => command.remove(node));
                nodes.forEach(node => command.insert(layer, last, node));
            }
        }
        this.editor.history.do(command);
    }
}

class BringForwardFunction extends ArrangeFunction {
    get enabled() {
        return this.canBringNodesForward(this.nodes());
    }

    nextUnselected(nodes, last, node) {
        if (node === last) return last;
        while (node.nextSibling !== last && nodes.has(node.nextSibling)) {
            node = node.nextSibling;
        }
        return node.nextSibling;
    }

    onExec() {
        const command = new HistoryCommand(this.editor);
        for (const [layer, nodes] of this.sort()) {
            if (this.canBringNodesForward(nodes)) {
                const last = this.filterNodesToLast(layer, nodes);
                const next = this.nextUnselected.bind(this, new Set(nodes), last);
                nodes.forEach(node => command.remove(node));
                nodes.forEach(node => command.insert(layer, next(next(node)), node));
            }
        }
        this.editor.history.do(command);
    }
}

class SendBackwardFunction extends ArrangeFunction {
    get enabled() {
        return this.canSendNodesBackward(this.nodes());
    }

    prevUnselected(nodes, first, node) {
        if (node === first) return first;
        while (node.previousSibling !== first && nodes.has(node.previousSibling)) {
            node = node.previousSibling;
        }
        return node.previousSibling;
    }

    onExec() {
        const command = new HistoryCommand(this.editor);
        for (const [layer, nodes] of this.sort()) {
            if (this.canSendNodesBackward(nodes)) {
                const first = this.filterNodesToFirst(layer, nodes);
                const prev = this.prevUnselected.bind(this, new Set(nodes), first);
                nodes.forEach(node => command.remove(node));
                nodes.forEach(node => command.insert(layer, prev(node), node));
            }
        }
        this.editor.history.do(command);
    }
}

class SendToBackFunction extends ArrangeFunction {
    get enabled() {
        return this.canSendNodesBackward(this.nodes());
    }

    onExec() {
        const command = new HistoryCommand(this.editor);
        for (const [layer, nodes] of this.sort()) {
            if (this.canSendNodesBackward(nodes)) {
                const first = this.filterNodesToFirst(layer, nodes);
                nodes.forEach(node => command.remove(node));
                nodes.forEach(node => command.insert(layer, first, node));
            }
        }
        this.editor.history.do(command);
    }
}

EditorFunction.register(BringToFrontFunction);
EditorFunction.register(BringForwardFunction);
EditorFunction.register(SendBackwardFunction);
EditorFunction.register(SendToBackFunction);
