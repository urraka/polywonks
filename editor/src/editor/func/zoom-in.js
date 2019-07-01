import { Settings, cfg } from "../../app/settings.js";
import { EditorFunction } from "./base.js";

class ZoomInFunction extends EditorFunction {
    constructor(editor) {
        super(editor);
        this.editor.view.on("change", () => this.emit("change"));
        Settings.on("change", e => e.setting === "editor.zoom-max" && this.emit("change"));
    }

    get enabled() {
        return this.editor.view.scale < cfg("editor.zoom-max");
    }

    onExec() {
        this.editor.tools.passive.zoom.zoomIn();
    }
}

EditorFunction.register(ZoomInFunction);
