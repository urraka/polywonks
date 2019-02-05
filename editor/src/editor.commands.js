import { ValueType } from "./support/type.js";

export class EditorCommand {
    constructor(editor) {
        this.editor = editor;
        this.selection = new Set(editor.selection.nodes);
    }

    get hasChanges() {
        return false;
    }

    restoreSelection() {
        this.editor.selection.replace(this.selection);
    }
}

export class AttributeChangeCommand extends EditorCommand {
    constructor(editor) {
        super(editor);
        this.apply = [];
        this.revert = [];
    }

    get hasChanges() {
        return this.apply.length > 0;
    }

    attr(node, key, value) {
        if (!ValueType.equals(node.attributes.get(key).dataType, node.attr(key), value)) {
            this.apply.push({node, key, value});
            this.revert.unshift({node, key, value: node.attr(key)});
        }
    }

    do() {
        this.restoreSelection();
        for (const {node, key, value} of this.apply) {
            node.attr(key, value);
        }
    }

    undo() {
        this.restoreSelection();
        for (const {node, key, value} of this.revert) {
            node.attr(key, value);
        }
    }
}

export class RelocateMapCommand extends AttributeChangeCommand {
    constructor(editor, newPath) {
        super(editor);
        this.oldPath = editor.map.path;
        this.newPath = newPath;
    }

    get hasChanges() {
        return super.hasChanges && this.oldPath !== this.newPath;
    }

    do() {
        this.editor.map.path = this.newPath;
        super.do();
    }

    undo() {
        super.undo();
        this.editor.map.path = this.oldPath;
    }
}

export class InsertNodesCommand extends EditorCommand {
    constructor(editor) {
        super(editor);
        this.calls = [];
    }

    get hasChanges() {
        return this.calls.length > 0;
    }

    insert(parent, position, node) {
        this.calls.push({ parent, position, node });
    }

    do() {
        for (const call of this.calls) {
            call.parent.insert(call.position, call.node);
        }
        this.editor.selection.replace(new Set(this.calls.map(call => call.node)));
    }

    undo() {
        this.restoreSelection();
        for (const call of this.calls.reverse()) {
            call.node.remove();
        }
    }
}

export class RemoveNodesCommand extends EditorCommand {
    constructor(editor) {
        super(editor);
        this.calls = [];
    }

    get hasChanges() {
        return this.calls.length > 0;
    }

    remove(node) {
        this.calls.push({ parent: node.parentNode, position: node.nextSibling, node });
    }

    do() {
        const selection = new Set(this.selection);
        for (const call of this.calls) {
            call.node.remove();
            selection.delete(call.node);
        }
        this.editor.selection.replace(selection);
    }

    undo() {
        for (const call of this.calls.reverse()) {
            call.parent.insert(call.position, call.node);
        }
        super.restoreSelection();
    }
}
