import { MoveTool } from "./move.js";
import { ToolCommand } from "./tool.command.js";

class MoveSelectCommand extends ToolCommand {
    onHold() {
        if (!this.tool.selectTool.activated) {
            this.tool.selectTool.activate(this.tool.editor);
            ToolCommand.exec(this.tool.selectTool, "+" + this.commandName);
        }
    }

    onRelease() {
        if (this.tool.selectTool.activated) {
            setTimeout(() => this.tool.onPointerMove());
        }
    }
}

class SelectAddCommand extends MoveSelectCommand { }
class SelectSubtractCommand extends MoveSelectCommand { }

ToolCommand.register(MoveTool, SelectAddCommand);
ToolCommand.register(MoveTool, SelectSubtractCommand);
