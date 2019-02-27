import { Panel, elem } from "./common.js";

export class ListView extends Panel {
    constructor() {
        super("list-view");
        ListView.listByElement.set(this.element, this);
        this.list = this.append(elem("ul"));
        this.list.addEventListener("click", e => this.onClick(e));
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
        this.element = elem("li");
        this.element.textContent = text;
        this.element.setAttribute("tabindex", 0);
        this.data = data;
        ListViewItem.itemByElement.set(this.element, this);
    }

    static get itemByElement() {
        return ListViewItem._itemByElement || (ListViewItem._itemByElement = new WeakMap());
    }

    static from(element) {
        return ListViewItem.itemByElement.get(element);
    }
}
