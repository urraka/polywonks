import * as ui from "./ui/ui.js";
import { iter } from "./common/iter.js";
import { EventEmitter } from "./common/event.js";
import { Editor } from "./editor/editor.js";
import { Settings, cfg } from "./settings.js";

const MENU = [
    ["File", [
        ["New", "new-map"],
        [],
        ["Open...", "show-explorer"],
        [],
        ["Save", "save"],
        ["Save As...", "save-as"],
        ["Download...", "save-download"],
        [],
        ["Export", "export"],
        ["Export As...", "export-as"],
        ["Export Download...", "export-download"],
    ]],
    ["Edit", [
        ["Undo", "undo"],
        ["Redo", "redo"],
        [],
        ["Delete", "delete"],
        [],
        ["Cut", "cut"],
        ["Copy", "copy"],
        ["Paste", "paste"],
    ]],
    ["Selection", [
        ["Switch Vertices/Polygons", "selection-vert-switch"],
    ]],
    ["Object", [
        ["Texture", [
            ["Reset", "texture-reset"],
            [],
            ["Rotate 90° CW", "texture-rotate-90-cw"],
            ["Rotate 90° CCW", "texture-rotate-90-ccw"],
            ["Flip Horizontal", "texture-flip-horizontal"],
            ["Flip Vertical", "texture-flip-vertical"],
        ]],
        [],
        ["Rotate 90° CW", "rotate-90-cw"],
        ["Rotate 90° CCW", "rotate-90-ccw"],
        ["Flip Horizontal", "flip-horizontal"],
        ["Flip Vertical", "flip-vertical"],
        [],
        ["Send to Back", "send-to-back"],
        ["Send Backward", "send-backward"],
        ["Bring Forward", "bring-forward"],
        ["Bring to Front", "bring-to-front"],
    ]],
    ["View", [
        ["Reset Viewport", "reset-viewport"],
        ["Zoom In", "zoom-in"],
        ["Zoom Out", "zoom-out"],
        [],
        ["Snap to Grid", "toggle-snap-to-grid"],
        ["Snap to Objects", "toggle-snap-to-objects"],
        [],
        ["Show Grid", "toggle-grid"],
        ["Show Background", "toggle-background"],
        ["Show Vertices", "toggle-vertices"],
        ["Show Wireframe", "toggle-wireframe"],
        ["Polygons", [
            ["Texture", "show-polygon-texture"],
            ["Plain Color", "show-polygon-plain"],
            ["Hide", "show-polygon-none"],
        ]],
    ]],
    ["Help", [
        ["Github", "browse-to-github"],
    ]],
];

export class AppMenu extends EventEmitter {
    constructor(app) {
        super();
        this.items = {};
        this.invalidatedItems = new Set();
        this.titlebar = new ui.TitleBar();
        this.keybindings = app.keybindings;

        this.onEditorFunctionChange = this.onEditorFunctionChange.bind(this);
        this.titlebar.menu.on("itemclick", e => this.onMenuItemClick(e.item));
        this.titlebar.menu.on("menushow", e => this.onMenuShow(e.menu));
        Settings.on("change", e => this.onSettingChange(e.setting));

        this.addMenuItems(this.titlebar.menu, MENU);
        this.updateItems();
    }

    get element() {
        return this.titlebar.element;
    }

    get editor() {
        return this._editor;
    }

    set editor(editor) {
        if (editor !== this.editor) {
            if (this.editor) {
                this.editor.off("functionchange", this.onEditorFunctionChange);
            }
            if (editor) {
                editor.on("functionchange", this.onEditorFunctionChange);
            }
            this._editor = editor;
            this.updateEditorItems();
        }
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
            item.keyBinding = this.keybindings.find(item.key);
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
