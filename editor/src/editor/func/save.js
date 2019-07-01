import * as ui from "../../ui/ui.js";
import { Path } from "../../common/path.js";
import { File } from "../../app/file.js";
import { SaveDialog } from "../../app/dialog.save.js";
import { Editor } from "../editor.js";
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

class SaveDownloadFunction extends EditorFunction {
    onExec() {
        const filename = Path.filename(this.editor.saveName);
        const data = this.editor.map.serialize();
        ui.download(filename, new Blob([data], {type: "application/polywonks+xml"}));
    }
}

EditorFunction.register(SaveFunction);
EditorFunction.register(SaveAsFunction);
EditorFunction.register(SaveDownloadFunction);
