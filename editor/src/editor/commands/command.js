import { Command } from "../../app/command.js";
import { Editor } from "../editor.js";

export class EditorCommand extends Command {
    get editor() {
        return this.provider;
    }

    static register(CommandClass) {
        Command.register(Editor, CommandClass);
    }
}
