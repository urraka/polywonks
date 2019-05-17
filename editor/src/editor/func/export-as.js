import * as ui from "../../ui/ui.js";
import { Path } from "../../support/path.js";
import { SaveDialog } from "../../dialog.save.js";
import { cfg } from "../../settings.js";
import { File } from "../../file.js";
import { EditorFunction } from "./base.js";

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

EditorFunction.register(ExportAsFunction);
