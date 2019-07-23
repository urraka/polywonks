import * as ui from "../ui/ui.js";
import { iter } from "../common/iter.js";
import { EventEmitter } from "../common/event.js";
import { menu as MenuItems } from "../config.js";
import { Keybindings } from "./keybindings.js";
import { Command } from "./command.js";

export class Menu extends EventEmitter {
    constructor(app) {
        super();
        this.app = app;
        this.items = {};
        this.invalidatedItems = new Set();
        this.titlebar = new ui.TitleBar();

        this.onCommandChange = this.onCommandChange.bind(this);
        this.titlebar.menu.on("itemclick", e => this.onMenuItemClick(e.item));
        this.titlebar.menu.on("menushow", e => this.onMenuShow(e.menu));
        app.on("activeeditorchange", e => this.onEditorChange(e.editor));
        app.on("commandchange", this.onCommandChange);

        this.addMenuItems(this.titlebar.menu, MenuItems);
        this.updateItems();
    }

    get element() {
        return this.titlebar.element;
    }

    get editor() {
        return this._editor;
    }

    get editorItems() {
        return this._editorItems || (
            this._editorItems = new Set(iter(Object.values(this.items)).filter(item => {
                return !Command.find(this.app, item.key);
            }))
        );
    }

    onEditorChange(editor) {
        if (this.editor) {
            this.editor.off("commandchange", this.onCommandChange);
        }
        this._editor = editor;
        if (this.editor) {
            this.editor.on("commandchange", this.onCommandChange);
        }
        this.updateEditorItems();
    }

    addMenuItems(menu, items) {
        for (const item of items) {
            if (item.length === 0) {
                menu.addItem(new ui.MenuSeparator());
            } else if (item.length === 1 || typeof item[1] === "string") {
                const menuItem = menu.addItem(new ui.MenuItem(item[0], item[1]));
                if (item[1]) {
                    this.items[item[1]] = menuItem;
                }
            } else {
                this.addMenuItems(menu.addItem(new ui.MenuItem(item[0])), item[1]);
            }
        }
    }

    menuItems(menu) {
        const itemsByMenu = this._itemsByMenu || (this._itemsByMenu = new Map());
        let items = itemsByMenu.get(menu);
        if (!items) {
            items = menu.items.filter(item => !!item.key);
            itemsByMenu.set(menu, items);
        }
        return items;
    }

    updateItems() {
        for (const item of Object.values(this.items)) {
            this.updateItem(item);
        }
    }

    updateEditorItems() {
        for (const item of this.editorItems) {
            this.updateItem(item);
        }
    }

    updateItem(item) {
        if (item.ownerMenu.visible) {
            const command = this.app.findCommand(item.key);
            if (command) {
                item.enabled = command.enabled;
                item.checked = command.checked;
            } else {
                item.enabled = false;
            }
            item.keyBinding = Keybindings.find(item.key);
            this.invalidatedItems.delete(item);
        } else {
            this.invalidatedItems.add(item);
        }
    }

    onMenuItemClick(item) {
        this.emit("command", { command: item.key });
    }

    onMenuShow(menu) {
        if (this.invalidatedItems.size > 0) {
            for (const item of this.menuItems(menu)) {
                if (this.invalidatedItems.has(item)) {
                    this.updateItem(item);
                }
            }
        }
    }

    onCommandChange(event) {
        if (event.name in this.items) {
            this.updateItem(this.items[event.name]);
        }
    }
}
