import { EditorFunction } from "./base.js";
import { Settings, cfg } from "../../settings.js";

class ZoomOutFunction extends EditorFunction {
    constructor(editor) {
        super(editor);
        this.editor.view.on("change", () => this.emit("change"));
        Settings.on("change", e => e.setting === "editor.zoom-min" && this.emit("change"));
    }

    get enabled() {
        return this.editor.view.scale > cfg("editor.zoom-min");
    }

    onExec() {
        this.editor.tools.passive.zoom.zoomOut();
    }
}

EditorFunction.register(ZoomOutFunction);
