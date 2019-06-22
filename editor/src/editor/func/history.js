import { EditorFunction } from "./base.js";

class HistoryFunction extends EditorFunction {
    constructor(editor) {
        super(editor);
        this.editor.on("change", () => this.emit("change"));
    }
}

class UndoFunction extends HistoryFunction {
    get enabled() {
        return this.editor.commandHistory.length > this.editor.undone;
    }

    onExec() {
        this.editor.undo();
    }
}

class RedoFunction extends HistoryFunction {
    get enabled() {
        return this.editor.undone > 0;
    }

    onExec() {
        this.editor.redo();
    }
}

EditorFunction.register(UndoFunction);
EditorFunction.register(RedoFunction);
