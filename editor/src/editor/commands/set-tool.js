import { EditorCommand } from "./command.js";

class SetToolCommand extends EditorCommand {
    onExec({ tool }) {
        this.editor.toolset.currentTool = this.editor.toolset[tool];
    }
}

EditorCommand.register(SetToolCommand);
