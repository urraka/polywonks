import * as ui from "../ui/ui.js";
import { EventEmitter } from "../common/event.js";

export class Statusbar extends EventEmitter {
    constructor(app) {
        super();
        this.onEditorStatusChange = this.onEditorStatusChange.bind(this);
        this.statusbar = new ui.Statusbar();
        this.statusbar.addItem("tool", "left", 200);
        this.statusbar.addItem("layer", "left", 200, "left");
        this.statusbar.addItem("zoom", "right", 100, "right");
        this.statusbar.addItem("cursor", "right", 100, "right");
        app.on("activeeditorchange", e => this.onEditorChange(e.editor));
    }

    get element() {
        return this.statusbar.element;
    }

    get editor() {
        return this._editor;
    }

    onEditorChange(editor) {
        if (this.editor) this.editor.off("statuschange", this.onEditorStatusChange);
        this._editor = editor;
        if (this.editor) this.editor.on("statuschange", this.onEditorStatusChange);
    }

    onEditorStatusChange(event) {
        for (const [name, value] of Object.entries(event.status)) {
            this.statusbar.set(name, value);
        }
    }
}
