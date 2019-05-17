import { EditorFunction } from "./base.js";

class UndoFunction extends EditorFunction {
    get enabled() {
        return this.editor.commandHistory.length > this.editor.undone;
    }

    onExec() {
        this.editor.undo();
    }
}

EditorFunction.register(UndoFunction);
