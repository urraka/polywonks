import * as ui from "../ui/ui.js";
import { EventEmitter } from "../common/event.js";

export class Statusbar extends EventEmitter {
    constructor(app) {
        super();
        this.app = app;
        this.statusbar = new ui.Statusbar();
        this.statusbar.left.addTextItem("tool", 200);
        this.statusbar.left.addTextItem("layer", 200);
        this.statusbar.right.addTextItem("zoom", 100, "right");
        this.statusbar.right.addTextItem("cursor", 100, "right");
        this.statusbar.right.addToggleButton("toggle-grid", "grid-icon", "Toggle Grid");
        this.statusbar.right.addToggleButton("toggle-wireframe", "wireframe-icon", "Toggle Wireframe");
        this.statusbar.right.addToggleButton("toggle-vertices", "vertices-icon", "Toggle Vertices");
        this.statusbar.on("buttonclick", e => this.emit("command", { command: e.button }));

        this.onToolStatusChange = () => this.updateItems("tool");
        this.onActiveLayerChange = () => this.updateItems("layer");
        this.onViewChange = () => this.updateItems("cursor", "zoom");
        this.onCursorChange = () => this.updateItems("cursor");

        app.on("commandchange", e => this.onCommandChange(e));
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

    onCommandChange(event) {
        if (this.statusbar.itemType(event.name) === "button") {
            this.updateItems(event.name);
        }
    }

    updateItems(...items) {
        if (items.length === 0) {
            items = this.statusbar.items.keys();
        }
        for (const key of items) {
            if (this.statusbar.itemType(key) === "button") {
                const command = this.app.findCommand(key);
                this.statusbar.toggle(key, command.checked);
            } else {
                this.statusbar.set(key, this.statusText(key));
            }
        }
    }

    statusText(key) {
        switch (key) {
            case "tool": return this.editor.toolset.status;
            case "layer": return "Layer: " + (this.editor.activeLayer || "None").toString();
            case "zoom": return Math.round(100 * this.editor.view.scale) + "%";
            case "cursor": return this.editor.cursor.status;
        }
    }
}
