import { Command } from "../../app/command.js";

export class ToolCommand extends Command {
    get tool() {
        return this.provider;
    }
}
