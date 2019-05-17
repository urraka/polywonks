import * as ui from "../../ui/ui.js"
import { Path } from "../../support/path.js";
import { File } from "../../file.js";
import { EditorFunction } from "./base.js";

class SaveFunction extends EditorFunction {
    constructor(editor) {
        super(editor);
        this.editor.on("change", () => this.emit("change"));
    }

    get enabled() {
        return this.editor.saveName.startsWith("/");
    }

    onExec() {
        File.refresh(Path.mount(this.editor.saveName), () => {
            if (File.exists(this.editor.saveName)) {
                const saveIndex = this.editor.undone;
                File.write(this.editor.saveName, this.editor.map.serialize(), ok => {
                    if (ok) {
                        this.editor.onSave(saveIndex, this.editor.saveName);
                    } else {
                        ui.msgbox("Save", "Failed to write file " + this.editor.saveName);
                    }
                });
            } else {
                this.editor.exec("save-as");
            }
        });
    }
}

EditorFunction.register(SaveFunction);
