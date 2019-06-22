import { EventEmitter } from "../common/event.js";
import { elem, registerStyles } from "./common.js";
import { Panel } from "./panel.js";
import { styles } from "./menu.styles.js";

registerStyles(styles);

export class TitleBar extends Panel {
    constructor() {
        super("titlebar");
        this.append(elem("div", "titlebar-icon"));
        this.menu = this.append(new MenuBar());
    }
}

export class ContextMenu extends EventEmitter {
    constructor(menu) {
        super();
        this.element = elem("div", "context-menu");
        this.menuItem = new MenuItem();
        this.element.append(this.menuItem.element);
        this.menuItem.ownerMenu = this;
        this.menuItem.submenu = menu;
        this.menuItem.element.style.position = "absolute";
        this.menuItem.submenu.ownerItem = this.menuItem;
        this.onWindowMouseDown = this.onWindowMouseDown.bind(this);
    }

    get menu() {
        return this.menuItem.submenu;
    }

    open(x, y) {
        if (!this.element.parentElement) {
            const overlay = Menu.overlay(true);
            this.menuItem.element.style.left = `${x}px`;
            this.menuItem.element.style.top = `${y}px`;
            overlay.append(this.element);
            this.menuItem.submenu.open();
            window.addEventListener("mousedown", this.onWindowMouseDown, true);
        }
    }

    close() {
        if (this.element.parentElement) {
            this.menuItem.submenu.close();
            this.element.remove();
            Menu.removeOverlay();
            window.removeEventListener("mousedown", this.onWindowMouseDown, true);
        }
    }

    onWindowMouseDown(event) {
        const isMenu = e => e && (e.classList.contains("menu") || isMenu(e.parentElement));
        if (!isMenu(event.target)) {
            this.close();
        }
    }

    onItemClick(item) {
        this.emit("itemclick", { item });
    }

    onMenuShow(menu) {
        this.emit("menushow", { menu });
    }
}

export class MenuBar extends Panel {
    constructor() {
        super("menubar");
        this.shouldClose = false;
        this.onBarMouseDown = this.onBarMouseDown.bind(this);
        this.onBarMouseUp = this.onBarMouseUp.bind(this);
        this.onBarMouseOver = this.onBarMouseOver.bind(this);
        this.onWindowMouseDown = this.onWindowMouseDown.bind(this);
        this.element.addEventListener("mousedown", this.onBarMouseDown);
    }

    activeItem() {
        return MenuItem.from(this.element.querySelector(".menu-item.active"));
    }

    open(menuItem) {
        const activeItem = this.activeItem();

        if (!activeItem) {
            this.shouldClose = false;
            this.element.addEventListener("mouseover", this.onBarMouseOver);
            this.element.addEventListener("mouseup", this.onBarMouseUp);
            window.addEventListener("mousedown", this.onWindowMouseDown, true);
        } else if (activeItem !== menuItem) {
            activeItem.submenu.close();
        }

        if (activeItem !== menuItem) {
            menuItem.submenu.open();
        }
    }

    close() {
        const activeItem = this.activeItem();
        if (activeItem) {
            activeItem.submenu.close();
        }
        this.element.removeEventListener("mouseover", this.onBarMouseOver);
        this.element.removeEventListener("mouseup", this.onBarMouseUp);
        window.removeEventListener("mousedown", this.onWindowMouseDown, true);
    }

    onBarMouseDown(event) {
        const menuItem = MenuItem.from(event);
        const activeItem = this.activeItem();
        this.shouldClose = true;
        if (menuItem && menuItem !== activeItem) {
            this.open(menuItem);
        } else if (!menuItem) {
            this.close();
        }
    }

    onBarMouseUp(event) {
        const menuItem = MenuItem.from(event);
        if (menuItem && this.shouldClose) {
            this.close();
        }
    }

    onBarMouseOver(event) {
        const menuItem = MenuItem.from(event);
        const activeItem = this.activeItem();
        if (menuItem && menuItem !== activeItem) {
            this.open(menuItem);
        }
    }

    onWindowMouseDown(event) {
        const isMenu = e => e && (["menu", "menubar"].some(cls => e.classList.contains(cls) || isMenu(e.parentElement)));
        if (!isMenu(event.target)) {
            this.close();
        } else {
            this.shouldClose = true;
        }
    }

    addItem(item) {
        item.ownerMenu = this;
        this.append(item.element);
        return item;
    }

    onItemClick(item) {
        this.emit("itemclick", { item });
    }

    onMenuShow(menu) {
        this.emit("menushow", { menu });
    }
}

