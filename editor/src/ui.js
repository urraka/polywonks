export class Panel {
    constructor(className = "") {
        this.element = document.createElement("div");
        this.element.classList.add("panel");
        if (className) this.element.classList.add(className);
    }

    append(panel) {
        this.element.append(panel instanceof Panel ? panel.element : panel);
        return panel;
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
        this.left = new Panel();
        this.right = new Panel();
        this.append(this.left);
        this.append(this.right);
    }

    addItem(name, side, width) {
        const item = document.createElement("div");
        item.classList.add("statusbar-item");
        item.style.width = width + "px";
        this.items.set(name, item);
        this[side].append(item);
    }

    set(name, value) {
        this.items.get(name).textContent = value;
    }
}
