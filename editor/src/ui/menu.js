import { Panel, elem } from "./common.js";
import { Command } from "./command.js";

export class TitleBar extends Panel {
    constructor() {
        super("titlebar");
        this.append(elem("div", "titlebar-icon"));
        this.menu = this.append(new MenuBar());
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

        [...this.element.children].map(e => MenuItem.from(e)).forEach(menuItem => {
            const command = Command.find(menuItem.command);
            menuItem.enabled = command.enabled;
            menuItem.checked = command.checked;
        });
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
        event.stopPropagation();
    }

    onMouseOut(event) {
        const menuItem = MenuItem.from(event);
        if (menuItem) {
            const isSubmenu = e => e && (e === menuItem.submenu.element || isSubmenu(e.parentElement));
            if (menuItem.submenu && !isSubmenu(event.relatedTarget)) {
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
            } else if (menuItem.enabled) {
                let menu = this;
                while (menu instanceof Menu) {
                    menu = menu.ownerItem.ownerMenu;
                }
                menu.close();
                Command.find(menuItem.command).execute();
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

            if (menuItem.ownerMenu instanceof MenuBar) {
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
    constructor(title, command) {
        this.element = elem("div", "menu-item");
        this.ownerMenu = null;
        this.submenu = null;
        this.command = command;

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

    get active() { return this.element.classList.contains("active"); }
    get checked() { return this.element.classList.contains("checked"); }
    get enabled() { return !this.element.classList.contains("disabled"); }
    get hasSubmenu() { return this.element.classList.contains("has-submenu"); }
    set active(value) { this.element.classList[value ? "add" : "remove"]("active"); }
    set checked(value) { this.element.classList[value ? "add" : "remove"]("checked"); }
    set enabled(value) { this.element.classList[!value ? "add" : "remove"]("disabled"); }
    set hasSubmenu(value) { this.element.classList[value ? "add" : "remove"]("has-submenu"); }

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
