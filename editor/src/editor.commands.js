import { ValueType } from "./support/type.js";

export class AttributeChangeCommand {
    constructor(editor) {
        this.editor = editor;
        this.selection = new Set(editor.selection.nodes);
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
        for (const {node, key, value} of this.apply) {
            node.attr(key, value);
        }
        this.editor.selection.replace(this.selection);
    }

    undo() {
        for (const {node, key, value} of this.revert) {
            node.attr(key, value);
        }
        this.editor.selection.replace(this.selection);
    }
}

export class RelocateMapCommand extends AttributeChangeCommand {
    constructor(editor, newPath) {
        super(editor);
        this.oldPath = editor.map.path;
        this.newPath = newPath;
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
