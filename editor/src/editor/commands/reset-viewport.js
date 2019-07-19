import { EditorCommand } from "./command.js";

class ResetViewportCommand extends EditorCommand {
    get enabled() {
        return true;
    }

    onExec() {
        this.editor.view.reset();
    }
}

EditorCommand.register(ResetViewportCommand);
