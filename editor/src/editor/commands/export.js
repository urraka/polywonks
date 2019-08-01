import * as ui from "../../ui/ui.js";
import { Path } from "../../common/path.js";
import { cfg } from "../../app/settings.js";
import { File } from "../../app/file.js";
import { SaveDialog } from "../../app/dialog.save.js";
import { EditorCommand } from "./command.js";

class ExportBase extends EditorCommand {
    get filename() {
        const name = Path.filename(this.editor.map.attr("text"));
        if (name) {
            return name + ".pms";
        } else {
            return Path.replaceExtension(Path.filename(this.editor.history.saveName), ".pms");
        }
    }

    get path() {
        return Path.resolve(cfg("app.export-location"), this.filename);
    }
}

class ExportCommand extends ExportBase {
    onExec() {
        const path = this.path;
        File.refresh(Path.mount(path), () => {
            if (File.exists(path)) {
                File.write(path, this.editor.map.toPMS().toArrayBuffer(), ok => {
                    if (ok) {
                        this.emitInfo("Exported to " + path);
                    } else {
                        ui.msgbox("Export", "Failed to write file " + path);
                    }
                });
            } else {
                this.editor.exec("export-as");
            }
        });
    }
}

class ExportAsCommand extends ExportBase {
    onExec() {
        const path = this.path;
        const dialog = new SaveDialog("Export as...", Path.filename(path), Path.dir(path));
        dialog.on("save", event => {
            File.write(event.path, this.editor.map.toPMS().toArrayBuffer(), ok => {
                if (ok) {
                    this.emitInfo("Exported to " + event.path);
                } else {
                    ui.msgbox("Export as...", "Failed to write file " + event.path);
                }
            });
        });
        dialog.show();
    }
}

class ExportDownloadCommand extends ExportBase {
    onExec() {
        const data = this.editor.map.toPMS().toArrayBuffer();
        ui.download(this.filename, new Blob([data], {type: "octet/stream"}));
    }
}

EditorCommand.register(ExportCommand);
EditorCommand.register(ExportAsCommand);
EditorCommand.register(ExportDownloadCommand);
