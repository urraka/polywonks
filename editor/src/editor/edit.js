import { ValueType } from "../common/type.js";
import { EventEmitter } from "../common/event.js";

class AttrCommand {
    constructor(ownerCommand, node, key, value) {
        this.ownerCommand = ownerCommand;
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
    constructor(ownerCommand, parent, position, node) {
        this.ownerCommand = ownerCommand;
        this.parent = parent;
        this.position = position;
        this.node = node;
        this.hasChanges = !!parent && !!node;
    }

    do(sel) {
        let pos = this.position;
        while (pos && pos.parentNode !== this.parent) {
            const cmd = this.ownerCommand.commands.find(cmd => {
                return (cmd instanceof InsertCommand) && cmd.node === pos;
            });
            pos = cmd.position;
        }
        this.parent.insert(pos, this.node);
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
    constructor(ownerCommand, node) {
        this.ownerCommand = ownerCommand;
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
        let pos = this.position;
        while (pos && pos.parentNode !== this.parent) {
            const cmd = this.ownerCommand.commands.find(cmd => {
                return (cmd instanceof RemoveCommand) && cmd.node === pos;
            });
            pos = cmd.position;
        }
        this.parent.insert(pos, this.node);
        for (const node of this.node.tree()) {
            sel.add(node);
        }
    }
}

class RelocateCommand {
    constructor(ownerCommand, map, path) {
        this.ownerCommand = ownerCommand;
        this.map = map;
        this.setPath = path;
        this.revertPath = map.path;
        this.hasChanges = this.setPath !== this.revertPath;
    }

    do() { this.map.path = this.setPath; }
    undo() { this.map.path = this.revertPath; }
}

export class EditCommand extends EventEmitter {
    constructor(editor) {
        super();
        this.editor = editor;
        this.selection = new Set(editor.selection.nodes);
        this.commands = [];
    }

    get hasChanges() {
        return this.commands.length > 0;
    }

    do() {
        this.emit("willchange", { action: "do" });
        const sel = new Set(this.selection);
        for (const cmd of this.commands) {
            cmd.do(sel);
        }
        this.editor.selection.replace(sel);
        this.emit("change", { action: "do" });
    }

    undo() {
        this.emit("willchange", { action: "undo" });
        const sel = new Set(this.selection);
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo(sel);
        }
        this.editor.selection.replace(sel);
        this.emit("change", { action: "undo" });
    }

    push(cmdType, ...args) {
        const cmd = new cmdType(this, ...args);
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
