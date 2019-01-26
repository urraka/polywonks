import { Panel, elem } from "./common.js";

const dataMap = new WeakMap();

export class TreeView extends Panel {
    constructor() {
        super("tree-view");
        this.selected = new Set();
        this.list = this.append(elem("ul"));
        this.element.addEventListener("mousedown", e => this.onMouseDown(e));
        this.element.addEventListener("dblclick", e => this.onDoubleClick(e));
    }

    addItem(item) {
        this.list.append(item.element);
        return item;
    }

    clear() {
        while (this.list.firstChild) {
            this.list.removeChild(this.list.firstChild);
        }

        if (this.selected.size > 0) {
            this.clearSelected();
            this.emit("itemselect", { data: null });
        }
    }

    clearSelected() {
        for (const li of this.selected) {
            li.classList.remove("selected");
        }
        this.selected.clear();
    }

    selectItem(li) {
        if (!this.selected.has(li)) {
            this.clearSelected();
            this.selected.add(li);
            li.classList.add("selected");
            this.emit("itemselect", { data: dataMap.get(li) });
        }
    }

    onMouseDown(event) {
        if (event.button === 0) {
            if (event.target.tagName === "LI") {
                event.target.classList.toggle("collapsed");
            } else if (event.target.tagName === "LABEL") {
                this.selectItem(event.target.parentElement);
            } else if (event.target.tagName === "SPAN") {
                this.emit("iconclick", { data: dataMap.get(event.target.parentElement) });
            } else {
                this.clearSelected();
                this.emit("itemselect", { data: null });
            }
        }
    }

    onDoubleClick(event) {
        if (event.target.tagName === "LABEL") {
            const li = event.target.parentElement;
            if (li.classList.contains("with-subitems")) {
                li.classList.toggle("collapsed");
            }
            this.emit("itemdblclick", { data: dataMap.get(li) });
        }
    }
}

export class TreeItem {
    constructor(text, data, subitems = false) {
        this.element = elem("li");
        this.label = elem("label");
        this.label.setAttribute("tabindex", -1);
        this.subitems = null;
        this.element.append(this.label);
        this.label.textContent = text;

        dataMap.set(this.element, data);

        if (subitems) {
            this.element.classList.add("with-subitems");
            this.element.classList.add("collapsed");
        }
    }

    set icon(value) {
        if (this.element.firstElementChild.tagName !== "SPAN") {
            this.element.prepend(elem("span", value));
        } else {
            this.element.firstElementChild.className = value;
        }
    }

    set expanded(value) {
        this.element.classList.toggle("collapsed", !value);
    }

    addItem(item) {
        if (!this.subitems) {
            this.subitems = elem("ul");
            this.element.append(this.subitems);
            this.element.classList.add("with-subitems");
            this.element.classList.add("collapsed");
        }

        this.subitems.append(item.element);
        return item;
    }
}
