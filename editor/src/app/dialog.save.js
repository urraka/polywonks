import * as ui from "../ui/ui.js";
import { Path } from "../common/path.js";
import { File } from "./file.js";
import { Property } from "./property.js";

export class SaveDialog extends ui.Dialog {
    constructor(title, filename = "", location = "") {
        super();
        this.header.textContent = title;
        this.element.style.display = "none";
        this.sheet = new ui.PropertySheet();
        this.addButton("save", "Save", true);
        this.addButton("cancel", "Cancel");

        File.refresh(["polydrive", "soldat"], paths => {
            const dirs = File.sort(paths.filter(f => f.endsWith("/")).concat(["/polydrive/", "/soldat/"]));
            this.sheet.addProperty(new ui.PropertyComboItem("location", "Location", location, Property.toOptions(dirs)));
            this.sheet.addProperty(new ui.PropertyTextItem("filename", "File name", filename));
            this.sheet.properties["location"].immediateChange = true;
            this.sheet.properties["filename"].immediateChange = true;
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
                ui.confirm(this.header.textContent, message, "no", result => {
                    if (result === "yes") {
                        this.close();
                        this.emit("save", { path });
                    }
                });
            } else {
                this.close();
                this.emit("save", { path });
            }
        } else {
            this.close();
        }
    }
}
