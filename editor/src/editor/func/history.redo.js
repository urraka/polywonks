import { EditorFunction } from "./base.js";

class RedoFunction extends EditorFunction {
    get enabled() {
        return this.editor.undone > 0;
    }

    onExec() {
        this.editor.redo();
    }
}

EditorFunction.register(RedoFunction);
