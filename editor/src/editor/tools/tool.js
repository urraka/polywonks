import { EventEmitter } from "../../support/event.js";
import { Node } from "../../map/map.js";

export class Tool extends EventEmitter {
    constructor() {
        super();
        this.editor = null;
        this.attributes = new Map();
    }

    get activated() {
        return !!this.editor;
    }

    get status() {
        return "";
    }

    attr(name, value) {
        return Node.prototype.attr.call(this, name, value);
    }

    activate(editor) {
        if (!editor) {
            throw new Error("Undefined editor object in Tool.activate(editor)");
        }

        if (!this.editor || this.editor !== editor) {
            this.deactivate();
            this.editor = editor;
            this.onActivate();
        }
    }

    deactivate() {
        if (this.editor) {
            this.onDeactivate();
            this.editor = null;
        }
    }

    reset() {
        if (this.editor) {
            const editor = this.editor;
            this.deactivate();
            this.activate(editor);
        }
    }

    onCommand() { }
}
