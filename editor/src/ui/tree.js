import { elem, registerStyles } from "./common.js";
import { Panel } from "./panel.js";
import { styles } from "./tree.styles.js";

registerStyles(styles);

export class TreeView extends Panel {
    constructor() {
        super("tree-view");
        TreeView.treeByElement.set(this.element, this);
        this.items = this.append(elem("ul"));
        this.element.addEventListener("mousedown", e => this.onMouseDown(e));
        this.element.addEventListener("dblclick", e => this.onDoubleClick(e));
    }

    get contextMenu() {
        return this._contextMenu;
    }

    set contextMenu(contextMenu) {
        this._contextMenu = contextMenu;
    }

    get selectedItems() {
        return Array.from(this.items.querySelectorAll(".selected"), element => TreeItem.from(element));
    }

    get selectedItem() {
        const element = this.items.querySelector(".selected");
        return element ? TreeItem.from(element) : null;
    }

    addItem(item, beforeItem = null) {
        this.items.insertBefore(item.element, beforeItem ? beforeItem.element : null);
        return item;
    }

    clear() {
        const selectedItem = this.selectedItem;
        Array.from(this.items.children, el => TreeItem.from(el)).forEach(item => item.remove());
        if (selectedItem) this.emit("selectionchange");
    }

    clearSelected() {
        for (const item of this.selectedItems) {
            item.selected = false;
        }
    }

    onMouseDown(event) {
        const item = TreeItem.from(event.target);

        if (item) {
            switch (event.target) {
                case item.element: {
                    if (event.button === 0) {
                        item.expanded = !item.expanded;
                    }
                    break;
                }

                case item.label:
                    if (!item.selected) {
                        this.clearSelected();
                        item.selected = true;
                        this.emit("selectionchange");
                    }
                    break;

                case item.iconElement: {
                    if (event.button === 0) {
                        this.emit("itemiconclick", { item });
                    }
                    break;
                }
            }
        } else {
            const selectedItem = this.selectedItem;
            this.clearSelected();
            if (selectedItem) this.emit("selectionchange");
        }

        if (event.button === 2) {
            if (this.contextMenu && this.emit("contextmenu")) {
                this.contextMenu.open(event.clientX, event.clientY);
            }
        }
    }

    onDoubleClick(event) {
        if (event.button === 0) {
            const item = TreeItem.from(event.target);
            if (item && event.target !== item.element) {
                item.expanded = !item.expanded;
                this.emit("itemdblclick", { item });
            }
        }
    }

    static get treeByElement() {
        return TreeView._treeByElement || (TreeView._treeByElement = new WeakMap());
    }

    static from(element) {
        return TreeView.treeByElement.get(element);
    }
}

export class TreeItem {
    constructor(text, data, withSubitems = false) {
        this.data = data;
        this.element = elem("li");
        this.iconElement = null;
        this.label = elem("label");
        this.subitems = null;
        this.withSubitems = withSubitems;

        TreeItem.itemByElement.set(this.element, this);
        TreeItem.itemByElement.set(this.label, this);

        this.label.setAttribute("tabindex", -1);
        this.text = text;
        this.element.append(this.label);

        if (withSubitems) {
            this.element.classList.add("with-subitems");
            this.expanded = false;
        }
    }

    addItem(item, beforeItem = null) {
        if (!this.subitems) {
            this.subitems = elem("ul");
            this.element.append(this.subitems);
            this.element.classList.add("with-subitems");
            this.expanded = false;
        }

        this.subitems.insertBefore(item.element, beforeItem ? beforeItem.element : null);
        return item;
    }

    remove() {
        if (this.element.parentElement) {
            const ul = this.element.parentElement;
            const parentItem = TreeItem.from(ul.parentElement);
            this.element.remove();
            if (parentItem) parentItem.onSubitemRemoved();
        }
    }

    onSubitemRemoved() {
        if (this.subitems && this.subitems.childElementCount === 0) {
            this.subitems.remove();
            this.subitems = null;
            if (!this.withSubitems) {
                this.element.classList.remove("with-subitems");
            }
        }
    }

    get text() {
        return this.label.textContent;
    }

    set text(value) {
        this.label.textContent = value;
    }

    get icon() {
        return this.iconElement ? this.iconElement.className : null;
    }

    set icon(value) {
        if (value) {
            if (!this.iconElement) {
                this.iconElement = elem("span", value);
                this.element.prepend(this.iconElement);
                TreeItem.itemByElement.set(this.iconElement, this);
            } else {
                this.iconElement.className = value;
            }
        } else {
            if (this.iconElement) {
                this.iconElement.remove();
                TreeItem.itemByElement.delete(this.iconElement);
            }
        }
    }

    get expanded() {
        return !this.element.classList.contains("collapsed");
    }

    set expanded(value) {
        this.element.classList.toggle("collapsed", !value);
    }

    get selected() {
        return this.element.classList.contains("selected");
    }

    set selected(value) {
        this.element.classList.toggle("selected", value);
    }

    static get itemByElement() {
        return TreeItem._itemByElement || (TreeItem._itemByElement = new WeakMap());
    }

    static from(element) {
        return TreeItem.itemByElement.get(element);
    }
}
