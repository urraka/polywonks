import * as ui from "../../ui/ui.js";
import { Path } from "../../common/path.js";
import { File } from "../../app/file.js";
import { SaveDialog } from "../../app/dialog.save.js";
import { Editor } from "../editor.js";
import { EditorFunction } from "./base.js";

class SaveFunction extends EditorFunction {
    constructor(editor) {
        super(editor);
    }

    onExec() {
        const mount = Path.mount(this.editor.history.saveName);
        if (!mount) return this.editor.exec("save-as");
        return new Promise((resolve, reject) => {
            File.refresh(mount, () => {
                if (File.exists(this.editor.history.saveName)) {
                    const saveIndex = this.editor.history.index;
                    File.write(this.editor.history.saveName, this.editor.map.serialize(), ok => {
                        if (ok) {
                            this.editor.history.save(saveIndex, this.editor.history.saveName);
                            resolve();
                        } else {
                            ui.msgbox("Save", "Failed to write file " + this.editor.history.saveName, () => reject());
                        }
                    });
                } else {
                    this.editor.exec("save-as").then(resolve, reject);
                }
            });
        });
    }
}

class SaveAsFunction extends EditorFunction {
    onExec() {
        return new Promise((resolve, reject) => {
            const fname = Path.filename(this.editor.history.saveName);
            const dir = Path.dir(this.editor.history.saveName) || "/polydrive/";
            const dialog = new SaveDialog("Save as...", fname, dir);
            dialog.on("save", event => {
                const saveIndex = this.editor.history.index;
                const editor = new Editor(this.editor.map.clone());
                editor.exec("relocate", { path: event.path });
                File.write(event.path, editor.map.serialize(), ok => {
                    if (ok) {
                        this.editor.history.save(saveIndex, event.path);
                        resolve();
                    } else {
                        ui.msgbox("Save as...", "Failed to write file " + event.path, () => reject());
                    }
                });
            });
            dialog.show();
        });
    }
}

class SaveDownloadFunction extends EditorFunction {
    onExec() {
        const filename = Path.filename(this.editor.history.saveName);
        const data = this.editor.map.serialize();
        ui.download(filename, new Blob([data], {type: "application/polywonks+xml"}));
    }
}

EditorFunction.register(SaveFunction);
EditorFunction.register(SaveAsFunction);
EditorFunction.register(SaveDownloadFunction);
