import { PaintTool } from "./paint.js";
import { ToolCommand } from "./tool.command.js";

class SelectAddCommand extends ToolCommand {
    onHold() {
        this.tool.fullTriangle = true;
    }

    onRelease() {
        this.tool.fullTriangle = false;
    }
}

class SelectCycleCommand extends ToolCommand {
    onExec() {
        this.tool.cycleNodes();
    }
}

ToolCommand.register(PaintTool, SelectAddCommand);
ToolCommand.register(PaintTool, SelectCycleCommand);
