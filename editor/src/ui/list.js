import { elem, registerStyles } from "./common.js";
import { Panel } from "./panel.js";
import { styles } from "./list.styles.js";

registerStyles(styles);

export class ListView extends Panel {
    constructor() {
        super("list-view");
        ListView.listByElement.set(this.element, this);
        this.list = this.append(elem("ul"));
        this.list.addEventListener("click", e => this.onClick(e));
    }

    get activeItem() {
        return ListViewItem.from(this.list.querySelector("li.active"));
    }

    set activeItem(item) {
        const activeItem = this.activeItem;
        if (activeItem) activeItem.active = false;
        if (item) item.active = true;
    }

    addItem(item) {
        this.list.append(item.element);
        return item;
    }

    onClick(event) {
        if (event.button === 0) {
            const item = ListViewItem.from(event.target);
            if (item) this.emit("itemclick", { item });
        }
    }

    *items() {
        for (const element of this.list.children) {
            yield ListViewItem.from(element);
        }
    }

    static get listByElement() {
        return ListView._listByElement || (ListView._listByElement = new WeakMap());
    }

    static from(element) {
        return ListView.listByElement.get(element);
    }
}

export class ListViewItem {
    constructor(text, data) {
        const label = elem("label");
        label.textContent = text;
        this.element = elem("li");
        this.element.setAttribute("tabindex", 0);
        this.element.append(label);
        this.data = data;
        ListViewItem.itemByElement.set(this.element, this);
        ListViewItem.itemByElement.set(label, this);
    }

    get active() {
        return this.element.classList.contains("active");
    }

    set active(value) {
        this.element.classList.toggle("active", value);
    }

    set keyBinding(value) {
        if (value) {
            this._keyBinding = this._keyBinding || (this._keyBinding = elem("label"));
            this._keyBinding.textContent = value;
            if (!this._keyBinding.parentElement) {
                this.element.append(this._keyBinding);
                ListViewItem.itemByElement.set(this._keyBinding, this);
            }
        } else if (this._keyBinding) {
            ListViewItem.itemByElement.delete(this._keyBinding);
            this._keyBinding.remove();
            this._keyBinding = null;
        }
    }

    static get itemByElement() {
        return ListViewItem._itemByElement || (ListViewItem._itemByElement = new WeakMap());
    }

    static from(element) {
        return ListViewItem.itemByElement.get(element);
    }
}
