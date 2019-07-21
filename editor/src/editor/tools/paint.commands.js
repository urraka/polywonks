import { PaintTool } from "./paint.js";
import { ToolCommand } from "./tool.command.js";

class PaintFullTriangleCommand extends ToolCommand {
    onHold() {
        this.tool.fullTriangle = true;
    }

    onRelease() {
        this.tool.fullTriangle = false;
    }
}

class CycleObjectsCommand extends ToolCommand {
    onExec() {
        this.tool.cycleNodes();
    }
}

ToolCommand.register(PaintTool, PaintFullTriangleCommand);
ToolCommand.register(PaintTool, CycleObjectsCommand);
