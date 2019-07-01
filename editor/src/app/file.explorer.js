import * as ui from "../ui/ui.js";
import { Path } from "../common/path.js";
import { EventEmitter } from "../common/event.js";
import { File } from "./file.js";

export class FileExplorer extends EventEmitter {
    constructor(mount) {
        super("explorer");
        this.mount = mount;
        this.tree = new ui.TreeView();
        this.tree.on("itemdblclick", e => this.onItemDblClick(e.item.data));
        this.tree.on("contextmenu", () => this.onContextMenu());
        this.tree.contextMenu = new ui.ContextMenu(this.createMenu());
        this.tree.contextMenu.on("itemclick", e => this.onContextMenuItemClick(e.item));
        File.on("write", e => this.onFileWrite(e));
        setTimeout(() => this.refresh());
    }

    get selectedPaths() {
        return this.tree.selectedItems.map(item => item.data);
    }

    createMenu() {
        const menu = new ui.Menu();
        menu.addItem(new ui.MenuItem("Add As Scenery", "add-image"));
        menu.addItem(new ui.MenuItem("Add As Texture", "add-texture"));
        return menu;
    }

    onFileWrite(event) {
        if (event.path.startsWith(`/${this.mount}/`)) {
            this.refresh();
        }
    }

    onItemDblClick(path) {
        this.emit("open", { path });
    }

    isImage(path) {
        return [".png", ".jpg", ".gif", ".bmp"].includes(Path.ext(path).toLowerCase());
    }

    onContextMenu() {
        const imagesSelected = this.selectedPaths.some(path => this.isImage(path));
        for (const item of this.tree.contextMenu.menu.items) {
            item.enabled = imagesSelected;
        }
    }

    onContextMenuItemClick(item) {
        this.emit("command", {
            command: "add-resources",
            params: {
                type: item.key.replace(/^add-/, ""),
                paths: this.selectedPaths.filter(path => this.isImage(path)),
            },
        });
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
