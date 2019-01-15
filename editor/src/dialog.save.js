import * as ui from "./ui/ui.js";
import { Event } from "./support/event.js";
import { Path } from "./support/path.js";
import { File } from "./file.js";

export class SaveDialog extends ui.Dialog {
    constructor(filename = "", location = "") {
        super();
        this.header.textContent = "Save as...";
        this.element.style.display = "none";
        this.sheet = new ui.PropertySheet();
        this.addButton("save", "Save", true);
        this.addButton("cancel", "Cancel");

        File.refresh(["polydrive", "soldat"], list => {
            const dirs = list.filter(f => f.endsWith("/"));
            this.sheet.addProperty("location", location, "string", "Location", dirs);
            this.sheet.addProperty("filename", filename, "string", "File name");
            this.body.append(this.sheet.element);
            this.element.style.display = "";
        });
    }

    get path() {
        const dir = this.sheet.properties["location"].value;
        const file = this.sheet.properties["filename"].value;
        return Path.resolve(dir, Path.filename(file));
    }

    onButtonClick(key) {
        if (key === "save") {
            const path = this.path;

            if (File.exists(path)) {
                const message = Path.filename(path) + " already exists. Do you want to replace it?";
                ui.confirm("Save as...", message, "no", result => {
                    if (result === "yes") {
                        this.close();
                        this.emit(new Event("save", { path }));
                    }
                });
            } else {
                this.close();
                this.emit(new Event("save", { path }));
            }
        } else {
            this.close();
        }
    }
}
