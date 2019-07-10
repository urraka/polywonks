import * as ui from "../ui/ui.js";
import { iter } from "../common/iter.js";
import { EventEmitter } from "../common/event.js";
import { Editor } from "../editor/editor.js";
import { Settings, cfg } from "./settings.js";
import { KeyBindings } from "./keybindings.js";
import { MenuItems } from "./menu.config.js";

export class Menu extends EventEmitter {
    constructor(app) {
        super();
        this.items = {};
        this.invalidatedItems = new Set();
        this.titlebar = new ui.TitleBar();

        this.onEditorFunctionChange = this.onEditorFunctionChange.bind(this);
        this.titlebar.menu.on("itemclick", e => this.onMenuItemClick(e.item));
        this.titlebar.menu.on("menushow", e => this.onMenuShow(e.menu));
        Settings.on("change", e => this.onSettingChange(e.setting));
        app.on("activeeditorchange", e => this.onEditorChange(e.editor));

        this.addMenuItems(this.titlebar.menu, MenuItems);
        this.updateItems();
    }

    get element() {
        return this.titlebar.element;
    }

    get editor() {
        return this._editor;
    }

    onEditorChange(editor) {
        if (this.editor) {
            this.editor.off("functionchange", this.onEditorFunctionChange);
        }
        this._editor = editor;
        if (this.editor) {
            this.editor.on("functionchange", this.onEditorFunctionChange);
        }
        this.updateEditorItems();
    }

    get editorItems() {
        return this._editorItems || (
            this._editorItems = new Set(iter(Object.values(this.items)).filter(item => {
                return Editor.isEditorFunction(item.key);
            }))
        );
    }

    get settingItems() {
        return this._settingItems || (
            this._settingItems = new Set(iter(Object.values(this.items)).filter(item => {
                return !Editor.isEditorFunction(item.key);
            }))
        );
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

    updateSettingItems() {
        for (const item of this.settingItems) {
            this.updateItem(item);
        }
    }

    updateItem(item) {
        if (item.ownerMenu.visible) {
            item.enabled = this.isMenuItemEnabled(item);
            item.checked = this.isMenuItemChecked(item);
            item.keyBinding = KeyBindings.find(item.key);
            this.invalidatedItems.delete(item);
        } else {
            this.invalidatedItems.add(item);
        }
    }

    isMenuItemEnabled(item) {
        if (this.editorItems.has(item)) {
            const editor = this.editor;
            return !!(editor && editor.functions[item.key].enabled);
        }
        return true;
    }

    isMenuItemChecked(item) {
        if (this.settingItems.has(item)) {
            switch (item.key) {
                case "toggle-snap-to-grid": return cfg("editor.snap-to-grid");
                case "toggle-snap-to-objects": return cfg("editor.snap-to-objects");
                case "toggle-grid": return cfg("view.grid");
                case "toggle-background": return cfg("view.background");
                case "toggle-vertices": return cfg("view.vertices");
                case "toggle-wireframe": return cfg("view.wireframe");
                case "show-polygon-texture": return cfg("view.polygons") === "texture";
                case "show-polygon-plain": return cfg("view.polygons") === "plain";
                case "show-polygon-none": return cfg("view.polygons") === "none";
            }
        }
        return false;
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

    onSettingChange() {
        this.updateSettingItems();
    }

    onEditorFunctionChange(event) {
        if (event.name in this.items) {
            this.updateItem(this.items[event.name]);
        }
    }
}
