import { EditorFunction } from "./base.js";

class ResetViewportFunction extends EditorFunction {
    get enabled() {
        return true;
    }

    onExec() {
        this.editor.view.reset();
    }
}

EditorFunction.register(ResetViewportFunction);
