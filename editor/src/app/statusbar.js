import * as ui from "../ui/ui.js";
import { EventEmitter } from "../common/event.js";

export class Statusbar extends EventEmitter {
    constructor(app) {
        super();
        this.statusbar = new ui.Statusbar();
        this.statusbar.addItem("tool", "left", 200);
        this.statusbar.addItem("layer", "left", 200, "left");
        this.statusbar.addItem("zoom", "right", 100, "right");
        this.statusbar.addItem("cursor", "right", 100, "right");

        this.onToolStatusChange = () => this.updateItems("tool");
        this.onActiveLayerChange = () => this.updateItems("layer");
        this.onViewChange = () => this.updateItems("cursor", "zoom");
        this.onCursorChange = () => this.updateItems("cursor");

        app.on("activeeditorchange", e => this.onEditorChange(e.editor));
    }

    get element() {
        return this.statusbar.element;
    }

    get editor() {
        return this._editor;
    }

    onEditorChange(editor) {
        if (this.editor) {
            this.editor.toolset.off("statuschange", this.onToolStatusChange);
            this.editor.off("activelayerchange", this.onActiveLayerChange);
            this.editor.view.off("change", this.onViewChange);
            this.editor.cursor.off("change", this.onCursorChange);
        }
        this._editor = editor;
        if (this.editor) {
            this.editor.toolset.on("statuschange", this.onToolStatusChange);
            this.editor.on("activelayerchange", this.onActiveLayerChange);
            this.editor.view.on("change", this.onViewChange);
            this.editor.cursor.on("change", this.onCursorChange);
        }
        this.updateItems();
    }

    updateItems(...items) {
        if (items.length === 0) {
            items = this.statusbar.items.keys();
        }
        for (const key of items) {
            this.statusbar.set(key, this.statusText(key));
        }
    }

    statusText(key) {
        if (!this.editor) return "";
        switch (key) {
            case "tool": return this.editor.toolset.status;
            case "layer": return "Layer: " + (this.editor.activeLayer || "None").toString();
            case "zoom": return Math.round(100 * this.editor.view.scale) + "%";
            case "cursor": return this.editor.cursor.status;
        }
    }
}
