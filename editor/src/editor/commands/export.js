import * as ui from "../../ui/ui.js";
import { Path } from "../../common/path.js";
import { cfg } from "../../app/settings.js";
import { File } from "../../app/file.js";
import { SaveDialog } from "../../app/dialog.save.js";
import { EditorCommand } from "./command.js";

class ExportCommand extends EditorCommand {
    onExec() {
        const filename = Path.replaceExtension(Path.filename(this.editor.history.saveName), ".pms");
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

class ExportAsCommand extends EditorCommand {
    onExec() {
        const filename = Path.replaceExtension(Path.filename(this.editor.history.saveName), ".pms");
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

class ExportDownloadCommand extends EditorCommand {
    onExec() {
        const filename = Path.replaceExtension(Path.filename(this.editor.history.saveName), ".pms");
        const data = this.editor.map.toPMS().toArrayBuffer();
        ui.download(filename, new Blob([data], {type: "octet/stream"}));
    }
}

EditorCommand.register(ExportCommand);
EditorCommand.register(ExportAsCommand);
EditorCommand.register(ExportDownloadCommand);
