import * as ui from "../../ui/ui.js";
import { Path } from "../../support/path.js";
import { cfg } from "../../settings.js";
import { File } from "../../file.js";
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

EditorFunction.register(ExportFunction);
