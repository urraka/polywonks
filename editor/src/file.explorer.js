import * as ui from "./ui/ui.js";
import { File } from "./file.js";
import { Path } from "./support/path.js";

export class FileExplorer extends ui.Panel {
    constructor(root) {
        super("explorer");
        this.root = root;
        this.tree = this.append(new ui.TreeView());
        this.tree.on("itemdblclick", e => this.onItemDblClick(e.data));
        File.on("write", e => this.onFileWrite(e));
        setTimeout(() => this.refresh());
    }

    onFileWrite(event) {
        if (event.path.startsWith(`/${this.root}/`)) {
            this.refresh();
        }
    }

    onItemDblClick(path) {
        this.emit("open", { path });
    }

    refresh() {
        File.refresh(this.root, paths => {
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
                        item = new ui.TreeItem(isdir ? part.slice(0, -1) : part, "/" + this.root + full, isdir);
                        items.set(full, parent.addItem(item));
                    }
                }
            });
        });
    }
}
