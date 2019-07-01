import { Clipboard } from "../../app/clipboard.js";
import { EditorFunction } from "./base.js";

class CutFunction extends EditorFunction {
    constructor(editor) {
        super(editor);
        this.editor.selection.on("change", () => this.emit("change"));
        Clipboard.on("change", () => this.emit("change"));
    }

    get enabled() {
        return this.editor.functions["copy"].enabled &&
            this.editor.functions["delete"].enabled;
    }

    onExec() {
        this.editor.exec("copy");
        this.editor.exec("delete");
    }
}

EditorFunction.register(CutFunction);
