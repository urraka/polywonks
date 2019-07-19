import { Settings, cfg } from "../../app/settings.js";
import { EditorCommand } from "./command.js";

class ZoomOutCommand extends EditorCommand {
    constructor(editor) {
        super(editor);
        this.onSettingChange = e => e.setting === "editor.zoom-min" && this.emitChange();
        this.editor.view.on("change", this.emitChange);
        Settings.on("change", this.onSettingChange);
    }

    dispose() {
        Settings.off(this.onSettingChange);
    }

    get enabled() {
        return this.editor.view.scale > cfg("editor.zoom-min");
    }

    onExec() {
        this.editor.toolset.zoom.zoomOut();
    }
}

EditorCommand.register(ZoomOutCommand);
