import { SelectTool } from "./select.js";
import { ToolCommand } from "./tool.command.js";

class SelectAddCommand extends ToolCommand {
    onHold() {
        this.tool.mode = "add";
    }

    onRelease() {
        this.tool.mode = "replace";
    }
}

class SelectSubtractCommand extends ToolCommand {
    onHold() {
        this.tool.mode = "subtract";
    }

    onRelease() {
        this.tool.mode = "replace";
    }
}

class CycleObjectsCommand extends ToolCommand {
    onExec() {
        this.tool.cycleNodes();
    }
}

ToolCommand.register(SelectTool, SelectAddCommand);
ToolCommand.register(SelectTool, SelectSubtractCommand);
ToolCommand.register(SelectTool, CycleObjectsCommand);
