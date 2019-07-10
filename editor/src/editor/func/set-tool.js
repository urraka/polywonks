import { EditorFunction } from "./base.js";

class SetToolFunction extends EditorFunction {
    onExec({ tool }) {
        this.editor.toolset.currentTool = this.editor.toolset[tool];
    }
}

EditorFunction.register(SetToolFunction);
