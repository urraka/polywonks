import { EditorFunction } from "./base.js";

class SetToolFunction extends EditorFunction {
    onExec({ tool }) {
        this.editor.currentTool = this.editor.tools[tool];
    }
}

EditorFunction.register(SetToolFunction);
