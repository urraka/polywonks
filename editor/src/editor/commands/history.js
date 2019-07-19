import { EditorCommand } from "./command.js";

class HistoryCommand extends EditorCommand {
    constructor(editor) {
        super(editor);
        this.editor.history.on("change", this.emitChange);
    }
}

class UndoCommand extends HistoryCommand {
    get enabled() {
        return this.editor.history.canUndo;
    }

    onExec() {
        this.editor.history.undo();
    }
}

class RedoCommand extends HistoryCommand {
    get enabled() {
        return this.editor.history.canRedo;
    }

    onExec() {
        this.editor.history.redo();
    }
}

EditorCommand.register(UndoCommand);
EditorCommand.register(RedoCommand);
