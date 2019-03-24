import { EventEmitter } from "./support/event.js";

export class Tool extends EventEmitter {
    constructor() {
        super();
        this.editor = null;
    }

    get activated() {
        return !!this.editor;
    }

    get status() {
        return "";
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

    onCommand() {}
}
