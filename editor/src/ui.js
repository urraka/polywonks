const dataMap = new WeakMap();

function elem(tag, className) {
    const element = document.createElement(tag);

    if (className) {
        if (typeof className === "string") {
            element.classList.add(className);
        } else {
            className.forEach(clss => clss && element.classList.add(clss));
        }
    }

    return element;
}

export class Panel {
    constructor(className = "") {
        this.element = elem("div", ["panel", className]);
    }

    append(element) {
        this.element.append(element.element || element);
        return element;
    }
}

export class SplitView extends Panel {
    constructor(initialDistance) {
        super("splitview");

        this.panels = [
            this.append(new Panel()),
            this.append(new Panel())
        ];

        this.distance = initialDistance;
    }

    set distance(value) {
        this.panels[0].element.style.width = value + "px";
        this.panels[1].element.style.left = value + "px";
    }
}

export class Statusbar extends Panel {
    constructor() {
        super("statusbar");
        this.items = new Map();
        this.left = this.append(new Panel());
        this.right = this.append(new Panel());
    }

    addItem(name, side, width) {
        const item = elem("div", "statusbar-item");
        item.style.width = width + "px";
        this.items.set(name, item);
        this[side].append(item);
    }

    set(name, value) {
        this.items.get(name).textContent = value;
    }
}

export class TreeView extends Panel {
    constructor() {
        super("tree-view");
        this.handlers = {"item-select": [], "item-dblclick": []};
        this.selected = new Set();
        this.list = this.append(elem("ul"));
        this.element.addEventListener("mousedown", e => this.onClick(e));
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
            this.handlers["item-select"].forEach(h => h(event, null));
        }
    }

    on(eventType, handler) {
        if (!(eventType in this.handlers)) {
            throw new Error("Invalid event type");
        }
        this.handlers[eventType].push(handler);
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
            this.handlers["item-select"].forEach(h => h(event, dataMap.get(li)));
        }
    }

    onClick(event) {
        if (event.target.tagName === "LI") {
            event.target.classList.toggle("collapsed");
            this.selectItem(event.target);
        } else if (event.target.tagName === "LABEL") {
            this.selectItem(event.target.parentElement);
        } else {
            this.clearSelected();
            this.handlers["item-select"].forEach(h => h(event, null));
        }
    }

    onDoubleClick(event) {
        if (event.target.tagName === "LABEL") {
            const li = event.target.parentElement;
            if (li.classList.contains("with-subitems")) {
                li.classList.toggle("collapsed");
            }
            this.handlers["item-dblclick"].forEach(h => h(event, dataMap.get(li)));
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

export class PanelHeader {
    constructor(text) {
        this.element = elem("div", "panel-header");
        this.element.textContent = text;
    }
}
