import { EventEmitter } from "../common/event.js";
import { Path } from "../common/path.js";
import { cfg } from "../app/settings.js";

export class EditorHistory extends EventEmitter {
    constructor(editor) {
        super();
        this.editor = editor;
        this.commands = [];
        this.index = 0;
        this.saveIndex = 0;
        this.saveName = this.initialSaveName(editor.map.path);
    }

    get modified() {
        return this.saveIndex !== this.index;
    }

    set modified(value) {
        this.save(value ? -1 : this.index);
    }

    get canUndo() {
        return this.commands.length > this.index;
    }

    get canRedo() {
        return this.index > 0;
    }

    initialSaveName(path) {
        if (path === "") {
            return "Untitled.polywonks";
        } else if (path.startsWith("/library/") || Path.ext(path).toLowerCase() === ".pms") {
            return Path.replaceExtension(Path.filename(path), ".polywonks");
        } else {
            return path;
        }
    }

    save(saveIndex = this.index, saveName = this.saveName) {
        if (saveName !== this.saveName) {
            const changed = (saveIndex !== this.index);
            this.editor.exec("relocate", { path: saveName });
            this.saveName = saveName;
            saveIndex = changed ? saveIndex : this.index;
        }
        this.saveIndex = saveIndex;
        this.emit("change");
    }

    do(command) {
        if (!command.hasChanges) {
            return;
        }

        if (this.saveIndex >= 0) {
            this.saveIndex = this.saveIndex - this.index + 1;
        }

        this.commands.splice(0, this.index, command);
        this.index = 0;

        const limit = cfg("editor.undo-limit");
        if (limit > 0 && this.commands.length > limit) {
            this.commands = this.commands.slice(0, limit);
        }

        command.do();
        this.emit("change");
        return command;
    }

    redo() {
        if (this.index > 0) {
            this.commands[--this.index].do();
            this.emit("change");
        }
    }

    undo(command) {
        if (this.commands.length > this.index && (!command || command === this.commands[this.index])) {
            this.commands[this.index++].undo();
            this.emit("change");
            return true;
        }
        return false;
    }
}