export class Menu {
    constructor() {
        this.element = elem("div", "menu");
        this.ownerItem = null;
        this.onMouseOver = this.onMouseOver.bind(this);
        this.onMouseOut = this.onMouseOut.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    get visible() {
        return !!this.element.parentElement;
    }

    get rootMenu() {
        let root = this;
        while (root instanceof Menu) {
            root = root.ownerItem.ownerMenu;
        }
        return root;
    }

    get items() {
        return Array.from(this.element.querySelectorAll(".menu-item")).map(e => MenuItem.from(e));
    }

    addItem(item) {
        item.ownerMenu = this;
        this.element.append(item.element);
        return item;
    }

    activeItem() {
        return MenuItem.from(this.element.querySelector(".menu-item.active"));
    }

    onShow() {
        this.element.addEventListener("mouseover", this.onMouseOver);
        this.element.addEventListener("mouseout", this.onMouseOut);
        this.element.addEventListener("mousedown", this.onMouseDown);
        this.element.addEventListener("mouseup", this.onMouseUp);
        this.rootMenu.onMenuShow(this);
    }

    onClose() {
        this.element.removeEventListener("mouseover", this.onMouseOver);
        this.element.removeEventListener("mouseout", this.onMouseOut);
        this.element.removeEventListener("mousedown", this.onMouseDown);
        this.element.removeEventListener("mouseup", this.onMouseUp);
    }

    onShowSubmenu(menuItem) {
        const items = Array.from(this.element.querySelectorAll(".menu-item.has-submenu"));
        items.map(item => MenuItem.from(item)).forEach(item => item !== menuItem && item.submenu.close());
        if (menuItem.submenu) {
            menuItem.submenu.open();
        }
    }

    onMouseOver(event) {
        const menuItem = MenuItem.from(event);
        if (menuItem) {
            const activeItem = this.activeItem();
            if (activeItem && activeItem !== menuItem) {
                activeItem.active = false;
            }
            Menu.timeout(() => this.onShowSubmenu(menuItem));
        }
        if (this.ownerItem) {
            this.ownerItem.active = true;
        }
        event.stopPropagation();
    }

    onMouseOut(event) {
        const menuItem = MenuItem.from(event);
        if (menuItem) {
            const isSelfOrSubmenu = e => e && (menuItem.element.contains(e) || menuItem.submenu.element.contains(e));
            if (menuItem.submenu && !isSelfOrSubmenu(event.relatedTarget)) {
                menuItem.active = false;
                Menu.timeout(() => menuItem.submenu.close());
            }
        }
        event.stopPropagation();
    }

    onMouseDown(event) {
        const menuItem = MenuItem.from(event);
        if (menuItem) {
            if (menuItem.hasSubmenu) {
                Menu.timeout(null);
                this.onShowSubmenu(menuItem);
            }
        }
    }

    onMouseUp(event) {
        const menuItem = MenuItem.from(event);
        if (menuItem) {
            if (menuItem.hasSubmenu) {
                Menu.timeout(null);
                this.onShowSubmenu(menuItem);
            } else if (event.button === 0 && menuItem.enabled) {
                const root = this.rootMenu;
                root.close();
                root.onItemClick(menuItem);
            }
        }
    }

    static timeout(func) {
        if (Menu.timer) {
            clearTimeout(Menu.timer);
        }
        Menu.timer = func ? setTimeout(func, 300) : null;
    }

    static overlay(create = false) {
        let element = document.querySelector("body > .menu-overlay");
        if (!element && create) {
            element = elem("div", "menu-overlay");
            document.body.append(element);
        }
        return element;
    }

    static removeOverlay() {
        const overlay = Menu.overlay();
        if (!overlay.hasChildNodes()) {
            overlay.remove();
        }
    }

    open() {
        if (!this.element.parentElement) {
            const menuItem = this.ownerItem;
            menuItem.active = true;

            const overlay = Menu.overlay(true);
            const rect = menuItem.element.getBoundingClientRect();

            if ((menuItem.ownerMenu instanceof MenuBar) || (menuItem.ownerMenu instanceof ContextMenu)) {
                this.element.style.left = rect.left + "px";
                this.element.style.top = (rect.top + rect.height) + "px";
            } else {
                this.element.style.left = (rect.left + rect.width + 1) + "px";
                this.element.style.top = (rect.top - 1) + "px";
            }

            overlay.append(this.element);
            this.onShow();
        }
    }

    close() {
        if (this.element.parentElement) {
            const menuItem = this.ownerItem;
            const items = Array.from(this.element.querySelectorAll(".menu-item.has-submenu"));
            items.forEach(item => MenuItem.from(item).submenu.close());
            menuItem.active = false;
            this.element.remove();
            this.onClose();
            Menu.removeOverlay();
        }
    }
}

export class MenuItem {
    constructor(title, key) {
        this.element = elem("div", "menu-item");
        this.ownerMenu = null;
        this.submenu = null;
        this.key = key;

        if (title) {
            const label = elem("label");
            label.textContent = title;
            this.element.append(label);
        }

        const items = MenuItem.itemByElement || (MenuItem.itemByElement = new WeakMap());
        items.set(this.element, this);
    }

    addItem(item) {
        if (!this.submenu) {
            this.submenu = new Menu();
            this.submenu.ownerItem = this;
            this.hasSubmenu = true;
        }

        this.submenu.addItem(item);
        return item;
    }

    set keyBinding(value) {
        if (value) {
            this._keyBinding = this._keyBinding || (this._keyBinding = elem("label"));
            this._keyBinding.textContent = value;
            if (!this._keyBinding.parentElement) {
                this.element.append(this._keyBinding);
            }
        } else if (this._keyBinding) {
            this._keyBinding.remove();
            this._keyBinding = null;
        }
    }

    get active() { return this.element.classList.contains("active"); }
    get checked() { return this.element.classList.contains("checked"); }
    get enabled() { return !this.element.classList.contains("disabled"); }
    get hasSubmenu() { return this.element.classList.contains("has-submenu"); }
    set active(value) { this.element.classList.toggle("active", value); }
    set checked(value) { this.element.classList.toggle("checked", value); }
    set enabled(value) { this.element.classList.toggle("disabled", !value); }
    set hasSubmenu(value) { this.element.classList.toggle("has-submenu", value); }

    static from(object) {
        const items = MenuItem.itemByElement || (MenuItem.itemByElement = new WeakMap());
        if (object instanceof MouseEvent) {
            return items.get(object.target) || items.get(object.target.parentElement);
        } else if (object instanceof HTMLElement) {
            return items.get(object);
        }
    }
}

export class MenuSeparator extends MenuItem {
    constructor() {
        super();
        this.element.classList.add("separator");
    }

    set active(value) { }
    set checked(value) { }
    set enabled(value) { }
}
