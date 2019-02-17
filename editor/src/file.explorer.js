import * as ui from "./ui/ui.js";
import { File } from "./file.js";
import { Path } from "./support/path.js";
import { EventEmitter } from "./support/event.js";

export class FileExplorer extends EventEmitter {
    constructor(mount) {
        super("explorer");
        this.mount = mount;
        this.tree = new ui.TreeView();
        this.tree.on("itemdblclick", e => this.onItemDblClick(e.item.data));
        File.on("write", e => this.onFileWrite(e));
        setTimeout(() => this.refresh());
    }

    onFileWrite(event) {
        if (event.path.startsWith(`/${this.mount}/`)) {
            this.refresh();
        }
    }

    onItemDblClick(path) {
        this.emit("open", { path });
    }

    refresh() {
        File.refresh(this.mount, paths => {
            this.tree.clear();

            const items = new Map();
            items.set("/", this.tree);

            File.sort(paths).forEach(path => {
                let full = "/";
                for (const part of Path.split(path).slice(2)) {
                    const parent = items.get(full);
                    let item = items.get(full = full + part);
                    if (!item) {
                        const isdir = part.endsWith("/");
                        item = new ui.TreeItem(isdir ? part.slice(0, -1) : part, "/" + this.mount + full, isdir);
                        items.set(full, parent.addItem(item));
                    }
                }
            });
        });
    }
}
