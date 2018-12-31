import { EventEmmiter } from "./event.js";

export class Tool extends EventEmmiter {
    constructor() {
        super();
        this.editor = null;
    }

    get active() {
        return !!this.editor;
    }

    activate(editor) {
        if (!editor) {
            throw new Error("Undefined editor object in Tool.activate(editor)");
        }

        if (this.active && this.editor !== editor) {
            this.deactivate();
        }

        this.editor = editor;
        this.onActivate();
    }

    deactivate() {
        if (this.active) {
            this.onDeactivate();
            this.editor = null;
        }
    }

    reset() {
        if (this.active) {
            const editor = this.editor;
            this.deactivate();
            this.activate(editor);
        }
    }
}
