import * as ui from "../../ui/ui.js";
import { Path } from "../../support/path.js";
import { SaveDialog } from "../../dialog.save.js";
import { File } from "../../file.js";
import { Editor } from "../editor.js";
import { EditorFunction } from "./base.js";

class SaveAsFunction extends EditorFunction {
    onExec() {
        const fname = Path.filename(this.editor.saveName);
        const dir = Path.dir(this.editor.saveName) || "/polydrive/";
        const dialog = new SaveDialog("Save as...", fname, dir);
        dialog.on("save", event => {
            const saveIndex = this.editor.undone;
            const editor = new Editor(this.editor.map.clone());
            editor.exec("relocate", { path: event.path });
            File.write(event.path, editor.map.serialize(), ok => {
                if (ok) {
                    this.editor.onSave(saveIndex, event.path);
                } else {
                    ui.msgbox("Save as...", "Failed to write file " + event.path);
                }
            });
        });
        dialog.show();
    }
}

EditorFunction.register(SaveAsFunction);
