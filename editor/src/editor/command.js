import { ValueType } from "../support/type.js";

class AttrCommand {
    constructor(node, key, value) {
        this.node = node;
        this.key = key;
        this.setValue = value;
        this.revertValue = node.attr(key);
        const type = node.attributes.get(key).dataType;
        this.hasChanges = !ValueType.equals(type, this.revertValue, this.setValue);
    }

    do() { this.node.attr(this.key, this.setValue); }
    undo() { this.node.attr(this.key, this.revertValue); }
}

class InsertCommand {
    constructor(parent, position, node) {
        this.parent = parent;
        this.position = position;
        this.node = node;
        this.hasChanges = !!parent && !!node;
    }

    do(sel) {
        this.parent.insert(this.position, this.node);
        for (const node of this.node.tree()) {
            sel.add(node);
        }
    }

    undo(sel) {
        this.node.remove();
        for (const node of this.node.tree()) {
            sel.delete(node);
        }
    }
}

class RemoveCommand {
    constructor(node) {
        this.parent = node.parentNode;
        this.position = node.nextSibling;
        this.node = node;
        this.hasChanges = !!parent && !!node;
    }

    do(sel) {
        this.node.remove();
        for (const node of this.node.tree()) {
            sel.delete(node);
        }
    }

    undo(sel) {
        this.parent.insert(this.position, this.node);
        for (const node of this.node.tree()) {
            sel.add(node);
        }
    }
}

class RelocateCommand {
    constructor(map, path) {
        this.map = map;
        this.setPath = path;
        this.revertPath = map.path;
        this.hasChanges = this.setPath !== this.revertPath;
    }

    do() { this.map.path = this.setPath; }
    undo() { this.map.path = this.revertPath; }
}

export class EditorCommand {
    constructor(editor) {
        this.editor = editor;
        this.selection = new Set(editor.selection.nodes);
        this.commands = [];
    }

    get hasChanges() {
        return this.commands.length > 0;
    }

    do() {
        const sel = new Set(this.selection);
        for (const cmd of this.commands) {
            cmd.do(sel);
        }
        this.editor.selection.replace(sel);
    }

    undo() {
        const sel = new Set(this.selection);
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo(sel);
        }
        this.editor.selection.replace(sel);
    }

    push(cmdType, ...args) {
        const cmd = new cmdType(...args);
        if (cmd.hasChanges) this.commands.push(cmd);
    }

    attr(node, key, value) {
        this.push(AttrCommand, node, key, value);
    }

    insert(parent, position, node) {
        this.push(InsertCommand, parent, position, node);
    }

    remove(node) {
        this.push(RemoveCommand, node);
    }

    relocate(map, path) {
        this.push(RelocateCommand, map, path);
    }
}
