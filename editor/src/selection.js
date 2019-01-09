import { EventEmitter, Event } from "./support/event.js";

export class Selection extends EventEmitter {
    constructor(editor) {
        super();
        this.editor = editor;
        this.nodes = new Set();
    }

    add(nodes) {
        let changed = false;
        for (const node of nodes) {
            if (!this.nodes.has(node)) {
                this.nodes.add(node);
                changed = true;
            }
        }

        if (changed) this.emit(new Event("change"));
        return changed;
    }

    subtract(nodes) {
        let changed = false;
        for (const node of nodes) {
            if (this.nodes.has(node)) {
                this.nodes.delete(node);
                changed = true;
            }
        }

        if (changed) this.emit(new Event("change"));
        return changed;
    }

    replace(nodes) {
        if (nodes.size !== this.nodes.size || [...nodes].some(node => !this.nodes.has(node))) {
            this.nodes = new Set([...nodes]);
            this.emit(new Event("change"));
            return true;
        }
        return false;
    }

    clear() {
        if (this.nodes.size === 0) return false;
        this.nodes.clear();
        this.emit(new Event("change"));
        return true;
    }

    has(node) {
        return this.nodes.has(node);
    }

    clone() {
        return new Set([...this.nodes]);
    }
}
