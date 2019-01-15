import * as ui from "./ui/ui.js";
import { File } from "./file.js";

export class Explorer extends ui.Panel {
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
        app.open(path);
    }

    refresh() {
        File.refresh(this.root, list => {
            this.tree.clear();

            list = list.map(path => {
                return path.split("/").slice(2).map((s, i, arr) => {
                    if (i < arr.length - 1) {
                        return s + "/";
                    }
                    return s;
                }).filter(s => s !== null);
            });

            list.sort((a, b) => {
                const n = Math.min(a.length, b.length);
                for (let i = 0; i < n; i++) {
                    if (a[i] !== b[i]) {
                        const adir = +!a[i].endsWith("/");
                        const bdir = +!b[i].endsWith("/");
                        if (adir !== bdir) {
                            return adir - bdir;
                        } else {
                            const name1 = a[i].replace("/", "");
                            const name2 = b[i].replace("/", "");
                            return name1.localeCompare(name2);
                        }
                    }
                }
                return a.length - b.length;
            });

            const items = new Map();
            items.set("/", this.tree);

            list.forEach(path => {
                let full = "/";
                for (const part of path) {
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
