import { Clipboard } from "../../app/clipboard.js";
import { EditorCommand } from "./command.js";

class CutCommand extends EditorCommand {
    constructor(editor) {
        super(editor);
        this.editor.selection.on("change", this.emitChange);
        Clipboard.on("change", this.emitChange);
    }

    dispose() {
        Clipboard.off("change", this.emitChange);
    }

    get enabled() {
        return EditorCommand.find(this.editor, "copy").enabled &&
            EditorCommand.find(this.editor, "delete").enabled;
    }

    onExec() {
        this.editor.exec("copy");
        this.editor.exec("delete");
    }
}

EditorCommand.register(CutCommand);
