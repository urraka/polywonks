import { EditorFunction } from "./base.js";

class HistoryFunction extends EditorFunction {
    constructor(editor) {
        super(editor);
        this.editor.history.on("change", () => this.emit("change"));
    }
}

class UndoFunction extends HistoryFunction {
    get enabled() {
        return this.editor.history.canUndo;
    }

    onExec() {
        this.editor.history.undo();
    }
}

class RedoFunction extends HistoryFunction {
    get enabled() {
        return this.editor.history.canRedo;
    }

    onExec() {
        this.editor.history.redo();
    }
}

EditorFunction.register(UndoFunction);
EditorFunction.register(RedoFunction);
