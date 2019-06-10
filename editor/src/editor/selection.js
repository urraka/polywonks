import { EventEmitter } from "../common/event.js";

export class Selection extends EventEmitter {
    constructor(editor) {
        super();
        this.editor = editor;
        this.nodes = new Set();
        this.editor.map.on("visibilitychange", e => this.onMapVisibilityChange(e));
    }

    onMapVisibilityChange(event) {
        const node = event.target;
        const filtered = [...this.nodes].filter(n => !node.contains(n));
        if (filtered.length !== this.nodes.size) {
            this.nodes = new Set([...filtered]);
            this.emit("change");
        }
    }

    add(nodes) {
        let changed = false;
        for (const node of nodes) {
            if (!this.nodes.has(node)) {
                this.nodes.add(node);
                changed = true;
            }
        }

        if (changed) this.emit("change");
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

        if (changed) this.emit("change");
        return changed;
    }

    replace(nodes) {
        if (nodes.size !== this.nodes.size || [...nodes].some(node => !this.nodes.has(node))) {
            this.nodes = new Set([...nodes]);
            this.emit("change");
            return true;
        }
        return false;
    }

    clear() {
        if (this.nodes.size === 0) return false;
        this.nodes.clear();
        this.emit("change");
        return true;
    }

    has(node) {
        return this.nodes.has(node);
    }

    clone() {
        return new Set([...this.nodes]);
    }
}
