import { Settings, cfg } from "../../app/settings.js";
import { EditorCommand } from "./command.js";

class ZoomInCommand extends EditorCommand {
    constructor(editor) {
        super(editor);
        this.onSettingChange = e => e.setting === "editor.zoom-max" && this.emitChange();
        this.editor.view.on("change", this.emitChange);
        Settings.on("change", this.onSettingChange);
    }

    dispose() {
        Settings.off(this.onSettingChange);
    }

    get enabled() {
        return this.editor.view.scale < cfg("editor.zoom-max");
    }

    onExec() {
        this.editor.toolset.zoom.zoomIn();
    }
}

EditorCommand.register(ZoomInCommand);
