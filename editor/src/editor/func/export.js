import * as ui from "../../ui/ui.js";
import { Path } from "../../common/path.js";
import { cfg } from "../../app/settings.js";
import { File } from "../../app/file.js";
import { SaveDialog } from "../../app/dialog.save.js";
import { EditorFunction } from "./base.js";

class ExportFunction extends EditorFunction {
    onExec() {
        const filename = Path.replaceExtension(Path.filename(this.editor.saveName), ".pms");
        const path = Path.resolve(cfg("app.export-location"), filename);
        File.refresh(Path.mount(path), () => {
            if (File.exists(path)) {
                File.write(path, this.editor.map.toPMS().toArrayBuffer(), ok => {
                    if (!ok) {
                        ui.msgbox("Export", "Failed to write file " + path);
                    }
                });
            } else {
                this.editor.exec("export-as");
            }
        });
    }
}

class ExportAsFunction extends EditorFunction {
    onExec() {
        const filename = Path.replaceExtension(Path.filename(this.editor.saveName), ".pms");
        const path = Path.resolve(cfg("app.export-location"), filename);
        const dialog = new SaveDialog("Export as...", Path.filename(path), Path.dir(path));
        dialog.on("save", event => {
            File.write(event.path, this.editor.map.toPMS().toArrayBuffer(), ok => {
                if (!ok) {
                    ui.msgbox("Export as...", "Failed to write file " + event.path);
                }
            });
        });
        dialog.show();
    }
}

class ExportDownloadFunction extends EditorFunction {
    onExec() {
        const filename = Path.replaceExtension(Path.filename(this.editor.saveName), ".pms");
        const data = this.editor.map.toPMS().toArrayBuffer();
        ui.download(filename, new Blob([data], {type: "octet/stream"}));
    }
}

EditorFunction.register(ExportFunction);
EditorFunction.register(ExportAsFunction);
EditorFunction.register(ExportDownloadFunction);
